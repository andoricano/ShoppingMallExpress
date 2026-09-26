-- ============================================================
-- Local verification: Mall v3 Phase 1 schema foundation
-- (migration 20260926130000_v3_phase1_schema_foundation.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/v3_phase1_schema.sql
--
-- (without a host psql: docker exec -i supabase_db_ShoppingEx \
--    psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
--    < supabase/verification/v3_phase1_schema.sql)
--
-- Runs in one transaction and is ROLLED BACK. Every negative case runs
-- in its own subtransaction and must fail with the expected SQLSTATE.
--
-- Part 1 (owner = trusted server boundary): new constraints, positive
--   and negative cases, and the v2 payment flow on the new schema.
-- Part 2 (authenticated with JWT claims): v2 Consumer smoke on the new
--   schema (add to cart, create order, cancel, refund request) and
--   Consumer access to the new objects.
--
-- Concurrency of the allocation bound, the reversal limit, and one Order
-- per Payment relies on row locks / unique constraints; true parallel
-- sessions are covered by v3_phase1_concurrency.sh.
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

-- Runs p_sql in a subtransaction. Returns the SQLSTATE it failed with,
-- or 'OK' when it succeeded (and its effects are kept).
create function pg_temp._try(p_sql text) returns text
language plpgsql as $$
begin
    execute p_sql;
    return 'OK';
exception when others then
    return sqlstate;
end;
$$;

-- ------------------------------------------------------------
-- Part 1: owner
-- ------------------------------------------------------------
do $$
declare
    v_a uuid := gen_random_uuid();
    v_b uuid := gen_random_uuid();
    v_wh uuid;
    v_ware uuid;
    v_created jsonb;
    v_product uuid;
    v_variant uuid;
    v_variant2 uuid;
    v_order1 uuid; v_order2 uuid; v_order3 uuid; v_order_b uuid;
    v_pay_null uuid;        -- Order-less ORDER_PAYMENT
    v_pay_topup uuid;
    v_pay_b uuid;           -- other client's payment
    v_pay_ok uuid;          -- SUCCEEDED 10000
    v_pay_pending uuid;
    v_pay_room uuid;        -- SUCCEEDED 100000, nothing reversed yet
    v_pay_link uuid;
    v_oi uuid;
    v_alloc uuid;
    v_r1 uuid; v_r2 uuid; v_r3 uuid;
    v_refund uuid;
    v_res text;
    v_bool boolean;
    v_count bigint;
    v_status text;
    v_payment public.payments;
    v_smoke_order uuid;
    v_smoke_delivered uuid;
    v_smoke_oi uuid;
begin
    insert into auth.users (id) values (v_a), (v_b);

    v_wh := public.create_warehouse('__verify v3p1 warehouse');
    v_ware := public.create_ware(v_wh, '__verify v3p1 ware', null, 'GENERAL', 10);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p1 product"}', '[]',
        '[{"price":1000,"skuCode":"__VERIFY-V3P1-1"},{"price":2000,"skuCode":"__VERIFY-V3P1-2"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_variant := (v_created -> 'variantIds' ->> 0)::uuid;
    v_variant2 := (v_created -> 'variantIds' ->> 1)::uuid;
    perform public.link_product_variant_ware(v_variant, v_ware);

    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'PENDING', 5000, 5000) returning id into v_order1;
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'PENDING', 5000, 5000) returning id into v_order2;
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'PENDING', 5000, 5000) returning id into v_order3;
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_b, 'PENDING', 5000, 5000) returning id into v_order_b;

    -- ============ product_variants.is_sold_out (BR-46) ============
    select is_sold_out into v_bool from public.product_variants where id = v_variant;
    insert into _results values ('sold_out: new Variant defaults to false', v_bool = false, v_bool::text);

    update public.product_variants set is_sold_out = true where id = v_variant2;
    select is_sold_out into v_bool from public.product_variants where id = v_variant2;
    insert into _results values ('sold_out: can be set independently of stock / is_active',
        v_bool = true and (select is_active from public.product_variants where id = v_variant2), v_bool::text);

    v_res := pg_temp._try(format(
        'update public.product_variants set is_sold_out = null where id = %L', v_variant));
    insert into _results values ('sold_out: NULL rejected', v_res = '23502', v_res);

    -- ============ payments: Order-less ORDER_PAYMENT (BR-25) ============
    insert into public.payments (client_id, purpose, amount)
    values (v_a, 'ORDER_PAYMENT', 10000) returning id into v_pay_null;
    insert into _results values ('payments: ORDER_PAYMENT without Order allowed',
        v_pay_null is not null, coalesce(v_pay_null::text, 'null'));

    insert into public.payments (client_id, purpose, amount)
    values (v_a, 'POINT_TOPUP', 3000) returning id into v_pay_topup;

    v_res := pg_temp._try(format(
        'insert into public.payments (client_id, purpose, order_id, amount) values (%L, ''POINT_TOPUP'', %L, 3000)',
        v_a, v_order1));
    insert into _results values ('payments: POINT_TOPUP with Order rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'insert into public.payments (client_id, purpose, amount) values (%L, ''BOGUS'', 1000)', v_a));
    insert into _results values ('payments: unknown purpose rejected', v_res = '23514', v_res);

    -- unique PG reference
    update public.payments set status = 'FAILED', pg_callback_id = '__v3p1_cb_1', completed_at = now()
    where id = v_pay_topup;
    insert into public.payments (client_id, purpose, amount)
    values (v_b, 'ORDER_PAYMENT', 5000) returning id into v_pay_b;
    v_res := pg_temp._try(format(
        'update public.payments set status = ''FAILED'', pg_callback_id = ''__v3p1_cb_1'', completed_at = now() where id = %L',
        v_pay_b));
    insert into _results values ('payments: duplicate pg_callback_id rejected', v_res = '23505', v_res);

    select count(*) into v_count from public.payments
    where pg_callback_id is null and client_id in (v_a, v_b);
    insert into _results values ('payments: several payments without a PG reference allowed',
        v_count >= 2, v_count::text);

    -- ============ orders.payment_id: one Order per Payment (BR-45) ============
    insert into public.payments (client_id, purpose, amount, status, pg_callback_id, completed_at)
    values (v_a, 'ORDER_PAYMENT', 5000, 'SUCCEEDED', '__v3p1_cb_link', now())
    returning id into v_pay_link;

    update public.orders set payment_id = v_pay_link where id = v_order1;
    select payment_id = v_pay_link into v_bool from public.orders where id = v_order1;
    insert into _results values ('link: Order can reference an Order-less Payment', v_bool, coalesce(v_bool::text, 'null'));

    v_res := pg_temp._try(format(
        'update public.orders set payment_id = %L where id = %L', v_pay_link, v_order2));
    insert into _results values ('link: second Order for the same Payment rejected', v_res = '23505', v_res);

    select count(*) into v_count from public.orders where id in (v_order2, v_order3) and payment_id is null;
    insert into _results values ('link: Orders without a Payment stay unlinked (many NULLs)', v_count = 2, v_count::text);

    v_res := pg_temp._try(format(
        'update public.orders set payment_id = %L where id = %L', v_pay_topup, v_order2));
    insert into _results values ('link: POINT_TOPUP cannot be linked to an Order', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.orders set payment_id = %L where id = %L', v_pay_b, v_order2));
    insert into _results values ('link: other client''s Payment rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.orders set payment_id = %L where id = %L', gen_random_uuid(), v_order2));
    insert into _results values ('link: unknown Payment rejected by foreign key', v_res = '23503', v_res);

    -- v2 direction stays consistent with the v3 link
    v_res := pg_temp._try(format(
        'update public.payments set order_id = %L where id = %L', v_order2, v_pay_link));
    insert into _results values ('link: payments.order_id cannot contradict orders.payment_id',
        v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.payments set order_id = %L where id = %L', v_order1, v_pay_link));
    insert into _results values ('link: payments.order_id equal to the linked Order allowed',
        v_res = 'OK', v_res);

    -- a Payment already attached (v2 direction) to another Order cannot be linked elsewhere
    v_res := pg_temp._try(format(
        'update public.orders set payment_id = %L where id = %L', v_pay_link, v_order3));
    insert into _results values ('link: second Order for a Payment still rejected after both directions set',
        v_res in ('23505', '23514'), v_res);

    -- ============ payment_reversals (BR-29 .. BR-34) ============
    insert into public.payments (client_id, purpose, amount, status, pg_callback_id, completed_at)
    values (v_a, 'ORDER_PAYMENT', 10000, 'SUCCEEDED', '__v3p1_cb_ok', now())
    returning id into v_pay_ok;
    insert into public.payments (client_id, purpose, amount)
    values (v_a, 'ORDER_PAYMENT', 10000) returning id into v_pay_pending;
    -- A Payment with plenty of room, so shape/uniqueness negatives fail for
    -- their own reason and not because of the amount limit.
    insert into public.payments (client_id, purpose, amount, status, pg_callback_id, completed_at)
    values (v_a, 'ORDER_PAYMENT', 100000, 'SUCCEEDED', '__v3p1_cb_room', now())
    returning id into v_pay_room;

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 1000, ''FINALIZE_FAILURE'', ''__v3p1_pending_pay'')',
        v_pay_pending));
    insert into _results values ('reversal: non-SUCCEEDED Payment cannot be reversed', v_res = '23514', v_res);

    insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key)
    values (v_pay_ok, 4000, 'FINALIZE_FAILURE', '__v3p1_k1') returning id into v_r1;
    insert into _results values ('reversal: FINALIZE_FAILURE without Order allowed, defaults PENDING',
        (select status = 'PENDING' and order_id is null from public.payment_reversals where id = v_r1), 'ok');

    insert into public.payment_reversals (payment_id, order_id, amount, reason_type, idempotency_key)
    values (v_pay_ok, v_order1, 6000, 'ORDER_CANCEL', '__v3p1_k2') returning id into v_r2;
    insert into _results values ('reversal: several reversals per Payment up to the amount',
        (select count(*) = 2 from public.payment_reversals where payment_id = v_pay_ok), 'ok');

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 1, ''ORPHAN_PAYMENT'', ''__v3p1_k3'')',
        v_pay_ok));
    insert into _results values ('reversal: total above the Payment amount rejected (BR-34)', v_res = '23514', v_res);

    update public.payment_reversals set status = 'FAILED', failure_reason = 'pg down' where id = v_r2;
    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 6000, ''ORPHAN_PAYMENT'', ''__v3p1_k4'')',
        v_pay_ok));
    insert into _results values ('reversal: a FAILED reversal frees its amount', v_res = 'OK', v_res);

    v_res := pg_temp._try(format(
        'update public.payment_reversals set status = ''PENDING'' where id = %L', v_r2));
    insert into _results values ('reversal: FAILED -> PENDING beyond the limit rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.payment_reversals set amount = 9000 where id = %L', v_r1));
    insert into _results values ('reversal: raising an amount beyond the limit rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.payment_reversals set status = ''SUCCEEDED'', pg_reference = ''__v3p1_pg_1'' where id = %L', v_r1));
    insert into _results values ('reversal: PENDING -> SUCCEEDED allowed', v_res = 'OK', v_res);

    select status into v_status from public.payments where id = v_pay_ok;
    insert into _results values ('reversal: original payments.status stays SUCCEEDED (BR-29)',
        v_status = 'SUCCEEDED', v_status);

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 100, ''MANUAL_RECONCILIATION'', ''__v3p1_k1'')',
        v_pay_room));
    insert into _results values ('reversal: duplicate idempotency key rejected', v_res = '23505', v_res);

    v_res := pg_temp._try(format(
        'update public.payment_reversals set pg_reference = ''__v3p1_pg_1'' where idempotency_key = ''__v3p1_k4'''));
    insert into _results values ('reversal: duplicate pg_reference rejected', v_res = '23505', v_res);

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 0, ''FINALIZE_FAILURE'', ''__v3p1_k5'')',
        v_pay_room));
    insert into _results values ('reversal: non-positive amount rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 100, ''BOGUS'', ''__v3p1_k6'')',
        v_pay_room));
    insert into _results values ('reversal: unknown reason rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.payment_reversals set status = ''BOGUS'' where id = %L', v_r1));
    insert into _results values ('reversal: unknown status rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 100, ''FINALIZE_FAILURE'', ''   '')',
        v_pay_room));
    insert into _results values ('reversal: blank idempotency key rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 100, ''REFUND'', ''__v3p1_k7'')',
        v_pay_room));
    insert into _results values ('reversal: REFUND without refund request rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values (%L, 100, ''ORDER_CANCEL'', ''__v3p1_k8'')',
        v_pay_room));
    insert into _results values ('reversal: ORDER_CANCEL without Order rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.payment_reversals set payment_id = %L where id = %L', v_pay_link, v_r1));
    insert into _results values ('reversal: cannot move to another Payment', v_res = '23514', v_res);

    -- REFUND reversal linked to a refund request
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'DELIVERED', 2000, 2000) returning id into v_smoke_delivered;
    insert into public.refund_requests (order_id, client_id, status, requested_amount)
    values (v_smoke_delivered, v_a, 'REQUESTED', 2000) returning id into v_refund;
    insert into public.payments (client_id, purpose, amount, status, pg_callback_id, completed_at)
    values (v_a, 'ORDER_PAYMENT', 2000, 'SUCCEEDED', '__v3p1_cb_refund', now())
    returning id into v_pay_link;
    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, order_id, refund_request_id, amount, reason_type, idempotency_key) values (%L, %L, %L, 2000, ''REFUND'', ''__v3p1_k9'')',
        v_pay_link, v_smoke_delivered, v_refund));
    insert into _results values ('reversal: REFUND linked to its refund request allowed', v_res = 'OK', v_res);

    v_res := pg_temp._try(format(
        'insert into public.payment_reversals (payment_id, order_id, refund_request_id, amount, reason_type, idempotency_key) values (%L, %L, %L, 1, ''ORDER_CANCEL'', ''__v3p1_k10'')',
        v_pay_room, v_smoke_delivered, v_refund));
    insert into _results values ('reversal: refund request on a non-REFUND reason rejected', v_res = '23514', v_res);

    -- ============ allocation bound (BR-07) ============
    insert into public.order_items (
        order_id, product_id, product_variant_id, quantity,
        unit_price, line_total, product_name_snapshot)
    values (v_order3, v_product, v_variant, 5, 1000, 5000, '__verify v3p1')
    returning id into v_oi;

    v_res := pg_temp._try(format(
        'insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity) values (%L, %L, 3)', v_oi, v_ware));
    insert into _results values ('alloc: partial allocation (shortage 2) allowed', v_res = 'OK', v_res);

    v_res := pg_temp._try(format(
        'update public.order_item_ware_allocations set quantity = 6 where order_item_id = %L', v_oi));
    insert into _results values ('alloc: raising allocation above quantity rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'update public.order_item_ware_allocations set quantity = 5 where order_item_id = %L', v_oi));
    insert into _results values ('alloc: full allocation (= quantity) allowed', v_res = 'OK', v_res);

    -- second Ware for the same OrderItem: sum bound across rows
    declare
        v_ware2 uuid := public.create_ware(v_wh, '__verify v3p1 ware 2', null, 'GENERAL', 10);
    begin
        v_res := pg_temp._try(format(
            'insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity) values (%L, %L, 1)', v_oi, v_ware2));
        insert into _results values ('alloc: second Ware beyond the total rejected', v_res = '23514', v_res);

        v_res := pg_temp._try(format(
            'update public.order_item_ware_allocations set quantity = 4 where order_item_id = %L', v_oi));
        insert into _results values ('alloc: lowering allocation allowed', v_res = 'OK', v_res);

        v_res := pg_temp._try(format(
            'insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity) values (%L, %L, 1)', v_oi, v_ware2));
        insert into _results values ('alloc: second Ware up to the total allowed', v_res = 'OK', v_res);
    end;

    -- ============ v2 payment flow on the new schema ============
    v_payment := public.create_payment(v_a, 'ORDER_PAYMENT', v_order2, null);
    insert into _results values ('v2 smoke: create_payment still targets an existing Order',
        v_payment.order_id = v_order2 and v_payment.status = 'PENDING', v_payment.status);
    v_payment := public.complete_payment(v_a, v_payment.id, true, '__v3p1_cb_v2', null);
    select status into v_status from public.orders where id = v_order2;
    insert into _results values ('v2 smoke: complete_payment success -> Order PAID',
        v_payment.status = 'SUCCEEDED' and v_status = 'PAID', v_payment.status || '/' || v_status);

    -- ============ Consumer boundary: no access to reversals ============
    insert into _results values ('rls: authenticated/anon have no privilege on payment_reversals',
        not has_table_privilege('authenticated', 'public.payment_reversals', 'select')
        and not has_table_privilege('anon', 'public.payment_reversals', 'select')
        and not has_table_privilege('authenticated', 'public.payment_reversals', 'insert')
        and not has_table_privilege('anon', 'public.payment_reversals', 'insert'),
        'checked');
    insert into _results values ('rls: payment_reversals has RLS enabled',
        (select relrowsecurity from pg_class where oid = 'public.payment_reversals'::regclass), 'checked');
    insert into _results values ('rls: guard trigger functions are not executable by clients',
        not has_function_privilege('authenticated', 'public.check_order_payment_link()', 'execute')
        and not has_function_privilege('authenticated', 'public.enforce_payment_reversal_limit()', 'execute')
        and not has_function_privilege('authenticated', 'public.enforce_allocation_within_item_quantity()', 'execute'),
        'checked');

    -- ============ fixtures for Part 2 ============
    -- DELIVERED Order with an OrderItem + allocation for the refund-request smoke.
    insert into public.order_items (
        order_id, product_id, product_variant_id, quantity,
        unit_price, line_total, product_name_snapshot)
    values (v_smoke_delivered, v_product, v_variant, 2, 1000, 2000, '__verify v3p1 refund')
    returning id into v_smoke_oi;
    insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity)
    values (v_smoke_oi, v_ware, 2);

    insert into _fx values
        ('a', v_a), ('b', v_b), ('product', v_product), ('variant', v_variant),
        ('ware', v_ware), ('delivered', v_smoke_delivered), ('delivered_item', v_smoke_oi);
