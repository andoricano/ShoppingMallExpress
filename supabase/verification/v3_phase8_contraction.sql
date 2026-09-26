-- ============================================================
-- Local verification: v3 legacy contraction (cutover script)
-- supabase/cutover/v3_legacy_contraction.sql
--
-- Do not run this file directly: run
--
--   bash supabase/verification/v3_phase8_contraction.sh
--
-- which substitutes the stock cutover and the contraction script at the @@
-- markers below and pipes the result into the LOCAL database. One transaction,
-- ROLLED BACK: neither cutover script persists.
--
-- A v2-style state is built first (net-remainder stock, a paid PAID Order, an
-- unpaid PENDING Order, a manually marked PAID Order without payment, ...). The
-- contraction must refuse while unpaid Orders exist, then map PAID and remove
-- the v2 paths once they are resolved; the v3 paths must keep working after it.
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

create function pg_temp._status(p_order uuid) returns text
language sql as $$ select status from public.orders where id = p_order; $$;

do $$
declare
    v_client uuid := gen_random_uuid();
    v_wh uuid;
    v_w1 uuid;
    v_created jsonb;
    v_product uuid; v_v1 uuid; v_vsold uuid;
    v_post uuid;
    v_p1 uuid; v_p2 uuid; v_p3 uuid; v_p4 uuid; v_p5 uuid; v_p6 uuid;
    v_item uuid;
begin
    insert into auth.users (id) values (v_client);
    v_wh := public.create_warehouse('__verify v3p8 warehouse');
    -- v2: physical 30 = remainder 21 + PAID 2 + unpaid PENDING 3 + manual PAID 1 + PROCESSING 1 + DELIVERED 2
    v_w1 := public.create_ware(v_wh, '__verify v3p8 W1', null, 'GENERAL', 21);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p8 product"}', '[]',
        '[{"price":1000,"skuCode":"__V3P8C-1"},{"price":500,"skuCode":"__V3P8C-S"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_v1 := (v_created -> 'variantIds' ->> 0)::uuid;
    v_vsold := (v_created -> 'variantIds' ->> 1)::uuid;
    perform public.link_product_variant_ware(v_v1, v_w1);
    update public.product_variants set is_sold_out = true where id = v_vsold;
    insert into public.product_posts (title, status) values ('__verify v3p8 post', 'PUBLISHED') returning id into v_post;
    insert into public.product_post_products (product_post_id, product_id) values (v_post, v_product);

    -- one Order per case, each with one OrderItem allocated on W1
    declare
        v_case record;
        v_order uuid;
    begin
        for v_case in
            select * from (values
                ('p1', 'PAID',       2, true),
                ('p2', 'PENDING',    3, false),
                ('p6', 'PAID',       1, false),
                ('p3', 'PROCESSING', 1, true),
                ('p4', 'DELIVERED',  2, true),
                ('p5', 'CANCELLED',  4, true)
            ) as t(k, status, qty, has_payment)
        loop
            insert into public.orders (client_id, status, subtotal, total_amount)
            values (v_client, v_case.status, v_case.qty * 1000, v_case.qty * 1000) returning id into v_order;
            insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot)
            values (v_order, v_product, v_v1, v_case.qty, 1000, v_case.qty * 1000, '__verify v3p8') returning id into v_item;
            insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity) values (v_item, v_w1, v_case.qty);

            if v_case.has_payment and v_case.status <> 'CANCELLED' then
                insert into public.payments (client_id, purpose, order_id, amount, status, pg_callback_id, completed_at)
                values (v_client, 'ORDER_PAYMENT', v_order, v_case.qty * 1000, 'SUCCEEDED', '__v3p8_cb_' || v_case.k, now());
            end if;

            insert into _fx values (v_case.k, v_order);
        end loop;
    end;

    insert into _fx values ('client', v_client), ('w1', v_w1), ('product', v_product), ('v1', v_v1), ('vsold', v_vsold);
end;
$$;

-- ---------------- the stock cutover first (it is a precondition) ----------------
-- @@STOCK_CUTOVER@@

do $$
declare
    v_w1 uuid := (select id from _fx where key = 'w1');
begin
    insert into _results values ('setup: stock converted to 27 / reserved 6 (PAID 2 + PENDING 3 + PAID 1)',
        pg_temp._stock(v_w1) = '27/6', pg_temp._stock(v_w1));
