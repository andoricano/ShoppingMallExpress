-- ============================================================
-- Local verification: Mall v3 Phase 2 stock / allocation / sellability
-- (migration 20260926140000_v3_phase2_stock_allocation_core.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/verification/v3_phase2_stock.sql
--
-- Runs in one transaction and is ROLLED BACK. Every negative case runs
-- in its own subtransaction. Service RPCs run as the owner (= trusted
-- server boundary); Consumer access runs as authenticated / anon.
--
-- Covers: S-02, S-03, S-16 (mechanics), S-17, S-28, S-37, sellability
-- (BR-18/19/46/47), multi-Ware order (BR-48), invariants (BR-43),
-- release idempotency (BR-17), grants (BR-20).
-- The conversion of v2 stock values is verified by
-- v3_phase2_cutover.sh; parallel allocation by v3_phase2_concurrency.sh.
-- ============================================================

\set ON_ERROR_STOP on

begin;

create temp table _results (
    scenario text,
    ok boolean,
    detail text
) on commit drop;

create temp table _fx (
    key text primary key,
    id uuid
) on commit drop;

grant select on _results, _fx to anon, authenticated;
grant insert on _results to anon, authenticated;

-- 'OK' or the SQLSTATE the statement failed with (subtransaction).
create function pg_temp._try(p_sql text) returns text
language plpgsql as $$
begin
    execute p_sql;
    return 'OK';
exception when others then
    return sqlstate;
end;
$$;

-- current/reserved of a Ware as text.
create function pg_temp._stock(p_ware uuid) returns text
language sql as $$
    select current_stock || '/' || reserved_stock from public.wares where id = p_ware;
$$;

create function pg_temp._order(p_client uuid, p_status text default 'PENDING') returns uuid
language plpgsql as $$
declare v uuid;
begin
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (p_client, p_status, 1000, 1000) returning id into v;
    return v;
end;
$$;

create function pg_temp._item(p_order uuid, p_product uuid, p_variant uuid, p_qty int) returns uuid
language plpgsql as $$
declare v uuid;
begin
    insert into public.order_items (
        order_id, product_id, product_variant_id, quantity,
        unit_price, line_total, product_name_snapshot)
    values (p_order, p_product, p_variant, p_qty, 1000, 1000 * p_qty, '__verify v3p2')
    returning id into v;
    return v;
end;
$$;

do $$
declare
    v_client uuid := gen_random_uuid();
    v_wh uuid;
    v_wa uuid;      -- main Ware, stock 10
    v_wz uuid;      -- Ware with stock 0
    v_wb uuid;      -- multi-Ware 1 (stock 3)
    v_wc uuid;      -- multi-Ware 2 (stock 3)
    v_lo uuid;      -- lower id of wb / wc
    v_hi uuid;
    v_created jsonb;
    v_product uuid;
    v_v1 uuid;      -- linked to wa
    v_v2 uuid;      -- no Ware
    v_v3 uuid;      -- linked to wz (stock 0)
    v_v4 uuid;      -- linked to wb + wc
    v_oa uuid; v_ia uuid;
    v_ob uuid; v_ib uuid;
    v_oc uuid; v_ic uuid;
    v_on uuid; v_in uuid;
    v_om uuid; v_im uuid;
    v_ox uuid; v_ix uuid;
    v_res text;
    v_n bigint;
    v_short bigint;
    v_alloc bigint;
    v_rec record;
    v_status text;
    v_avail boolean;
begin
    insert into auth.users (id) values (v_client);

    v_wh := public.create_warehouse('__verify v3p2 warehouse');
    v_wa := public.create_ware(v_wh, '__verify v3p2 A', null, 'GENERAL', 10);
    v_wz := public.create_ware(v_wh, '__verify v3p2 Z', null, 'GENERAL', 0);
    v_wb := public.create_ware(v_wh, '__verify v3p2 B', null, 'GENERAL', 3);
    v_wc := public.create_ware(v_wh, '__verify v3p2 C', null, 'GENERAL', 3);
    select id into v_lo from public.wares where id in (v_wb, v_wc) order by id limit 1;
    select id into v_hi from public.wares where id in (v_wb, v_wc) order by id desc limit 1;

    v_created := public.admin_create_product(
        '{"name":"__verify v3p2 product"}', '[]',
        '[{"price":1000,"skuCode":"__V3P2-1"},{"price":1000,"skuCode":"__V3P2-2"},{"price":1000,"skuCode":"__V3P2-3"},{"price":1000,"skuCode":"__V3P2-4"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_v1 := (v_created -> 'variantIds' ->> 0)::uuid;
    v_v2 := (v_created -> 'variantIds' ->> 1)::uuid;
    v_v3 := (v_created -> 'variantIds' ->> 2)::uuid;
    v_v4 := (v_created -> 'variantIds' ->> 3)::uuid;
    perform public.link_product_variant_ware(v_v1, v_wa);
    perform public.link_product_variant_ware(v_v3, v_wz);
    perform public.link_product_variant_ware(v_v4, v_wb);
    perform public.link_product_variant_ware(v_v4, v_wc);

    -- ============ S-37: stock 10, Order A x6, Order B x6 ============
    v_oa := pg_temp._order(v_client); v_ia := pg_temp._item(v_oa, v_product, v_v1, 6);
    v_ob := pg_temp._order(v_client); v_ib := pg_temp._item(v_ob, v_product, v_v1, 6);

    v_n := public.allocate_order_stock(v_oa);
    insert into _results values ('S-37: A x6 allocated 6, current 10 / reserved 6',
        v_n = 6 and pg_temp._stock(v_wa) = '10/6', v_n || ' ' || pg_temp._stock(v_wa));

    v_n := public.allocate_order_stock(v_ob);
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage(v_ob);
    insert into _results values ('S-02/S-37: B x6 is created short: allocated 4, shortage 2, no error',
        v_n = 4 and v_alloc = 4 and v_short = 2 and pg_temp._stock(v_wa) = '10/10',
        v_n || ' ' || v_alloc || ' ' || v_short || ' ' || pg_temp._stock(v_wa));

    v_res := pg_temp._try(format('select public.consume_order_allocation(%L)', v_ob));
    insert into _results values ('gate: an Order with shortage cannot consume (PROCESSING blocked)',
        v_res = 'P0001' and pg_temp._stock(v_wa) = '10/10', v_res);

    v_n := public.consume_order_allocation(v_oa);
    update public.orders set status = 'PROCESSING' where id = v_oa;
    insert into _results values ('S-37: A enters PROCESSING: consumed 6, current 4 / reserved 4',
        v_n = 6 and pg_temp._stock(v_wa) = '4/4', v_n || ' ' || pg_temp._stock(v_wa));

    v_res := pg_temp._try(format('select public.consume_order_allocation(%L)', v_oa));
    insert into _results values ('consume: cannot be applied twice (Order no longer PENDING)',
        v_res = 'P0001' and pg_temp._stock(v_wa) = '4/4', v_res);

    v_res := pg_temp._try(format('select public.release_order_allocation(%L)', v_oa));
    insert into _results values ('release: no allocation decrease after PROCESSING (BR-42)',
        v_res = 'P0001' and pg_temp._stock(v_wa) = '4/4', v_res);

    v_res := pg_temp._try(format('select public.allocate_order_item_stock(%L)', v_ia));
    insert into _results values ('allocate: only a PENDING Order can hold allocation',
        v_res = 'P0001', v_res);

    -- restock 6 (explicit; adjust_ware_stock is the physical-stock primitive)
    perform public.adjust_ware_stock(v_wa, 6);
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage(v_ob);
    insert into _results values ('S-17/S-37: restock 6 -> current 10 / reserved 4, B not auto-allocated',
        pg_temp._stock(v_wa) = '10/4' and v_alloc = 4 and v_short = 2,
        pg_temp._stock(v_wa) || ' ' || v_alloc || ' ' || v_short);

    -- S-28: a newer Order takes the stock before Admin allocates to B
    v_oc := pg_temp._order(v_client); v_ic := pg_temp._item(v_oc, v_product, v_v1, 3);
    v_n := public.allocate_order_stock(v_oc);
    insert into _results values ('S-28: a newer Order may take newly available stock',
        v_n = 3 and pg_temp._stock(v_wa) = '10/7', v_n || ' ' || pg_temp._stock(v_wa));

    -- S-16: Admin additional allocation tops up the shortage
    v_n := public.allocate_order_item_stock(v_ib);
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage(v_ob);
    insert into _results values ('S-16: additional allocation for B: +2, shortage 0, reserved 9',
        v_n = 2 and v_alloc = 6 and v_short = 0 and pg_temp._stock(v_wa) = '10/9',
        v_n || ' ' || v_alloc || ' ' || v_short || ' ' || pg_temp._stock(v_wa));

    v_n := public.allocate_order_item_stock(v_ib);
    insert into _results values ('allocate: a fully allocated OrderItem allocates nothing more',
        v_n = 0 and pg_temp._stock(v_wa) = '10/9', v_n::text);

    -- ============ invariants (BR-43) ============
    v_res := pg_temp._try(format('select public.adjust_ware_stock(%L, -2)', v_wa));
    insert into _results values ('invariant: adjust below reserved_stock rejected',
        v_res <> 'OK' and pg_temp._stock(v_wa) = '10/9', v_res);

    v_res := pg_temp._try(format('select public.set_ware_stock(%L, 5)', v_wa));
    insert into _results values ('invariant: set_ware_stock below reserved_stock rejected',
        v_res <> 'OK' and pg_temp._stock(v_wa) = '10/9', v_res);

    v_res := pg_temp._try(format('update public.wares set reserved_stock = 11 where id = %L', v_wa));
    insert into _results values ('invariant: reserved above current rejected by the table (23514)',
        v_res = '23514', v_res);

    v_ox := pg_temp._order(v_client); v_ix := pg_temp._item(v_ox, v_product, v_v1, 100);
    v_n := public.allocate_order_stock(v_ox);
    insert into _results values ('invariant: over-demand allocates only what is available (never over-reserved)',
        v_n = 1 and pg_temp._stock(v_wa) = '10/10', v_n || ' ' || pg_temp._stock(v_wa));

    -- ============ release (BR-17) ============
    v_n := public.release_order_allocation(v_ob);
    select count(*) into v_short from public.order_item_ware_allocations where order_item_id = v_ib;
    insert into _results values ('release: PENDING Order releases 6: reserved down, current unchanged, rows removed',
        v_n = 6 and pg_temp._stock(v_wa) = '10/4' and v_short = 0, v_n || ' ' || pg_temp._stock(v_wa));

    v_n := public.release_order_allocation(v_ob);
    insert into _results values ('release: repeated release is a no-op (idempotent)',
        v_n = 0 and pg_temp._stock(v_wa) = '10/4', v_n || ' ' || pg_temp._stock(v_wa));

    update public.orders set status = 'CANCELLED' where id = v_ob;
    v_n := public.release_order_allocation(v_ob);
    insert into _results values ('release: CANCELLED Order is a no-op',
        v_n = 0 and pg_temp._stock(v_wa) = '10/4', v_n::text);

    v_res := pg_temp._try(format('select public.release_order_allocation(%L)', gen_random_uuid()));
    insert into _results values ('release: unknown Order -> P0002', v_res = 'P0002', v_res);

    -- ============ S-03: Ware-less Variant and stock-zero Variant ============
    v_om := pg_temp._order(v_client); v_im := pg_temp._item(v_om, v_product, v_v2, 5);
    v_n := public.allocate_order_stock(v_om);
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage(v_om);
    insert into _results values ('S-03: Ware-less Variant: allocated 0, full shortage, no error',
        v_n = 0 and v_alloc = 0 and v_short = 5, v_n || ' ' || v_alloc || ' ' || v_short);

    v_on := pg_temp._order(v_client); v_in := pg_temp._item(v_on, v_product, v_v3, 4);
    v_n := public.allocate_order_stock(v_on);
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage(v_on);
    insert into _results values ('S-03: stock-0 Variant: allocated 0, full shortage, current stays 0',
        v_n = 0 and v_short = 4 and pg_temp._stock(v_wz) = '0/0', v_n || ' ' || v_short);

    v_res := pg_temp._try(format('select public.consume_order_allocation(%L)', v_om));
    insert into _results values ('S-03: Ware-less Order cannot enter PROCESSING until allocated (BR-15)',
        v_res = 'P0001', v_res);

    -- link a Ware to the Ware-less Variant and top up the allocation
    perform public.link_product_variant_ware(v_v2, v_wz);
    perform public.adjust_ware_stock(v_wz, 5);
    v_n := public.allocate_order_item_stock(v_im);
    insert into _results values ('S-16: after linking a Ware and adding stock, additional allocation fills it',
        v_n = 5 and pg_temp._stock(v_wz) = '5/5', v_n || ' ' || pg_temp._stock(v_wz));

    -- ============ Multi-Ware deterministic order (BR-48) ============
    v_om := pg_temp._order(v_client); v_im := pg_temp._item(v_om, v_product, v_v4, 5);
    v_n := public.allocate_order_stock(v_om);
    insert into _results values ('multi-Ware: 5 units take 3 from the lower Ware id, then 2 from the next',
        v_n = 5
        and (select quantity from public.order_item_ware_allocations where order_item_id = v_im and ware_id = v_lo) = 3
        and (select quantity from public.order_item_ware_allocations where order_item_id = v_im and ware_id = v_hi) = 2
        and pg_temp._stock(v_lo) = '3/3' and pg_temp._stock(v_hi) = '3/2',
        pg_temp._stock(v_lo) || ' ' || pg_temp._stock(v_hi));

    perform public.release_order_allocation(v_om);
    update public.wares set is_active = false where id = v_lo;
    v_om := pg_temp._order(v_client); v_im := pg_temp._item(v_om, v_product, v_v4, 4);
    v_n := public.allocate_order_stock(v_om);
    insert into _results values ('multi-Ware: an inactive Ware is skipped; the rest is shortage',
        v_n = 3 and pg_temp._stock(v_lo) = '3/0' and pg_temp._stock(v_hi) = '3/3',
        v_n || ' ' || pg_temp._stock(v_lo) || ' ' || pg_temp._stock(v_hi));
    update public.wares set is_active = true where id = v_lo;

    -- ============ sellability (BR-18, BR-19, BR-46, BR-47) ============
    select is_available, sellability_status into v_avail, v_status
    from public.get_product_variant_sellability(v_v3);
    insert into _results values ('sellability: stock-0 Variant is NOT sold out',
        v_avail and v_status = 'AVAILABLE', v_status);

    select is_available, sellability_status into v_avail, v_status
    from public.get_product_variant_sellability(v_v2);
    insert into _results values ('sellability: Ware-less Variant is sellable (BR-47)',
        v_avail and v_status = 'AVAILABLE', v_status);

    perform public.admin_set_variant_sold_out(v_v1, true);
    select is_available, sellability_status into v_avail, v_status
    from public.get_product_variant_sellability(v_v1);
    insert into _results values ('sellability: explicit is_sold_out -> SOLD_OUT even with stock',
        not v_avail and v_status = 'SOLD_OUT' and (select current_stock - reserved_stock from public.wares where id = v_wa) >= 0,
        v_status);

    perform public.admin_set_variant_sold_out(v_v1, false);
    select is_available, sellability_status into v_avail, v_status
    from public.get_product_variant_sellability(v_v1);
    insert into _results values ('sellability: clearing is_sold_out makes it AVAILABLE again (even with available stock 0)',
        v_avail and v_status = 'AVAILABLE', v_status);

    update public.product_variants set is_active = false where id = v_v3;
    select is_available, sellability_status into v_avail, v_status
    from public.get_product_variant_sellability(v_v3);
    insert into _results values ('sellability: sale-disabled Variant -> UNAVAILABLE',
        not v_avail and v_status = 'UNAVAILABLE', v_status);
    update public.product_variants set is_active = true where id = v_v3;

    update public.products set is_active = false where id = v_product;
    select is_available, sellability_status into v_avail, v_status
    from public.get_product_variant_sellability(v_v4);
    insert into _results values ('sellability: sale-disabled Product -> UNAVAILABLE',
        not v_avail and v_status = 'UNAVAILABLE', v_status);
    update public.products set is_active = true where id = v_product;

    select count(*) into v_n from public.get_product_variant_sellability(gen_random_uuid());
    insert into _results values ('sellability: unknown Variant returns no row', v_n = 0, v_n::text);

    v_res := pg_temp._try(format('select public.admin_set_variant_sold_out(%L, null)', v_v1));
    insert into _results values ('admin_set_variant_sold_out: NULL rejected', v_res = 'P0001', v_res);

    v_res := pg_temp._try(format('select public.admin_set_variant_sold_out(%L, true)', gen_random_uuid()));
    insert into _results values ('admin_set_variant_sold_out: unknown Variant -> P0002', v_res = 'P0002', v_res);

    -- v2 runtime unchanged before cutover
    select stock_status into v_status from public.get_product_variant_availability(v_v3);
    insert into _results values ('v2 regression: get_product_variant_availability still reads stock (stock 0 -> OUT_OF_STOCK)',
        v_status = 'OUT_OF_STOCK', v_status);

    -- ============ grants (BR-20) ============
    insert into _results values ('grants: sellability is executable by Consumers',
        has_function_privilege('anon', 'public.get_product_variant_sellability(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.get_product_variant_sellability(uuid)', 'execute'),
        'checked');
    insert into _results values ('grants: stock/allocation/shortage/sold-out functions are service_role only',
        (select bool_and(
            has_function_privilege('service_role', f, 'execute')
            and not has_function_privilege('anon', f, 'execute')
            and not has_function_privilege('authenticated', f, 'execute'))
         from unnest(array[
            'public.admin_set_variant_sold_out(uuid, boolean)',
            'public.allocate_order_item_stock(uuid)',
            'public.allocate_order_stock(uuid)',
            'public.release_order_allocation(uuid)',
            'public.consume_order_allocation(uuid)',
            'public.get_order_shortage(uuid)'
         ]::regprocedure[]) as f),
        'checked');

    -- consistency: reserved equals the allocations of PENDING Orders for the main Ware
    insert into _results values ('consistency: reserved_stock = allocations of PENDING Orders (A consumed, B cancelled)',
        (select reserved_stock from public.wares where id = v_wa)
        = (select coalesce(sum(a.quantity), 0)
             from public.order_item_ware_allocations a
             join public.order_items oi on oi.id = a.order_item_id
             join public.orders o on o.id = oi.order_id
            where a.ware_id = v_wa and o.status = 'PENDING'),
        pg_temp._stock(v_wa));

    insert into _fx values ('order_a', v_oa), ('variant', v_v1);
end;
$$;

-- ------------------------------------------------------------
-- Consumer boundary: authenticated / anon
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', gen_random_uuid()::text, true),
    set_config('request.jwt.claims',
        json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

do $$
declare
    v_order uuid := (select id from _fx where key = 'order_a');
    v_variant uuid := (select id from _fx where key = 'variant');
    v_n bigint;
begin
    select count(*) into v_n from public.get_product_variant_sellability(v_variant);
    insert into _results values ('rls: authenticated can read sellability', v_n = 1, v_n::text);

    begin
        perform public.allocate_order_stock(v_order);
        insert into _results values ('rls: authenticated cannot allocate', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot allocate', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform * from public.get_order_shortage(v_order);
        insert into _results values ('rls: authenticated cannot read shortage', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot read shortage', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.admin_set_variant_sold_out(v_variant, true);
        insert into _results values ('rls: authenticated cannot set sold-out', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot set sold-out', sqlstate = '42501', sqlerrm);
    end;
end;
$$;

reset role;

select set_config('request.jwt.claims', '{"role":"anon"}', true) \g /dev/null
set local role anon;

do $$
declare
    v_order uuid := (select id from _fx where key = 'order_a');
    v_variant uuid := (select id from _fx where key = 'variant');
    v_n bigint;
begin
    select count(*) into v_n from public.get_product_variant_sellability(v_variant);
    insert into _results values ('rls: anon can read sellability', v_n = 1, v_n::text);

    begin
        perform public.release_order_allocation(v_order);
        insert into _results values ('rls: anon cannot release allocation', false, 'allowed');
    exception when others then
        insert into _results values ('rls: anon cannot release allocation', sqlstate = '42501', sqlerrm);
    end;
end;
$$;

reset role;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'v3 phase 2 stock check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 2 stock check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
