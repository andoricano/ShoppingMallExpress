-- ============================================================
-- Local verification: v3 cutover script (stock conversion + sellability)
-- supabase/cutover/v3_stock_and_sellability.sql
--
-- Do not run this file directly: run
--
--   bash supabase/verification/v3_phase2_cutover.sh
--
-- which substitutes the cutover script and the consistency check at the
-- @@ markers below and pipes the result into the LOCAL database. It runs
-- in one transaction and is ROLLED BACK; the cutover DDL/DML never
-- persists.
--
-- A v2-style state is built first (net-remainder stock, reserved 0,
-- Orders in every status), then the cutover script is applied.
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

create function pg_temp._stock(p_ware uuid) returns text
language sql as $$
    select current_stock || '/' || reserved_stock from public.wares where id = p_ware;
$$;

do $$
declare
    v_client uuid := gen_random_uuid();
    v_wh uuid;
    v_w1 uuid; v_w2 uuid; v_w3 uuid;
    v_created jsonb;
    v_product uuid;
    v_var1 uuid; v_var_zero uuid; v_var_sold uuid; v_var_off uuid;
begin
    insert into auth.users (id) values (v_client);
    v_wh := public.create_warehouse('__verify v3p2 cutover warehouse');

    -- v2 state: current_stock is the net remainder, reserved_stock is 0.
    -- W1 physical 20 = remainder 12 + PENDING 3 + PAID 2 + PROCESSING 1 + DELIVERED 2
    -- (the CANCELLED Order's stock was added back by v2 cancel_order).
    v_w1 := public.create_ware(v_wh, '__verify v3p2 W1', null, 'GENERAL', 12);
    v_w2 := public.create_ware(v_wh, '__verify v3p2 W2', null, 'GENERAL', 7);
    v_w3 := public.create_ware(v_wh, '__verify v3p2 W3', null, 'GENERAL', 0);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p2 cutover product"}', '[]',
        '[{"price":1000,"skuCode":"__V3P2C-1"},{"price":1000,"skuCode":"__V3P2C-2"},{"price":1000,"skuCode":"__V3P2C-3"},{"price":1000,"skuCode":"__V3P2C-4"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_var1 := (v_created -> 'variantIds' ->> 0)::uuid;
    v_var_zero := (v_created -> 'variantIds' ->> 1)::uuid;
    v_var_sold := (v_created -> 'variantIds' ->> 2)::uuid;
    v_var_off := (v_created -> 'variantIds' ->> 3)::uuid;
    perform public.link_product_variant_ware(v_var1, v_w1);
    perform public.link_product_variant_ware(v_var_zero, v_w3);

    -- one Order per status, each with one OrderItem allocated on W1
    declare
        v_status text;
        v_qty int;
        v_ord uuid;
        v_item uuid;
    begin
        for v_status, v_qty in
            select * from (values
                ('PENDING', 3), ('PAID', 2), ('PROCESSING', 1), ('CANCELLED', 4), ('DELIVERED', 2)
            ) as t(status, qty)
        loop
            insert into public.orders (client_id, status, subtotal, total_amount)
            values (v_client, v_status, 1000, 1000) returning id into v_ord;
            insert into public.order_items (
                order_id, product_id, product_variant_id, quantity,
                unit_price, line_total, product_name_snapshot)
            values (v_ord, v_product, v_var1, v_qty, 1000, 1000 * v_qty, '__verify v3p2 cutover')
            returning id into v_item;
            insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity)
            values (v_item, v_w1, v_qty);
        end loop;
    end;

    update public.product_variants set is_sold_out = true where id = v_var_sold;
    update public.product_variants set is_active = false where id = v_var_off;

    insert into _fx values
        ('w1', v_w1), ('w2', v_w2), ('w3', v_w3),
        ('var1', v_var1), ('var_zero', v_var_zero), ('var_sold', v_var_sold), ('var_off', v_var_off);
end;
$$;