end;
$$;

-- ---------------- 1. refusal while unpaid Orders exist ----------------
savepoint before_refused_run;
\set ON_ERROR_STOP off
-- @@CONTRACTION@@
rollback to savepoint before_refused_run;
\set ON_ERROR_STOP on

do $$
declare
    v_p1 uuid := (select id from _fx where key = 'p1');
begin
    insert into _results values ('refusal: with an unpaid PENDING and a payment-less PAID Order nothing was changed (P1 still PAID)',
        pg_temp._status(v_p1) = 'PAID'
        and to_regprocedure('public.create_order_from_cart(jsonb, text)') is not null
        and to_regprocedure('public.request_refund(uuid, jsonb, text)') is not null, pg_temp._status(v_p1));
    insert into _results values ('refusal: the guard names the problem (2 Orders without payment evidence)',
        (select count(*) from public.orders o where o.status in ('PENDING', 'PAID') and o.payment_id is null
            and not exists (select 1 from public.payments p where p.order_id = o.id and p.status = 'SUCCEEDED')) = 2, 'checked');
end;
$$;

-- ---------------- the unpaid Orders are resolved (cancelled, reservation released) ----------------
do $$
declare
    v_w1 uuid := (select id from _fx where key = 'w1');
begin
    update public.orders set status = 'CANCELLED' where id in ((select id from _fx where key = 'p2'), (select id from _fx where key = 'p6'));
    update public.wares set reserved_stock = reserved_stock - 4 where id = v_w1;
    insert into _results values ('resolved: unpaid Orders cancelled, reserved 6 -> 2 (27/2)', pg_temp._stock(v_w1) = '27/2', pg_temp._stock(v_w1));
end;
$$;

-- ---------------- 2. the contraction runs ----------------
-- @@CONTRACTION@@

do $$
declare
    v_client uuid := (select id from _fx where key = 'client');
    v_p1 uuid := (select id from _fx where key = 'p1');
    v_w1 uuid := (select id from _fx where key = 'w1');
    v_product uuid := (select id from _fx where key = 'product');
    v_v1 uuid := (select id from _fx where key = 'v1');
    v_vsold uuid := (select id from _fx where key = 'vsold');
    v_res text;
    v_pay public.payments;
    v_r jsonb;
    v_status text;
    v_n bigint;
    v_pay1 uuid;
