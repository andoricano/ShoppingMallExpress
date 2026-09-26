-- ============================================================
-- Local verification: Mall v3 Phase 7 Refund and restock
-- (migration 20260926190000_v3_phase7_refund_and_restock.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/verification/v3_phase7_refund.sql
--
-- Runs in one transaction and is ROLLED BACK. Every negative case runs in
-- its own subtransaction. Orders go through the real path: checkout Payment
-- -> PG success -> finalize -> Admin PROCESSING.
--
-- Covers S-18 .. S-22, S-33 .. S-36: eligibility (allow-list), partial Refund
-- and the cumulative limit, snapshot pricing, atomic approval + REFUND
-- reversal (with fault injection), PG failure / retry, Policy B (approval
-- never touches stock), explicit allocation-bounded restock, the Order status
-- never changing, DN-47 status set, grants.
-- Parallel requests / approvals: v3_phase7_concurrency.sh.
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

-- checkout Payment + PG success + finalize -> Order id (PENDING)
create function pg_temp._order(p_client uuid, p_product uuid, p_variant uuid, p_qty int) returns uuid
language plpgsql as $$
declare
    v_items jsonb := pg_temp._items(p_product, p_variant, p_qty);
    v_pay public.payments;
begin
    v_pay := public.create_checkout_payment(p_client, v_items);
    perform public.complete_checkout_payment(p_client, v_pay.id, true, '__v3p7_cb_' || nextval('pg_temp._cb'));
    return (public.finalize_order(p_client, v_pay.id, v_items, '{"recipient":"__verify","address":"Seoul"}'::jsonb) ->> 'order_id')::uuid;
end;
$$;

create function pg_temp._processing(p_order uuid) returns uuid
language plpgsql as $$
begin
    perform public.admin_advance_order(p_order, 'PROCESSING');
    return p_order;
end;
$$;

create function pg_temp._stock(p_ware uuid) returns text
language sql as $$
    select current_stock || '/' || reserved_stock from public.wares where id = p_ware;
$$;

create function pg_temp._status(p_order uuid) returns text
language sql as $$ select status from public.orders where id = p_order; $$;

create function pg_temp._item(p_order uuid) returns uuid
language sql as $$ select id from public.order_items where order_id = p_order limit 1; $$;

create function pg_temp._ri(p_item uuid, p_qty int) returns jsonb
language sql as $$
    select jsonb_build_array(jsonb_build_object('orderItemId', p_item, 'quantity', p_qty));
$$;

do $$
declare
    v_a uuid := gen_random_uuid();
    v_b uuid := gen_random_uuid();
    v_admin uuid := gen_random_uuid();
    v_wh uuid;
    v_w1 uuid; v_w2 uuid;
    v_created jsonb;
    v_product uuid; v_v1 uuid; v_v2 uuid;
    v_post uuid;
    v_o uuid; v_o2 uuid; v_o3 uuid; v_op uuid; v_oc uuid; v_ol uuid; v_of uuid;
    v_oi uuid; v_oi2 uuid;
    v_r1 uuid; v_r2 uuid; v_r3 uuid; v_r4 uuid; v_rx uuid;
    v_d jsonb; v_d2 jsonb;
    v_rev public.payment_reversals;
    v_rr public.refund_requests;
    v_res text;
    v_n bigint;
    v_before text;
    v_pay uuid;
    v_amt numeric;
    v_restock public.refund_item_restocks;
    v_ri uuid;
begin
    insert into auth.users (id) values (v_a), (v_b), (v_admin);

    v_wh := public.create_warehouse('__verify v3p7 warehouse');
    v_w1 := public.create_ware(v_wh, '__verify v3p7 W1', null, 'GENERAL', 20);
    v_w2 := public.create_ware(v_wh, '__verify v3p7 W2', null, 'GENERAL', 20);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p7 product"}', '[]',
        '[{"price":1000,"skuCode":"__V3P7-1"},{"price":500,"skuCode":"__V3P7-2"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_v1 := (v_created -> 'variantIds' ->> 0)::uuid;
    v_v2 := (v_created -> 'variantIds' ->> 1)::uuid;
    perform public.link_product_variant_ware(v_v1, v_w1);
    perform public.link_product_variant_ware(v_v2, v_w2);
    insert into public.product_posts (title, status) values ('__verify v3p7 post', 'PUBLISHED') returning id into v_post;
    insert into public.product_post_products (product_post_id, product_id) values (v_post, v_product);

    -- ============ eligibility (BR-37: allow-list) ============
    v_op := pg_temp._order(v_a, v_product, v_v1, 1);                       -- PENDING
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_op, pg_temp._ri(pg_temp._item(v_op), 1)));
    insert into _results values ('BR-37: a PENDING Order cannot be refunded (Cancel is used)', v_res = 'P0001'
        and (select count(*) from public.refund_requests where order_id = v_op) = 0, v_res);

    v_oc := pg_temp._order(v_a, v_product, v_v1, 1);
    perform public.cancel_pending_order(v_oc, v_a, 'CLIENT');
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_oc, pg_temp._ri(pg_temp._item(v_oc), 1)));
    insert into _results values ('BR-37: a CANCELLED Order cannot be refunded', v_res = 'P0001', v_res);

    -- ============ S-19: OrderItem of quantity 6 (price 1000) ============
    v_o := pg_temp._processing(pg_temp._order(v_a, v_product, v_v1, 6));
    v_oi := pg_temp._item(v_o);
    select payment_id into v_pay from public.orders where id = v_o;
    insert into _results values ('setup: PROCESSING Order, 6 units consumed: stock 14/0 (20 - 6 consumed) plus the PENDING Orders', pg_temp._status(v_o) = 'PROCESSING', pg_temp._stock(v_w1));

    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_b, v_o, pg_temp._ri(v_oi, 1)));
    insert into _results values ('another Client cannot refund the Order (P0002)', v_res = 'P0002', v_res);
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_o, '[]'::jsonb));
    insert into _results values ('malformed: empty items rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_o, pg_temp._ri(v_oi, 0)));
    insert into _results values ('malformed: quantity 0 rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_o, pg_temp._ri(v_oi, 1) || pg_temp._ri(v_oi, 1)));
    insert into _results values ('malformed: a duplicated OrderItem rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_o, pg_temp._ri(gen_random_uuid(), 1)));
    insert into _results values ('an OrderItem of another Order rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L, %L)', v_a, v_o, pg_temp._ri(v_oi, 1), repeat('x', 501)));
    insert into _results values ('a reason over 500 characters rejected', v_res = 'P0001', v_res);
    select count(*) into v_n from public.refund_requests where order_id = v_o;
    insert into _results values ('malformed/failed requests leave nothing behind', v_n = 0, v_n::text);

    update public.product_variants set price = 9999 where id = v_v1;      -- Admin changes the price later
    v_r1 := public.create_refund_request(v_a, v_o, pg_temp._ri(v_oi, 2), 'too small');
    select * into v_rr from public.refund_requests where id = v_r1;
    insert into _results values ('S-19: request 2 of 6 is REQUESTED, priced at the immutable snapshot unit price (2 x 1000)',
        v_rr.status = 'REQUESTED' and v_rr.requested_amount = 2000 and v_rr.reason = 'too small'
        and (select refund_amount from public.refund_items where refund_request_id = v_r1) = 2000, v_rr.requested_amount::text);
    update public.product_variants set price = 1000 where id = v_v1;
    v_r2 := public.create_refund_request(v_a, v_o, pg_temp._ri(v_oi, 3));
    insert into _results values ('S-19: a further 3 is valid (cumulative 5 of 6)', (select requested_amount from public.refund_requests where id = v_r2) = 3000, 'checked');
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_o, pg_temp._ri(v_oi, 2)));
    select count(*) into v_n from public.refund_requests where order_id = v_o;
    insert into _results values ('S-19: 2 more (cumulative 7 of 6) is refused and creates no request', v_res = 'P0001' and v_n = 2, v_res || ' ' || v_n);

    -- REJECTED requests do not count (DN-47)
    v_d := public.admin_decide_refund(v_r2, 'REJECTED', v_admin);
    insert into _results values ('rejection: no reversal, no Payment effect, processed_at stamped',
        v_d ->> 'outcome' = 'REJECTED' and v_d -> 'reversal_id' = 'null'::jsonb
        and (select count(*) from public.payment_reversals where payment_id = v_pay) = 0
        and (select processed_at from public.refund_requests where id = v_r2) is not null
        and (select status from public.payments where id = v_pay) = 'SUCCEEDED', v_d ->> 'outcome');
    v_r3 := public.create_refund_request(v_a, v_o, pg_temp._ri(v_oi, 4));
    insert into _results values ('DN-47: a REJECTED request does not count: 2 + 4 = 6 is valid', v_r3 is not null, 'checked');

    -- ============ approval: request + reversal in one transaction (BR-39) ============
    v_before := pg_temp._stock(v_w1);
    v_d := public.admin_decide_refund(v_r1, 'APPROVED', v_admin);
    select * into v_rev from public.payment_reversals where id = (v_d ->> 'reversal_id')::uuid;
    insert into _results values ('S-18: approval creates one REFUND reversal, PENDING, for the request amount, linked to request and Order',
        v_d ->> 'outcome' = 'APPROVED' and v_rev.reason_type = 'REFUND' and v_rev.status = 'PENDING' and v_rev.amount = 2000
        and v_rev.refund_request_id = v_r1 and v_rev.order_id = v_o and v_rev.payment_id = v_pay
        and v_rev.idempotency_key = 'refund:' || v_r1::text, v_rev.reason_type);
    insert into _results values ('BR-41: the Order status is unchanged by the approval', pg_temp._status(v_o) = 'PROCESSING', pg_temp._status(v_o));
    insert into _results values ('BR-40 / S-20: approval changes no stock (Policy B)', pg_temp._stock(v_w1) = v_before, pg_temp._stock(v_w1));
    insert into _results values ('BR-29: payments.status stays SUCCEEDED', (select status from public.payments where id = v_pay) = 'SUCCEEDED', 'checked');

    v_d2 := public.admin_decide_refund(v_r1, 'APPROVED', v_admin);
    select count(*) into v_n from public.payment_reversals where payment_id = v_pay;
    insert into _results values ('DN-45: a repeated approval is ALREADY_APPROVED, same reversal, no second reversal',
        v_d2 ->> 'outcome' = 'ALREADY_APPROVED' and v_d2 ->> 'reversal_id' = v_d ->> 'reversal_id' and v_n = 1, v_d2 ->> 'outcome');
    v_res := pg_temp._try(format('select public.admin_decide_refund(%L, ''REJECTED'', %L)', v_r1, v_admin));
    insert into _results values ('DN-45: the opposite decision on an approved request is refused', v_res = 'P0001', v_res);
    v_d2 := public.admin_decide_refund(v_r2, 'REJECTED', v_admin);
    insert into _results values ('DN-45: a repeated rejection is ALREADY_REJECTED', v_d2 ->> 'outcome' = 'ALREADY_REJECTED', v_d2 ->> 'outcome');
    v_res := pg_temp._try(format('select public.admin_decide_refund(%L, ''APPROVED'', %L)', v_r2, v_admin));
    insert into _results values ('DN-45: a rejected request cannot be approved later', v_res = 'P0001'
        and (select count(*) from public.payment_reversals where refund_request_id = v_r2) = 0, v_res);
    v_res := pg_temp._try(format('select public.admin_decide_refund(%L, ''MAYBE'', %L)', v_r1, v_admin));
    insert into _results values ('an unknown decision is rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.admin_decide_refund(%L, ''APPROVED'', %L)', gen_random_uuid(), v_admin));
    insert into _results values ('an unknown request -> P0002', v_res = 'P0002', v_res);

    -- ============ fault injection: no reversal row -> no approval ============
    create function public.__v3p7_boom() returns trigger language plpgsql as $f$
    begin
        if new.idempotency_key = 'refund:' || current_setting('v3p7.boom_request', true) then
            raise exception 'simulated reversal failure';
        end if;
        return new;
    end;
    $f$;
    create trigger __v3p7_boom before insert on public.payment_reversals
        for each row execute function public.__v3p7_boom();
    perform set_config('v3p7.boom_request', v_r3::text, true);
    v_res := pg_temp._try(format('select public.admin_decide_refund(%L, ''APPROVED'', %L)', v_r3, v_admin));
    select * into v_rr from public.refund_requests where id = v_r3;
    insert into _results values ('BR-39 fault injection: the reversal row cannot be created -> the approval is NOT committed',
        v_res = 'P0001' and v_rr.status = 'REQUESTED' and v_rr.processed_at is null
        and (select count(*) from public.payment_reversals where refund_request_id = v_r3) = 0, v_res || ' ' || v_rr.status);
    drop trigger __v3p7_boom on public.payment_reversals;
    v_d := public.admin_decide_refund(v_r3, 'APPROVED', v_admin);
    insert into _results values ('BR-39: once the reversal can be created the approval commits (4 x 1000)',
        v_d ->> 'outcome' = 'APPROVED' and (select amount from public.payment_reversals where id = (v_d ->> 'reversal_id')::uuid) = 4000, v_d ->> 'outcome');
    insert into _results values ('BR-34: the two approved refunds reverse 2000 + 4000 = 6000 within the payment amount (6000)',
        (select display_status from public.get_payment_reversal_summary(v_pay)) = 'REFUND_IN_PROGRESS'
        and (select reversible_amount from public.get_payment_reversal_summary(v_pay)) = 0, 'checked');

    -- ============ PG failure keeps the approval; retry (BR-39, DN-40) ============
    select id into v_rx from public.payment_reversals where refund_request_id = v_r1;
    perform public.claim_payment_reversal(v_rx);
    perform public.complete_payment_reversal(v_rx, false, null, 'PG down');
    select * into v_rr from public.refund_requests where id = v_r1;
    insert into _results values ('BR-39: a PG failure leaves the Refund APPROVED and the reversal FAILED; it is never moved back',
        v_rr.status = 'APPROVED' and (select status from public.payment_reversals where id = v_rx) = 'FAILED'
        and (select status from public.payments where id = v_pay) = 'SUCCEEDED', v_rr.status);
    v_d2 := public.admin_decide_refund(v_r1, 'APPROVED', v_admin);
    insert into _results values ('a repeated approval after the PG failure repeats nothing (same reversal, one row)',
        v_d2 ->> 'outcome' = 'ALREADY_APPROVED' and v_d2 ->> 'reversal_id' = v_rx::text
        and (select count(*) from public.payment_reversals where refund_request_id = v_r1) = 1, v_d2 ->> 'outcome');
    perform public.retry_payment_reversal(v_rx, v_admin);
    perform public.claim_payment_reversal(v_rx);
    perform public.complete_payment_reversal(v_rx, true, '__v3p7_pg_1');
    insert into _results values ('retry on the same reversal succeeds; still one reversal',
        (select status from public.payment_reversals where id = v_rx) = 'SUCCEEDED'
        and (select count(*) from public.payment_reversals where refund_request_id = v_r1) = 1, 'checked');

    -- ============ restock: explicit, original allocation Ware, bounded (BR-40, S-20..S-22) ============
    select id into v_ri from public.refund_items where refund_request_id = v_r1;
    v_before := pg_temp._stock(v_w1);
    v_restock := public.admin_restock_refund_item(v_r1, v_ri, v_w1, 1);
    insert into _results values ('S-21: a partial restock of 1 raises current_stock by 1 (reserved unchanged) into the original Ware',
        v_restock.quantity = 1 and (select current_stock from public.wares where id = v_w1) = split_part(v_before, '/', 1)::bigint + 1
        and (select reserved_stock from public.wares where id = v_w1) = split_part(v_before, '/', 2)::bigint, pg_temp._stock(v_w1));
    v_res := pg_temp._try(format('select public.admin_restock_refund_item(%L, %L, %L, 2)', v_r1, v_ri, v_w1));
    insert into _results values ('S-22: restocking beyond the refunded quantity (2) is refused', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.admin_restock_refund_item(%L, %L, %L, 1)', v_r1, v_ri, v_w2));
    insert into _results values ('BR-40: a Ware that is not an original allocation Ware is refused', v_res = 'P0001', v_res);
    perform public.admin_restock_refund_item(v_r1, v_ri, v_w1, 1);
    v_res := pg_temp._try(format('select public.admin_restock_refund_item(%L, %L, %L, 1)', v_r1, v_ri, v_w1));
    insert into _results values ('S-22: nothing more can be restocked once the refunded quantity is restocked', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.admin_restock_refund_item(%L, %L, %L, 1)', v_r2,
        (select id from public.refund_items where refund_request_id = v_r2), v_w1));
    insert into _results values ('S-20: a REJECTED request cannot be restocked', v_res = 'P0001', v_res);
    insert into _results values ('BR-41: the Order status is still PROCESSING after approvals and restocks', pg_temp._status(v_o) = 'PROCESSING', pg_temp._status(v_o));

    -- ============ SHIPPED / DELIVERED Orders ============
    v_o2 := pg_temp._processing(pg_temp._order(v_a, v_product, v_v2, 3));
    perform public.admin_advance_order(v_o2, 'SHIPPED');
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_o2, pg_temp._ri(pg_temp._item(v_o2), 1)));
    insert into _results values ('a SHIPPED Order can be refunded', v_res = 'OK', v_res);
    perform public.admin_advance_order(v_o2, 'DELIVERED');
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_a, v_o2, pg_temp._ri(pg_temp._item(v_o2), 1)));
    insert into _results values ('a DELIVERED Order can be refunded (cumulative 2 of 3)', v_res = 'OK', v_res);

    -- ============ BR-34 makes an over-large approval fail atomically ============
    v_o3 := pg_temp._processing(pg_temp._order(v_a, v_product, v_v1, 4));          -- payment 4000
    select payment_id into v_pay from public.orders where id = v_o3;
    v_r4 := public.create_refund_request(v_a, v_o3, pg_temp._ri(pg_temp._item(v_o3), 4));
    perform public.create_payment_reversal(v_pay, 1000, 'MANUAL_RECONCILIATION', '__v3p7_manual');
    v_res := pg_temp._try(format('select public.admin_decide_refund(%L, ''APPROVED'', %L)', v_r4, v_admin));
    insert into _results values ('BR-34: an approval that would push the reversals above the payment fails and the request stays REQUESTED',
        v_res = '23514' and (select status from public.refund_requests where id = v_r4) = 'REQUESTED'
        and (select count(*) from public.payment_reversals where refund_request_id = v_r4) = 0, v_res);

    -- ============ legacy Order without any Payment ============
    insert into public.orders (client_id, status, subtotal, total_amount) values (v_a, 'DELIVERED', 500, 500) returning id into v_ol;
    insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot)
    values (v_ol, v_product, v_v2, 1, 500, 500, '__verify legacy');
    v_rx := public.create_refund_request(v_a, v_ol, pg_temp._ri(pg_temp._item(v_ol), 1));
    v_res := pg_temp._try(format('select public.admin_decide_refund(%L, ''APPROVED'', %L)', v_rx, v_admin));
    insert into _results values ('an Order with no Payment cannot be approved (nothing to reverse); the request stays REQUESTED',
        v_res = 'P0001' and (select status from public.refund_requests where id = v_rx) = 'REQUESTED', v_res);

    -- ============ DN-47 status set, grants, v2 regression ============
    v_res := pg_temp._try(format('insert into public.refund_requests (order_id, client_id, status) values (%L, %L, ''COMPLETED'')', v_o, v_a));
    insert into _results values ('DN-47: COMPLETED is not accepted for new rows', v_res = '23514', v_res);
    v_res := pg_temp._try(format('insert into public.refund_requests (order_id, client_id, status) values (%L, %L, ''CANCELLED'')', v_o, v_a));
    insert into _results values ('DN-47: CANCELLED is not accepted for new rows', v_res = '23514', v_res);

    insert into _results values ('grants: the Phase 7 functions are service_role only',
        (select bool_and(
            has_function_privilege('service_role', f, 'execute')
            and not has_function_privilege('anon', f, 'execute')
            and not has_function_privilege('authenticated', f, 'execute'))
         from unnest(array[
            'public.create_refund_request(uuid, uuid, jsonb, text)',
            'public.admin_decide_refund(uuid, text, uuid)'
         ]::regprocedure[]) as f), 'checked');
    insert into _results values ('v2 regression: request_refund(), admin_transition_refund_status() and restock_order_item() still exist (retired in Phase 8)',
        to_regprocedure('public.request_refund(uuid, jsonb, text)') is not null
        and to_regprocedure('public.admin_transition_refund_status(uuid, text)') is not null
        and to_regprocedure('public.restock_order_item(uuid, uuid, bigint)') is not null, 'checked');

    -- invariants
    select count(*) into v_n from public.wares w where w.id in (v_w1, v_w2) and (w.reserved_stock > w.current_stock or w.current_stock < 0);
    insert into _results values ('invariant: 0 <= reserved <= current on every Ware', v_n = 0, v_n::text);
    select count(*) into v_n from (
        select ri.order_item_id from public.refund_items ri join public.refund_requests rr on rr.id = ri.refund_request_id
        where rr.status in ('REQUESTED', 'APPROVED') group by ri.order_item_id
        having sum(ri.quantity) > (select oi.quantity from public.order_items oi where oi.id = ri.order_item_id)) d;
    insert into _results values ('BR-38: no OrderItem has a valid cumulative refund above its quantity', v_n = 0, v_n::text);
    select count(*) into v_n from public.payments p
     where p.client_id in (v_a, v_b) and (select coalesce(sum(r.amount), 0) from public.payment_reversals r where r.payment_id = p.id and r.status in ('PENDING', 'SUCCEEDED')) > p.amount;
    insert into _results values ('BR-34: no Payment is reversed above its amount', v_n = 0, v_n::text);
    select count(*) into v_n from public.orders where client_id in (v_a, v_b) and status = 'CANCELLED' and id <> v_oc;
    insert into _results values ('BR-41: no Refund flow cancelled an Order', v_n = 0, v_n::text);

    insert into _fx values ('client', v_a), ('order', v_o), ('refund', v_r1);
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
    v_client uuid := (select id from _fx where key = 'client');
    v_order uuid := (select id from _fx where key = 'order');
    v_refund uuid := (select id from _fx where key = 'refund');
    v_n bigint;
begin
    select count(*) into v_n from public.refund_requests where id = v_refund;
    insert into _results values ('the Client reads its own refund status (RLS)', v_n = 1, v_n::text);
    begin
        perform count(*) from public.refund_item_restocks;
        insert into _results values ('BR-20: the Consumer cannot read restock records (permission denied)', false, 'read');
    exception when others then
        insert into _results values ('BR-20: the Consumer cannot read restock records (permission denied)', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.create_refund_request(v_client, v_order, '[]'::jsonb);
        insert into _results values ('rls: authenticated cannot call the trusted create_refund_request', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot call the trusted create_refund_request', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.admin_decide_refund(v_refund, 'APPROVED', v_client);
        insert into _results values ('rls: authenticated cannot approve a refund', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot approve a refund', sqlstate = '42501', sqlerrm);
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
        raise exception 'v3 phase 7 refund check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 7 refund check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
