-- ============================================================
-- Local verification: Mall v3 Phase 6 Admin fulfillment
-- (migration 20260926180000_v3_phase6_admin_fulfillment.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/verification/v3_phase6_fulfillment.sql
--
-- Runs in one transaction and is ROLLED BACK. Every negative case runs in
-- its own subtransaction. Orders are created through the real Phase 4 path
-- (checkout Payment -> PG success -> finalize).
--
-- Covers S-16, S-17, S-28, S-31, S-37 (v3 lifecycle), the full-allocation
-- gate, the reservation consume (exactly once), no allocation decrease after
-- PROCESSING, payment evidence, the Admin shortage read model, Consumer
-- non-exposure, grants. Races: v3_phase6_concurrency.sh.
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

create function pg_temp._try(p_sql text) returns text
language plpgsql as $$
begin
    execute p_sql;
    return 'OK';
exception when others then
    return sqlstate;
end;
$$;

create function pg_temp._items(p_product uuid, p_variant uuid, p_qty int) returns jsonb
language sql as $$
    select jsonb_build_array(jsonb_build_object(
        'productId', p_product, 'productVariantId', p_variant, 'quantity', p_qty));
$$;

create sequence pg_temp._cb;

create function pg_temp._order(p_client uuid, p_product uuid, p_variant uuid, p_qty int) returns uuid
language plpgsql as $$
declare
    v_items jsonb := pg_temp._items(p_product, p_variant, p_qty);
    v_pay public.payments;
begin
    v_pay := public.create_checkout_payment(p_client, v_items);
    perform public.complete_checkout_payment(p_client, v_pay.id, true, '__v3p6_cb_' || nextval('pg_temp._cb'));
    return (public.finalize_order(p_client, v_pay.id, v_items, '{"recipient":"__verify","address":"Seoul"}'::jsonb) ->> 'order_id')::uuid;
end;
$$;

create function pg_temp._stock(p_ware uuid) returns text
language sql as $$
    select current_stock || '/' || reserved_stock from public.wares where id = p_ware;
$$;

create function pg_temp._status(p_order uuid) returns text
language sql as $$ select status from public.orders where id = p_order; $$;

do $$
declare
    v_a uuid := gen_random_uuid();
    v_b uuid := gen_random_uuid();
    v_wh uuid;
    v_w1 uuid; v_w2 uuid; v_wx uuid; v_wl uuid;
    v_created jsonb;
    v_product uuid; v_v1 uuid; v_v2 uuid; v_vnone uuid; v_vx uuid;
    v_post uuid;
    v_oa uuid; v_ob uuid; v_oc uuid; v_od uuid; v_oe uuid; v_on uuid; v_ol uuid; v_op uuid;
    v_r jsonb;
    v_res text;
    v_n bigint; v_alloc bigint; v_short bigint;
    v_before text;
    v_ia uuid;
    v_pay uuid;
    v_alloc_id uuid;
begin
    insert into auth.users (id) values (v_a), (v_b);

    v_wh := public.create_warehouse('__verify v3p6 warehouse');
    v_w1 := public.create_ware(v_wh, '__verify v3p6 W1', null, 'GENERAL', 10);
    v_w2 := public.create_ware(v_wh, '__verify v3p6 W2', null, 'GENERAL', 1);
    v_wx := public.create_ware(v_wh, '__verify v3p6 WX', null, 'GENERAL', 10);
    v_wl := public.create_ware(v_wh, '__verify v3p6 WL', null, 'GENERAL', 0);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p6 product"}', '[]',
        '[{"price":1000,"skuCode":"__V3P6-1"},{"price":100,"skuCode":"__V3P6-2"},{"price":500,"skuCode":"__V3P6-N"},{"price":50,"skuCode":"__V3P6-X"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_v1 := (v_created -> 'variantIds' ->> 0)::uuid;
    v_v2 := (v_created -> 'variantIds' ->> 1)::uuid;
    v_vnone := (v_created -> 'variantIds' ->> 2)::uuid;   -- no Ware yet
    v_vx := (v_created -> 'variantIds' ->> 3)::uuid;
    perform public.link_product_variant_ware(v_v1, v_w1);
    perform public.link_product_variant_ware(v_v2, v_w2);
    perform public.link_product_variant_ware(v_vx, v_wx);
    insert into public.product_posts (title, status) values ('__verify v3p6 post', 'PUBLISHED') returning id into v_post;
    insert into public.product_post_products (product_post_id, product_id) values (v_post, v_product);

    -- ============ S-37: stock 10, Order A x6 and Order B x6 ============
    v_oa := pg_temp._order(v_a, v_product, v_v1, 6);
    v_ob := pg_temp._order(v_b, v_product, v_v1, 6);
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage(v_ob);
    insert into _results values ('setup: A allocated 6; B allocated 4, shortage 2; stock 10/10',
        v_alloc = 4 and v_short = 2 and pg_temp._stock(v_w1) = '10/10', pg_temp._stock(v_w1));

    -- ---- the gate: shortage blocks PROCESSING ----
    v_before := pg_temp._stock(v_w1);
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PROCESSING'')', v_ob));
    insert into _results values ('gate: an Order with shortage cannot enter PROCESSING; nothing changes',
        v_res = 'P0001' and pg_temp._status(v_ob) = 'PENDING' and pg_temp._stock(v_w1) = v_before, v_res);

    -- ---- A enters PROCESSING: the reservation is consumed exactly once ----
    v_r := public.admin_advance_order(v_oa, 'PROCESSING');
    insert into _results values ('S-37: A -> PROCESSING consumes 6: current 4 / reserved 4 (B holds 4)',
        v_r ->> 'outcome' = 'TRANSITIONED' and pg_temp._status(v_oa) = 'PROCESSING' and pg_temp._stock(v_w1) = '4/4', pg_temp._stock(v_w1));
    v_r := public.admin_advance_order(v_oa, 'PROCESSING');
    insert into _results values ('DN-14: repeating the same transition is UNCHANGED and does not consume again',
        v_r ->> 'outcome' = 'UNCHANGED' and pg_temp._stock(v_w1) = '4/4', v_r ->> 'outcome');

    -- ---- no allocation decrease after PROCESSING (BR-42) ----
    v_res := pg_temp._try(format('select public.release_order_allocation(%L)', v_oa));
    insert into _results values ('BR-42: release_order_allocation refuses a PROCESSING Order', v_res = 'P0001', v_res);
    select a.id into v_alloc_id from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id where oi.order_id = v_oa limit 1;
    v_res := pg_temp._try(format('delete from public.order_item_ware_allocations where id = %L', v_alloc_id));
    insert into _results values ('BR-42: an allocation row of a PROCESSING Order cannot be deleted (any path)', v_res = '23514', v_res);
    v_res := pg_temp._try(format('update public.order_item_ware_allocations set quantity = quantity - 1 where id = %L', v_alloc_id));
    insert into _results values ('BR-42: ... nor decreased', v_res = '23514', v_res);
    v_res := pg_temp._try(format('select public.allocate_order_item_stock(%L)', (select id from public.order_items where order_id = v_oa)));
    insert into _results values ('BR-42: allocate refuses a PROCESSING Order', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''CLIENT'')', v_oa, v_a));
    insert into _results values ('S-31: Cancel is refused after PROCESSING (409 path); nothing changes',
        v_res = 'P0001' and pg_temp._status(v_oa) = 'PROCESSING' and pg_temp._stock(v_w1) = '4/4', v_res);
    select count(*) into v_n from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id where oi.order_id = v_oa;
    insert into _results values ('BR-42: the PROCESSING Order keeps its allocation rows (needed for Refund/Restock)', v_n = 1, v_n::text);

    -- ---- SHIPPED -> DELIVERED and the forbidden steps ----
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''DELIVERED'')', v_oa));
    insert into _results values ('DN-14: skipping a step (PROCESSING -> DELIVERED) is refused', v_res = 'P0001', v_res);
    v_r := public.admin_advance_order(v_oa, 'SHIPPED');
    insert into _results values ('PROCESSING -> SHIPPED', v_r ->> 'outcome' = 'TRANSITIONED' and pg_temp._status(v_oa) = 'SHIPPED'
        and pg_temp._stock(v_w1) = '4/4', pg_temp._status(v_oa));
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PROCESSING'')', v_oa));
    insert into _results values ('DN-14: going back (SHIPPED -> PROCESSING) is refused', v_res = 'P0001', v_res);
    v_r := public.admin_advance_order(v_oa, 'DELIVERED');
    insert into _results values ('SHIPPED -> DELIVERED', v_r ->> 'outcome' = 'TRANSITIONED' and pg_temp._status(v_oa) = 'DELIVERED', pg_temp._status(v_oa));
    v_r := public.admin_advance_order(v_oa, 'DELIVERED');
    insert into _results values ('DELIVERED -> DELIVERED is UNCHANGED', v_r ->> 'outcome' = 'UNCHANGED', v_r ->> 'outcome');
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PAID'')', v_ob));
    insert into _results values ('BR-24: there is no PAID step in the v3 transition', v_res = 'P0001' and pg_temp._status(v_ob) = 'PENDING', v_res);
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''CANCELLED'')', v_ob));
    insert into _results values ('the transition function does not cancel (Cancel is its own path)', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''SHIPPED'')', v_ob));
    insert into _results values ('DN-14: PENDING -> SHIPPED (skipping PROCESSING) is refused', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PROCESSING'')', gen_random_uuid()));
    insert into _results values ('an unknown Order -> P0002', v_res = 'P0002', v_res);

    -- ============ S-17 restock, S-28 a newer Order, S-16 Admin allocation ============
    perform public.adjust_ware_stock(v_w1, 6);
    select allocated_quantity, shortage_quantity into v_alloc, v_short from public.get_order_shortage(v_ob);
    insert into _results values ('S-17: new stock (10/4) is not auto-allocated: B still has shortage 2',
        pg_temp._stock(v_w1) = '10/4' and v_alloc = 4 and v_short = 2, pg_temp._stock(v_w1));
    v_oc := pg_temp._order(v_a, v_product, v_v1, 3);
    insert into _results values ('S-28: a newer Order takes the new stock first (10/7)', pg_temp._stock(v_w1) = '10/7', pg_temp._stock(v_w1));
    select id into v_ia from public.order_items where order_id = v_ob;
    v_n := public.allocate_order_item_stock(v_ia);
    select allocated_quantity, shortage_quantity into v_alloc, v_short from public.get_order_shortage(v_ob);
    insert into _results values ('S-16: Admin allocation gives B the 2 that are available (full, 10/9)',
        v_n = 2 and v_alloc = 6 and v_short = 0 and pg_temp._stock(v_w1) = '10/9', v_n || ' ' || pg_temp._stock(v_w1));
    v_r := public.admin_advance_order(v_ob, 'PROCESSING');
    insert into _results values ('B (now fully allocated) enters PROCESSING: consumed 6 -> 4/3 (C still holds 3)',
        v_r ->> 'outcome' = 'TRANSITIONED' and pg_temp._stock(v_w1) = '4/3', pg_temp._stock(v_w1));

    -- ---- partial allocation: never an error ----
    v_od := pg_temp._order(v_b, v_product, v_v2, 5);              -- stock 1: allocated 1, shortage 4
    v_n := public.allocate_order_stock(v_od);
    select allocated_quantity, shortage_quantity into v_alloc, v_short from public.get_order_shortage(v_od);
    insert into _results values ('DN-02: an Admin allocation with nothing available allocates 0 and is not an error',
        v_n = 0 and v_alloc = 1 and v_short = 4, v_n || ' ' || v_alloc || ' ' || v_short);
    perform public.adjust_ware_stock(v_w2, 2);
    v_n := public.allocate_order_stock(v_od);
    select allocated_quantity, shortage_quantity into v_alloc, v_short from public.get_order_shortage(v_od);
    insert into _results values ('DN-02: with 2 more units the allocation is partial (+2, shortage 2), still PENDING',
        v_n = 2 and v_alloc = 3 and v_short = 2 and pg_temp._status(v_od) = 'PENDING', v_n || ' ' || v_short);
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PROCESSING'')', v_od));
    insert into _results values ('partial allocation does not open the gate', v_res = 'P0001', v_res);
    perform public.adjust_ware_stock(v_w2, 2);
    perform public.allocate_order_stock(v_od);
    v_r := public.admin_advance_order(v_od, 'PROCESSING');
    insert into _results values ('once fully allocated the Order can enter PROCESSING', v_r ->> 'outcome' = 'TRANSITIONED', v_r ->> 'outcome');

    -- ---- Ware-less Variant: needs a Ware and stock first (BR-47) ----
    v_on := pg_temp._order(v_a, v_product, v_vnone, 2);
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PROCESSING'')', v_on));
    insert into _results values ('BR-47: a Ware-less Order cannot enter PROCESSING', v_res = 'P0001', v_res);
    perform public.link_product_variant_ware(v_vnone, v_wl);
    perform public.adjust_ware_stock(v_wl, 2);
    perform public.allocate_order_stock(v_on);
    v_r := public.admin_advance_order(v_on, 'PROCESSING');
    insert into _results values ('BR-47: after linking a Ware, adding stock and allocating, it can',
        v_r ->> 'outcome' = 'TRANSITIONED' and pg_temp._stock(v_wl) = '0/0', pg_temp._stock(v_wl));

    -- ============ payment evidence (BR-24) ============
    insert into public.orders (client_id, status, subtotal, total_amount) values (v_a, 'PENDING', 100, 100) returning id into v_ol;
    insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot)
    values (v_ol, v_product, v_vx, 2, 50, 100, '__verify legacy');
    insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity)
    select id, v_wx, 2 from public.order_items where order_id = v_ol;
    update public.wares set reserved_stock = 2 where id = v_wx;
    v_before := pg_temp._stock(v_wx);
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PROCESSING'')', v_ol));
    insert into _results values ('BR-24: an Order without any Payment cannot enter PROCESSING; nothing is consumed',
        v_res = 'P0001' and pg_temp._status(v_ol) = 'PENDING' and pg_temp._stock(v_wx) = v_before, v_res);
    insert into public.payments (client_id, purpose, order_id, amount, status, pg_callback_id, completed_at)
    values (v_a, 'ORDER_PAYMENT', v_ol, 100, 'FAILED', '__v3p6_failed', now());
    v_res := pg_temp._try(format('select public.admin_advance_order(%L, ''PROCESSING'')', v_ol));
    insert into _results values ('BR-24: a FAILED Payment is not evidence', v_res = 'P0001' and pg_temp._stock(v_wx) = v_before, v_res);
    insert into public.payments (client_id, purpose, order_id, amount, status, pg_callback_id, completed_at)
    values (v_a, 'ORDER_PAYMENT', v_ol, 100, 'SUCCEEDED', '__v3p6_ok', now());
    v_r := public.admin_advance_order(v_ol, 'PROCESSING');
    insert into _results values ('BR-24: a SUCCEEDED Payment of the v2 direction (payments.order_id) is evidence; consumed 2 (8/0)',
        v_r ->> 'outcome' = 'TRANSITIONED' and pg_temp._stock(v_wx) = '8/0', pg_temp._stock(v_wx));

    -- ============ Admin shortage read model (BR-12) ============
    v_op := pg_temp._order(v_b, v_product, v_vx, 20);          -- WX now 8/0: allocated 8, shortage 12
    select ordered_quantity, allocated_quantity, shortage_quantity into v_n, v_alloc, v_short
    from public.get_orders_shortage(array[v_op]);
    insert into _results values ('BR-12: get_orders_shortage shows ordered 20 / allocated 8 / shortage 12',
        v_n = 20 and v_alloc = 8 and v_short = 12, v_n || '/' || v_alloc || '/' || v_short);
    select count(*) into v_n from public.get_orders_shortage(null, true);
    insert into _results values ('BR-12: the default list is PENDING Orders; only_short keeps those with shortage',
        v_n >= 1 and not exists (select 1 from public.get_orders_shortage(null, true) where shortage_quantity <= 0 or order_status <> 'PENDING')
        and exists (select 1 from public.get_orders_shortage(null, true) where order_id = v_op), v_n::text);
    insert into _results values ('BR-12: a PROCESSING Order has shortage 0 (the gate guarantees it)',
        (select shortage_quantity from public.get_orders_shortage(array[v_ob])) = 0, 'checked');
    select count(*) into v_n from public.get_orders_shortage(null, false, 1);
    insert into _results values ('the limit is honored', v_n = 1, v_n::text);

    -- ============ invariants and grants ============
    select count(*) into v_n from public.wares w
     where w.id in (v_w1, v_w2, v_wl)
       and (w.reserved_stock > w.current_stock or w.current_stock < 0
            or w.reserved_stock <> coalesce((
                select sum(a.quantity) from public.order_item_ware_allocations a
                join public.order_items oi on oi.id = a.order_item_id
                join public.orders o on o.id = oi.order_id
                where a.ware_id = w.id and o.status = 'PENDING' and o.payment_id is not null), 0));
    insert into _results values ('consistency: reserved_stock = allocations of PENDING v3 Orders, never over-reserved', v_n = 0, v_n::text);
    select count(*) into v_n from public.orders o
     where o.id in (v_oa, v_ob, v_od, v_on) and o.status in ('PROCESSING', 'SHIPPED', 'DELIVERED')
       and exists (select 1 from public.order_items oi where oi.order_id = o.id
                   and oi.quantity > coalesce((select sum(a.quantity) from public.order_item_ware_allocations a where a.order_item_id = oi.id), 0));
    insert into _results values ('no Order at PROCESSING or later has shortage', v_n = 0, v_n::text);

    insert into _results values ('grants: the Phase 6 functions are service_role only',
        (select bool_and(
            has_function_privilege('service_role', f, 'execute')
            and not has_function_privilege('anon', f, 'execute')
            and not has_function_privilege('authenticated', f, 'execute'))
         from unnest(array[
            'public.admin_advance_order(uuid, text)',
            'public.get_orders_shortage(uuid[], boolean, integer)'
         ]::regprocedure[]) as f), 'checked');

    -- ============ v2 regression: the v2 transition function is untouched ============
    insert into public.orders (client_id, status, subtotal, total_amount) values (v_a, 'PENDING', 1, 1) returning id into v_op;
    perform public.admin_transition_order_status(v_op, 'PAID');
    insert into _results values ('v2 regression: admin_transition_order_status(PENDING -> PAID) still works (removed only at Phase 8)',
        pg_temp._status(v_op) = 'PAID', pg_temp._status(v_op));

    insert into _fx values ('client_b', v_b), ('order_b_short', v_od), ('order_ob', v_ob), ('order_short', (select id from public.orders where client_id = v_b and status = 'PENDING' order by created_at desc limit 1));