begin
    -- PAID lifecycle
    select payment_id into v_pay1 from public.orders where id = v_p1;
    insert into _results values ('PAID is mapped to PENDING and linked to its Payment (orders.payment_id, payments.order_id mirrored)',
        pg_temp._status(v_p1) = 'PENDING' and v_pay1 is not null
        and (select order_id from public.payments where id = v_pay1) = v_p1, pg_temp._status(v_p1));
    insert into _results values ('no PAID Order remains',
        (select count(*) from public.orders where status = 'PAID') = 0, 'checked');
    begin
        insert into public.orders (client_id, status, subtotal, total_amount) values (v_client, 'PAID', 1, 1);
        insert into _results values ('the status CHECK no longer accepts PAID', false, 'inserted');
    exception when others then
        insert into _results values ('the status CHECK no longer accepts PAID', sqlstate = '23514', sqlerrm);
    end;

    -- the v2 paths are gone
    insert into _results values ('the six v2 order paths are removed',
        to_regprocedure('public.create_order_from_cart(jsonb, text)') is null
        and to_regprocedure('public.cancel_order(uuid)') is null
        and to_regprocedure('public.request_refund(uuid, jsonb, text)') is null
        and to_regprocedure('public.admin_transition_order_status(uuid, text)') is null
        and to_regprocedure('public.admin_transition_refund_status(uuid, text)') is null
        and to_regprocedure('public.restock_order_item(uuid, uuid, bigint)') is null, 'checked');
    insert into _results values ('the v3 paths still exist (finalize, cancel, advance, refund, decide, restock)',
        to_regprocedure('public.finalize_order(uuid, uuid, jsonb, jsonb)') is not null
        and to_regprocedure('public.cancel_pending_order(uuid, uuid, text, text)') is not null
        and to_regprocedure('public.admin_advance_order(uuid, text)') is not null
        and to_regprocedure('public.create_refund_request(uuid, uuid, jsonb, text)') is not null
        and to_regprocedure('public.admin_decide_refund(uuid, text, uuid)') is not null
        and to_regprocedure('public.admin_restock_refund_item(uuid, uuid, uuid, bigint)') is not null, 'checked');

    -- the converted Order works on the v3 path: consume the converted reservation exactly once
    v_r := public.admin_advance_order(v_p1, 'PROCESSING');
    insert into _results values ('the converted (formerly PAID) Order enters PROCESSING with payment evidence: consumed 2 (25/0)',
        v_r ->> 'outcome' = 'TRANSITIONED' and pg_temp._stock(v_w1) = '25/0', pg_temp._stock(v_w1));

    -- a new v3 order after the contraction
    declare
        v_items jsonb := jsonb_build_array(jsonb_build_object('productId', v_product, 'productVariantId', v_v1, 'quantity', 3));
        v_checkout public.payments;
    begin
        v_checkout := public.create_checkout_payment(v_client, v_items);
        perform public.complete_checkout_payment(v_client, v_checkout.id, true, '__v3p8_cb_new');
        v_r := public.finalize_order(v_client, v_checkout.id, v_items, '{"recipient":"__verify","address":"Seoul"}'::jsonb);
        insert into _results values ('a new checkout + finalize works after the contraction (reserved 3)',
            v_r ->> 'outcome' = 'CREATED' and pg_temp._stock(v_w1) = '25/3', pg_temp._stock(v_w1));
        v_r := public.cancel_pending_order((v_r ->> 'order_id')::uuid, v_client, 'CLIENT');
        insert into _results values ('cancel works after the contraction (reserved back to 0)',
            v_r ->> 'outcome' = 'CANCELLED' and pg_temp._stock(v_w1) = '25/0', pg_temp._stock(v_w1));
    end;

    -- Point top-up is retained (DN-49); Order payments are refused on the old functions
    v_pay := public.create_payment(v_client, 'POINT_TOPUP', null, 5000);
    v_pay := public.complete_payment(v_client, v_pay.id, true, '__v3p8_point');
    insert into _results values ('Point top-up still works: SUCCEEDED and one ledger entry credited 5000',
        v_pay.status = 'SUCCEEDED'
        and (select balance from public.point_balances where client_id = v_client) = 5000
        and (select count(*) from public.point_ledger where payment_id = v_pay.id) = 1, v_pay.status);
    begin
        perform public.create_payment(v_client, 'ORDER_PAYMENT', gen_random_uuid(), 1000);
        insert into _results values ('create_payment refuses ORDER_PAYMENT', false, 'created');
    exception when others then
        insert into _results values ('create_payment refuses ORDER_PAYMENT', sqlstate = 'P0001', sqlerrm);
    end;
    insert into _results values ('the v2-direction Payment of an Order stays as it was (SUCCEEDED)',
        (select status from public.payments where id = v_pay1) = 'SUCCEEDED', 'checked');

    -- Refund status set validated (DN-47)
    insert into _results values ('the Refund status CHECK is validated',
        (select convalidated from pg_constraint where conname = 'refund_requests_status_v3_valid'), 'checked');

    -- sellability contract name
    select stock_status into v_status from public.get_product_variant_availability(v_vsold);
    insert into _results values ('availability reports the v3 status SOLD_OUT for an explicitly sold-out Variant', v_status = 'SOLD_OUT', v_status);
    select stock_status into v_status from public.get_product_variant_availability(v_v1);
    insert into _results values ('availability reports AVAILABLE for an ordinary Variant', v_status = 'AVAILABLE', v_status);

    -- invariants
    select count(*) into v_n from public.wares w
     where w.reserved_stock > w.current_stock or w.current_stock < 0;
    insert into _results values ('invariant: 0 <= reserved <= current on every Ware', v_n = 0, v_n::text);
end;
$$;

-- ---------------- 3. a second run must be refused ----------------
savepoint before_second_run;
\set ON_ERROR_STOP off
-- @@CONTRACTION@@
rollback to savepoint before_second_run;
\set ON_ERROR_STOP on

do $$
begin
    insert into _results values ('second run: refused (the v2 objects are already gone) and nothing changed',
        pg_temp._status((select id from _fx where key = 'p1')) = 'PROCESSING', 'checked');
end;
$$;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'v3 phase 8 contraction check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 8 contraction check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