end;
$$;

-- ------------------------------------------------------------
-- Part 2: authenticated (v2 Consumer smoke on the new schema)
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', (select id::text from _fx where key = 'a'), true),
    set_config('request.jwt.claims',
        json_build_object('sub', (select id::text from _fx where key = 'a'), 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

do $$
declare
    v_a uuid := (select id from _fx where key = 'a');
    v_product uuid := (select id from _fx where key = 'product');
    v_variant uuid := (select id from _fx where key = 'variant');
    v_delivered uuid := (select id from _fx where key = 'delivered');
    v_delivered_item uuid := (select id from _fx where key = 'delivered_item');
    v_order uuid;
    v_status text;
    v_alloc bigint;
    v_refund uuid;
begin
    perform public.add_cart_item(v_product, v_variant, 2);
    v_order := public.create_order_from_cart('{"recipient":"__verify"}'::jsonb, null);

    select status into v_status from public.orders where id = v_order;
    insert into _results values ('v2 smoke: create_order_from_cart creates a PENDING Order',
        v_status = 'PENDING', coalesce(v_status, 'null'));

    -- Ware allocations are internal; read them through the owner.
    insert into _results values ('v2 smoke: new Order has no v3 payment link',
        (select payment_id is null from public.orders where id = v_order), 'checked');

    perform public.cancel_order(v_order);
    select status into v_status from public.orders where id = v_order;
    insert into _results values ('v2 smoke: cancel_order -> CANCELLED',
        v_status = 'CANCELLED', coalesce(v_status, 'null'));

    v_refund := public.request_refund(
        v_delivered,
        jsonb_build_array(jsonb_build_object('orderItemId', v_delivered_item, 'quantity', 1)),
        '__verify');
    insert into _results values ('v2 smoke: request_refund creates a refund request',
        v_refund is not null, coalesce(v_refund::text, 'null'));

    -- Consumer access to the new objects
    begin
        perform count(*) from public.payment_reversals;
        insert into _results values ('rls: authenticated cannot read payment_reversals', false, 'read');
    exception when others then
        insert into _results values ('rls: authenticated cannot read payment_reversals', sqlstate = '42501', sqlerrm);
    end;

    begin
        insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key)
        values (gen_random_uuid(), 1, 'FINALIZE_FAILURE', '__v3p1_authenticated');
        insert into _results values ('rls: authenticated cannot write payment_reversals', false, 'written');
    exception when others then
        insert into _results values ('rls: authenticated cannot write payment_reversals', sqlstate = '42501', sqlerrm);
    end;

    begin
        update public.orders set payment_id = gen_random_uuid() where id = v_order;
        get diagnostics v_alloc = row_count;
        insert into _results values ('rls: authenticated cannot set orders.payment_id', v_alloc = 0, v_alloc::text);
    exception when others then
        insert into _results values ('rls: authenticated cannot set orders.payment_id', sqlstate in ('42501', '23503'), sqlerrm);
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
        raise exception 'v3 phase 1 schema check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 1 schema check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
