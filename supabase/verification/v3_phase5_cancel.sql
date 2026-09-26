-- ============================================================
-- Local verification: Mall v3 Phase 5 whole-Order Cancel
-- (migration 20260926170000_v3_phase5_order_cancel.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/verification/v3_phase5_cancel.sql
--
-- Runs in one transaction and is ROLLED BACK. Every negative case runs in
-- its own subtransaction. Orders are created through the real Phase 4 path
-- (checkout Payment -> PG success -> finalize).
--
-- Covers S-12 .. S-15, S-27 (DB part), S-30, S-32 (no Cancel after PROCESSING),
-- BR-17 idempotency, BR-28 (freed stock is not auto-allocated), first-cancel-
-- wins recording, grants. Parallel cancels: v3_phase5_concurrency.sh.
-- The executor with a forced PG failure/delay: v3_phase5_routes.sh.
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

-- checkout Payment + PG success + finalize -> the PENDING Order id
create function pg_temp._order(p_client uuid, p_product uuid, p_variant uuid, p_qty int) returns uuid
language plpgsql as $$
declare
    v_items jsonb := pg_temp._items(p_product, p_variant, p_qty);
    v_pay public.payments;
begin
    v_pay := public.create_checkout_payment(p_client, v_items);
    perform public.complete_checkout_payment(p_client, v_pay.id, true, '__v3p5_cb_' || nextval('pg_temp._cb'));
    return (public.finalize_order(p_client, v_pay.id, v_items, '{"recipient":"__verify","address":"Seoul"}'::jsonb) ->> 'order_id')::uuid;
end;
$$;

create function pg_temp._stock(p_ware uuid) returns text
language sql as $$
    select current_stock || '/' || reserved_stock from public.wares where id = p_ware;
$$;

do $$
declare
    v_a uuid := gen_random_uuid();
    v_b uuid := gen_random_uuid();
    v_admin uuid := gen_random_uuid();
    v_wh uuid;
    v_w1 uuid; v_ws uuid; v_wz uuid;
    v_created jsonb;
    v_product uuid; v_v1 uuid; v_vs uuid; v_v2 uuid;
    v_post uuid;
    v_o1 uuid; v_o2 uuid; v_o3 uuid; v_o4 uuid; v_o5 uuid; v_o6 uuid; v_oa uuid; v_ob uuid; v_oc uuid;
    v_pay uuid;
    v_r jsonb; v_r2 jsonb;
    v_rev public.payment_reversals;
    v_res text;
    v_n bigint; v_alloc bigint; v_short bigint;
    v_order public.orders;
    v_row public.order_cancellations;
    v_status text;
begin
    insert into auth.users (id) values (v_a), (v_b), (v_admin);

    v_wh := public.create_warehouse('__verify v3p5 warehouse');
    v_w1 := public.create_ware(v_wh, '__verify v3p5 W1', null, 'GENERAL', 10);
    v_ws := public.create_ware(v_wh, '__verify v3p5 WS', null, 'GENERAL', 10);
    v_wz := public.create_ware(v_wh, '__verify v3p5 WZ', null, 'GENERAL', 0);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p5 product"}', '[]',
        '[{"price":1000,"skuCode":"__V3P5-1"},{"price":100,"skuCode":"__V3P5-S"},{"price":500,"skuCode":"__V3P5-2"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_v1 := (v_created -> 'variantIds' ->> 0)::uuid;
    v_vs := (v_created -> 'variantIds' ->> 1)::uuid;
    v_v2 := (v_created -> 'variantIds' ->> 2)::uuid;   -- no Ware
    perform public.link_product_variant_ware(v_v1, v_w1);
    perform public.link_product_variant_ware(v_vs, v_ws);
    insert into public.product_posts (title, status) values ('__verify v3p5 post', 'PUBLISHED') returning id into v_post;
    insert into public.product_post_products (product_post_id, product_id) values (v_post, v_product);

    -- ============ S-12 Client cancels a PENDING Order ============
    v_o1 := pg_temp._order(v_a, v_product, v_v1, 4);            -- 4000, allocated 4
    insert into _results values ('setup: the Order is PENDING with 4 reserved (10/4)',
        (select status from public.orders where id = v_o1) = 'PENDING' and pg_temp._stock(v_w1) = '10/4', pg_temp._stock(v_w1));

    v_r := public.cancel_pending_order(v_o1, v_a, 'CLIENT', 'changed my mind');
    select * into v_order from public.orders where id = v_o1;
    select * into v_rev from public.payment_reversals where id = (v_r ->> 'reversal_id')::uuid;
    select count(*) into v_n from public.order_item_ware_allocations a
      join public.order_items oi on oi.id = a.order_item_id where oi.order_id = v_o1;
    insert into _results values ('S-12: the whole Order becomes CANCELLED',
        v_r ->> 'outcome' = 'CANCELLED' and v_order.status = 'CANCELLED', v_r ->> 'outcome');
    insert into _results values ('S-12: allocation released once: reserved 4 -> 0, current_stock unchanged (10/0), rows removed',
        pg_temp._stock(v_w1) = '10/0' and v_n = 0, pg_temp._stock(v_w1) || ' ' || v_n);
    insert into _results values ('S-12: one ORDER_CANCEL reversal for the full Payment amount, PENDING, linked to the Order',
        v_rev.reason_type = 'ORDER_CANCEL' and v_rev.amount = 4000 and v_rev.status = 'PENDING'
        and v_rev.order_id = v_o1 and v_rev.payment_id = v_order.payment_id
        and v_rev.idempotency_key = 'order-cancel:' || v_o1::text, v_rev.reason_type);
    select status into v_status from public.payments where id = v_order.payment_id;
    insert into _results values ('S-12: payments.status stays SUCCEEDED (BR-29)', v_status = 'SUCCEEDED', v_status);
    select * into v_row from public.order_cancellations where order_id = v_o1;
    insert into _results values ('DN-12: actor, role and reason are recorded',
        v_row.actor_id = v_a and v_row.actor_role = 'CLIENT' and v_row.reason = 'changed my mind', v_row.actor_role);
    insert into _results values ('Cancel does not restock physical stock: current_stock is exactly what it was (10)',
        (select current_stock from public.wares where id = v_w1) = 10, 'checked');

    -- ============ S-15 repeated cancel ============
    v_r2 := public.cancel_pending_order(v_o1, v_a, 'CLIENT', null);
    select count(*) into v_n from public.payment_reversals where payment_id = v_order.payment_id;
    insert into _results values ('S-15: a repeated cancel is not an error: ALREADY_CANCELLED with the same reversal',
        v_r2 ->> 'outcome' = 'ALREADY_CANCELLED' and v_r2 ->> 'reversal_id' = v_r ->> 'reversal_id', v_r2 ->> 'outcome');
    insert into _results values ('S-15: no second release and no second reversal',
        pg_temp._stock(v_w1) = '10/0' and v_n = 1, pg_temp._stock(v_w1) || ' ' || v_n);

    -- ============ S-14 Client + Admin (second actor after the first) ============
    v_r2 := public.cancel_pending_order(v_o1, v_admin, 'ADMIN', 'admin also cancels');
    select * into v_row from public.order_cancellations where order_id = v_o1;
    insert into _results values ('S-14: the other actor gets ALREADY_CANCELLED, no error; the first cancel stays recorded',
        v_r2 ->> 'outcome' = 'ALREADY_CANCELLED' and v_row.actor_role = 'CLIENT' and v_row.reason = 'changed my mind'
        and (select count(*) from public.order_cancellations where order_id = v_o1) = 1, v_row.actor_role);

    -- ============ S-13 Admin cancels; S-30 shortage Order (6 ordered, 4 allocated) ============
    v_oa := pg_temp._order(v_a, v_product, v_vs, 6);            -- stock 10: allocated 6
    v_ob := pg_temp._order(v_b, v_product, v_vs, 6);            -- allocated 4, shortage 2
    select allocated_quantity, shortage_quantity into v_alloc, v_short from public.get_order_shortage(v_ob);
    insert into _results values ('setup S-30: B has quantity 6, allocated 4, shortage 2 (stock 10/10)',
        v_alloc = 4 and v_short = 2 and pg_temp._stock(v_ws) = '10/10', v_alloc || ' ' || v_short);

    v_r := public.cancel_pending_order(v_ob, v_admin, 'ADMIN', 'out of stock');
    select * into v_rev from public.payment_reversals where id = (v_r ->> 'reversal_id')::uuid;
    insert into _results values ('S-13/S-30: Admin cancels the shortage Order: only the allocated 4 is released (10/6)',
        v_r ->> 'outcome' = 'CANCELLED' and pg_temp._stock(v_ws) = '10/6', pg_temp._stock(v_ws));
    insert into _results values ('S-30: one full-amount reversal (600), not proportional to the allocation',
        v_rev.amount = 600 and v_rev.reason_type = 'ORDER_CANCEL', v_rev.amount::text);
    select * into v_row from public.order_cancellations where order_id = v_ob;
    insert into _results values ('S-13: Admin actor recorded', v_row.actor_role = 'ADMIN' and v_row.actor_id = v_admin, v_row.actor_role);

    -- BR-28: the freed 4 units are not auto-allocated; a newer Order may take them
    select allocated_quantity, shortage_quantity into v_alloc, v_short from public.get_order_shortage(v_oa);
    insert into _results values ('BR-28: A (fully allocated) is untouched; freed stock is not pushed to anyone',
        v_alloc = 6 and v_short = 0, v_alloc || ' ' || v_short);
    v_oc := pg_temp._order(v_a, v_product, v_vs, 3);
    insert into _results values ('BR-28: a newer Order can take the freed stock (10/9)',
        pg_temp._stock(v_ws) = '10/9', pg_temp._stock(v_ws));

    -- ============ shortage-only / stock-0 / Ware-less Order ============
    v_o3 := pg_temp._order(v_b, v_product, v_v2, 2);            -- Ware-less: all shortage
    v_r := public.cancel_pending_order(v_o3, v_b, 'CLIENT');
    insert into _results values ('cancel of a Ware-less Order: nothing to release, still one full reversal',
        v_r ->> 'outcome' = 'CANCELLED' and (select amount from public.payment_reversals where id = (v_r ->> 'reversal_id')::uuid) = 1000
        and (select count(*) from public.wares where id in (v_w1, v_ws, v_wz) and reserved_stock > current_stock) = 0, v_r ->> 'outcome');

    -- ============ ownership and input ============
    v_o4 := pg_temp._order(v_a, v_product, v_v1, 1);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''CLIENT'')', v_o4, v_b));
    insert into _results values ('another Client cannot cancel (P0002, nothing changes)',
        v_res = 'P0002' and (select status from public.orders where id = v_o4) = 'PENDING', v_res);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''CLIENT'')', gen_random_uuid(), v_a));
    insert into _results values ('an unknown Order -> P0002', v_res = 'P0002', v_res);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''SELLER'')', v_o4, v_a));
    insert into _results values ('an unsupported role is rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, null, ''ADMIN'')', v_o4));
    insert into _results values ('a missing actor is rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''CLIENT'', %L)', v_o4, v_a, repeat('x', 501)));
    insert into _results values ('a reason over 500 characters is rejected; the Order stays PENDING',
        v_res = 'P0001' and (select status from public.orders where id = v_o4) = 'PENDING', v_res);
    v_r := public.cancel_pending_order(v_o4, v_admin, 'ADMIN', '   ');
    insert into _results values ('a blank reason is stored as no reason', (select reason from public.order_cancellations where order_id = v_o4) is null, v_r ->> 'outcome');

    -- ============ S-32: no Cancel from PROCESSING on ============
    v_o5 := pg_temp._order(v_a, v_product, v_v1, 2);
    perform public.consume_order_allocation(v_o5);
    update public.orders set status = 'PROCESSING' where id = v_o5;
    v_status := pg_temp._stock(v_w1);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''CLIENT'')', v_o5, v_a));
    insert into _results values ('S-32: a PROCESSING Order cannot be cancelled by the Client; nothing changes',
        v_res = 'P0001' and (select status from public.orders where id = v_o5) = 'PROCESSING' and pg_temp._stock(v_w1) = v_status
        and (select count(*) from public.payment_reversals where order_id = v_o5) = 0, v_res);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''ADMIN'')', v_o5, v_admin));
    insert into _results values ('S-32: ... nor by the Admin', v_res = 'P0001', v_res);
    update public.orders set status = 'SHIPPED' where id = v_o5;
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''ADMIN'')', v_o5, v_admin));
    insert into _results values ('S-32: SHIPPED cannot be cancelled', v_res = 'P0001', v_res);
    update public.orders set status = 'DELIVERED' where id = v_o5;
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''CLIENT'')', v_o5, v_a));
    insert into _results values ('S-32: DELIVERED cannot be cancelled', v_res = 'P0001', v_res);

    -- ============ S-27: the reversal fails or is slow; the cancel is not repeated ============
    v_o6 := pg_temp._order(v_a, v_product, v_v1, 3);
    v_r := public.cancel_pending_order(v_o6, v_a, 'CLIENT');
    v_status := pg_temp._stock(v_w1);
    perform public.claim_payment_reversal((v_r ->> 'reversal_id')::uuid);
    perform public.complete_payment_reversal((v_r ->> 'reversal_id')::uuid, false, null, 'PG down');
    v_r2 := public.cancel_pending_order(v_o6, v_a, 'CLIENT');
    select count(*) into v_n from public.payment_reversals where order_id = v_o6;
    insert into _results values ('S-27: PG failure -> the reversal is FAILED; the Order stays CANCELLED and payments.status SUCCEEDED',
        (select status from public.payment_reversals where id = (v_r ->> 'reversal_id')::uuid) = 'FAILED'
        and (select status from public.orders where id = v_o6) = 'CANCELLED'
        and (select status from public.payments where id = (select payment_id from public.orders where id = v_o6)) = 'SUCCEEDED', 'checked');
    insert into _results values ('S-27: a repeated cancel after the PG failure repeats neither the release nor the reversal',
        v_r2 ->> 'outcome' = 'ALREADY_CANCELLED' and v_r2 ->> 'reversal_id' = v_r ->> 'reversal_id'
        and v_n = 1 and pg_temp._stock(v_w1) = v_status, v_n || ' ' || pg_temp._stock(v_w1));
    perform public.retry_payment_reversal((v_r ->> 'reversal_id')::uuid, v_admin);
    perform public.claim_payment_reversal((v_r ->> 'reversal_id')::uuid);
    perform public.complete_payment_reversal((v_r ->> 'reversal_id')::uuid, true, '__v3p5_pg_1');
    insert into _results values ('S-27: retry on the same reversal succeeds later; still one reversal, one release',
        (select status from public.payment_reversals where id = (v_r ->> 'reversal_id')::uuid) = 'SUCCEEDED'
        and (select count(*) from public.payment_reversals where order_id = v_o6) = 1 and pg_temp._stock(v_w1) = v_status, 'checked');
    insert into _results values ('S-27: the Payment is fully reversed (derived display REFUNDED); the original stays SUCCEEDED',
        (select display_status from public.get_payment_reversal_summary((select payment_id from public.orders where id = v_o6))) = 'REFUNDED', 'checked');

    -- ============ a v2 Order (no v3 stock state) is not touched by the v3 path ============
    insert into public.orders (client_id, status, subtotal, total_amount) values (v_a, 'PENDING', 500, 500) returning id into v_o2;
    insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot)
    values (v_o2, v_product, v_v1, 2, 500, 1000, '__verify v2 order');
    insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity)
    select id, v_w1, 2 from public.order_items where order_id = v_o2;
    v_status := pg_temp._stock(v_w1);
    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''CLIENT'')', v_o2, v_a));
    insert into _results values ('legacy v2 Order (stock not converted, reserved 0): the v3 cancel refuses and changes nothing',
        v_res = 'P0001' and (select status from public.orders where id = v_o2) = 'PENDING' and pg_temp._stock(v_w1) = v_status, v_res);
    v_res := pg_temp._try(format('select public.cancel_order(%L)', v_o2));
    insert into _results values ('v2 regression: cancel_order() still exists (owner-only RPC); untouched by Phase 5',
        to_regprocedure('public.cancel_order(uuid)') is not null, 'checked');

    -- ============ invariants and grants ============
    select count(*) into v_n from public.wares w
     where w.id in (v_w1, v_ws, v_wz)
       and (w.reserved_stock > w.current_stock or w.current_stock < 0
            or w.reserved_stock <> coalesce((
                select sum(a.quantity) from public.order_item_ware_allocations a
                join public.order_items oi on oi.id = a.order_item_id
                join public.orders o on o.id = oi.order_id
                where a.ware_id = w.id and o.status = 'PENDING' and o.payment_id is not null), 0));
    insert into _results values ('consistency: reserved_stock = allocations of PENDING v3 Orders on every Ware',
        v_n = 0, v_n::text);
    select count(*) into v_n from public.payments p
     where p.client_id in (v_a, v_b)
       and (select coalesce(sum(r.amount), 0) from public.payment_reversals r where r.payment_id = p.id and r.status in ('PENDING', 'SUCCEEDED')) > p.amount;
    insert into _results values ('BR-34: no Payment is reversed above its amount', v_n = 0, v_n::text);
    select count(*) into v_n from (
        select order_id from public.payment_reversals where reason_type = 'ORDER_CANCEL' group by order_id having count(*) > 1) d;
    insert into _results values ('no Order has more than one ORDER_CANCEL reversal', v_n = 0, v_n::text);

    insert into _results values ('grants: cancel_pending_order is service_role only',
        has_function_privilege('service_role', 'public.cancel_pending_order(uuid, uuid, text, text)', 'execute')
        and not has_function_privilege('anon', 'public.cancel_pending_order(uuid, uuid, text, text)', 'execute')
        and not has_function_privilege('authenticated', 'public.cancel_pending_order(uuid, uuid, text, text)', 'execute'),
        'checked');
    insert into _results values ('rls: order_cancellations has no Consumer access',
        (select relrowsecurity from pg_class where oid = 'public.order_cancellations'::regclass)
        and not has_table_privilege('authenticated', 'public.order_cancellations', 'select')
        and not has_table_privilege('anon', 'public.order_cancellations', 'select'), 'checked');

    insert into _fx values ('order', v_o4), ('client', v_a);
end;
$$;

-- ------------------------------------------------------------
-- Consumer boundary
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', (select id::text from _fx where key = 'client'), true),
    set_config('request.jwt.claims',
        json_build_object('sub', (select id::text from _fx where key = 'client'), 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

do $$
declare
    v_order uuid := (select id from _fx where key = 'order');
    v_client uuid := (select id from _fx where key = 'client');
begin
    begin
        perform public.cancel_pending_order(v_order, v_client, 'ADMIN');
        insert into _results values ('rls: authenticated cannot call the trusted cancel (no role spoofing)', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot call the trusted cancel (no role spoofing)', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform count(*) from public.order_cancellations;
        insert into _results values ('rls: authenticated cannot read order_cancellations', false, 'read');
    exception when others then
        insert into _results values ('rls: authenticated cannot read order_cancellations', sqlstate = '42501', sqlerrm);
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
        raise exception 'v3 phase 5 cancel check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 5 cancel check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