-- ---------------- before the cutover ----------------
create temp table _chk_before as
-- @@CHECK@@

do $$
declare
    v_w1 uuid := (select id from _fx where key = 'w1');
    v_status text;
begin
    insert into _results values ('before: v2 state is 12/0 for W1 (net remainder, no reservation)',
        pg_temp._stock(v_w1) = '12/0', pg_temp._stock(v_w1));
    insert into _results values ('before: the consistency check reports W1 (5 held by PENDING/PAID Orders)',
        exists (select 1 from _chk_before where ware_id = v_w1 and expected_reserved_stock = 5), 'checked');

    select stock_status into v_status
    from public.get_product_variant_availability((select id from _fx where key = 'var_zero'));
    insert into _results values ('before: v2 availability reads stock (stock-0 Variant -> OUT_OF_STOCK)',
        v_status = 'OUT_OF_STOCK', v_status);
end;
$$;

-- ---------------- cutover script ----------------
-- @@CUTOVER@@

-- ---------------- after the cutover ----------------
create temp table _chk_after as
-- @@CHECK@@

do $$
declare
    v_w1 uuid := (select id from _fx where key = 'w1');
    v_w2 uuid := (select id from _fx where key = 'w2');
    v_w3 uuid := (select id from _fx where key = 'w3');
    v_status text;
    v_avail boolean;
begin
    insert into _results values ('after: W1 converted to physical 17 / reserved 5 (PENDING 3 + PAID 2)',
        pg_temp._stock(v_w1) = '17/5', pg_temp._stock(v_w1));
    insert into _results values ('after: a Ware with no holding Order is unchanged (W2 7/0, W3 0/0)',
        pg_temp._stock(v_w2) = '7/0' and pg_temp._stock(v_w3) = '0/0',
        pg_temp._stock(v_w2) || ' ' || pg_temp._stock(v_w3));
    insert into _results values ('after: consistency check returns no row for the fixture Wares',
        not exists (select 1 from _chk_after where ware_id in (v_w1, v_w2, v_w3)), 'checked');
    insert into _results values ('after: reserved_stock = allocations of PENDING/PAID Orders, available = 12',
        (select current_stock - reserved_stock from public.wares where id = v_w1) = 12, 'checked');

    select stock_status, is_available into v_status, v_avail
    from public.get_product_variant_availability((select id from _fx where key = 'var_zero'));
    insert into _results values ('after: stock-0 Variant is AVAILABLE (stock no longer decides)',
        v_status = 'AVAILABLE' and v_avail, v_status);

    select stock_status, is_available into v_status, v_avail
    from public.get_product_variant_availability((select id from _fx where key = 'var_sold'));
    insert into _results values ('after: explicit sold-out Variant -> OUT_OF_STOCK (Consumer contract unchanged until Phase 8)',
        v_status = 'OUT_OF_STOCK' and not v_avail, v_status);

    select stock_status, is_available into v_status, v_avail
    from public.get_product_variant_availability((select id from _fx where key = 'var_off'));
    insert into _results values ('after: sale-disabled Variant -> UNAVAILABLE',
        v_status = 'UNAVAILABLE' and not v_avail, v_status);

    select stock_status into v_status
    from public.get_product_variant_availability((select id from _fx where key = 'var1'));
    insert into _results values ('after: ordinary Variant -> AVAILABLE', v_status = 'AVAILABLE', v_status);
end;
$$;

-- ---------------- a second run must be refused ----------------
savepoint before_second_run;
\set ON_ERROR_STOP off
-- @@CUTOVER@@
rollback to savepoint before_second_run;
\set ON_ERROR_STOP on

do $$
declare
    v_w1 uuid := (select id from _fx where key = 'w1');
begin
    insert into _results values ('second run: refused, W1 stays 17/5 (no double conversion)',
        pg_temp._stock(v_w1) = '17/5', pg_temp._stock(v_w1));
end;
$$;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'v3 phase 2 cutover check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 2 cutover check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