end;
$$;

-- ------------------------------------------------------------
-- Consumer non-exposure (BR-20): as the Client that owns a shortage Order
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', (select id::text from _fx where key = 'client_b'), true),
    set_config('request.jwt.claims',
        json_build_object('sub', (select id::text from _fx where key = 'client_b'), 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

do $$
declare
    v_short uuid := (select id from _fx where key = 'order_short');
    v_json text;
    v_n bigint;
begin
    select public.get_order_history(50, 0)::text into v_json;
    insert into _results values ('BR-20: the Consumer order history contains the Order but no stock/allocation/shortage/Ware keys',
        v_json like '%' || v_short::text || '%'
        and v_json !~* '(alloc|shortage|stock|ware|reserved)', length(v_json)::text);

    select count(*) into v_n from public.order_item_ware_allocations;
    insert into _results values ('BR-20: the Consumer cannot read allocation rows (RLS)', v_n = 0, v_n::text);
    select count(*) into v_n from public.wares;
    insert into _results values ('BR-20: the Consumer cannot read Wares (RLS)', v_n = 0, v_n::text);

    begin
        perform public.admin_advance_order(v_short, 'PROCESSING');
        insert into _results values ('rls: authenticated cannot advance an Order', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot advance an Order', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform * from public.get_orders_shortage();
        insert into _results values ('rls: authenticated cannot read the shortage list', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot read the shortage list', sqlstate = '42501', sqlerrm);
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
        raise exception 'v3 phase 6 fulfillment check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 6 fulfillment check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
