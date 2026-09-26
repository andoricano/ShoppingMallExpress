-- ============================================================
-- Local verification: Mall v3 Phase 4 Stage 2 finalize
-- (migration 20260926160000_v3_phase4_order_finalization.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/verification/v3_phase4_finalize.sql
--
-- Runs in one transaction and is ROLLED BACK. Every negative case runs in
-- its own subtransaction.
--
-- The five minimum integration scenarios (PHASES.md Phase 4):
--   1 normal purchase (S-01)            2 shortage-tolerant purchase (S-02)
--   3 SOLD_OUT rejection (S-04, S-07)   4 price mismatch -> reversal (S-06)
--   5 duplicate finalize -> one Order (S-10, S-11)
-- plus S-03, S-09, S-26, malformed requests, a failing finalize
-- transaction, the orphan rule, closing-reversal exclusivity, grants.
-- Parallel finalize: v3_phase4_concurrency.sh.
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

-- unique PG reference per call
create sequence pg_temp._cb;

-- Stage 1 + PG success: returns the succeeded Payment id.
create function pg_temp._paid(p_client uuid, p_items jsonb) returns uuid
language plpgsql as $$
declare v public.payments;
begin
    v := public.create_checkout_payment(p_client, p_items);
    perform public.complete_checkout_payment(p_client, v.id, true, '__v3p4_cb_' || nextval('pg_temp._cb'));
    return v.id;
end;
$$;

create function pg_temp._stock(p_ware uuid) returns text
language sql as $$
    select current_stock || '/' || reserved_stock from public.wares where id = p_ware;
$$;

create function pg_temp._addr() returns jsonb
language sql as $$ select '{"recipient":"__verify","address":"Seoul"}'::jsonb; $$;

do $$
declare
    v_a uuid := gen_random_uuid();
    v_b uuid := gen_random_uuid();
    v_wh uuid;
    v_w1 uuid; v_ws uuid; v_wz uuid;
    v_created jsonb;
    v_product uuid; v_v1 uuid; v_v2 uuid; v_vs uuid; v_vz uuid; v_vzero uuid;
    v_p2 uuid; v_p2v uuid;        -- unpublished product
    v_boom uuid; v_boomv uuid;    -- product used to force a failing transaction
    v_post uuid; v_post2 uuid;
    v_pay public.payments;
    v_pay1 uuid; v_pay2 uuid; v_pay3 uuid; v_pay4 uuid; v_pay5 uuid; v_pay6 uuid;
    v_r jsonb; v_r2 jsonb;
    v_order public.orders;
    v_n bigint; v_alloc bigint; v_short bigint;
    v_res text;
    v_status text;
    v_count_before bigint;
    v_rev public.payment_reversals;
    v_rows record;
begin
    insert into auth.users (id) values (v_a), (v_b);

    v_wh := public.create_warehouse('__verify v3p4 warehouse');
    v_w1 := public.create_ware(v_wh, '__verify v3p4 W1', null, 'GENERAL', 10);
    v_ws := public.create_ware(v_wh, '__verify v3p4 WS', null, 'GENERAL', 10);
    v_wz := public.create_ware(v_wh, '__verify v3p4 WZ', null, 'GENERAL', 0);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p4 product"}', '[]',
        '[{"price":1000,"skuCode":"__V3P4-1"},{"price":500,"skuCode":"__V3P4-2"},{"price":100,"skuCode":"__V3P4-S"},{"price":300,"skuCode":"__V3P4-Z"},{"price":0,"skuCode":"__V3P4-0"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_v1 := (v_created -> 'variantIds' ->> 0)::uuid;
    v_v2 := (v_created -> 'variantIds' ->> 1)::uuid;   -- no Ware
    v_vs := (v_created -> 'variantIds' ->> 2)::uuid;   -- Ware stock 10
    v_vz := (v_created -> 'variantIds' ->> 3)::uuid;   -- Ware stock 0
    v_vzero := (v_created -> 'variantIds' ->> 4)::uuid; -- price 0
    perform public.link_product_variant_ware(v_v1, v_w1);
    perform public.link_product_variant_ware(v_vs, v_ws);
    perform public.link_product_variant_ware(v_vz, v_wz);

    v_created := public.admin_create_product(
        '{"name":"__verify v3p4 unpublished"}', '[]', '[{"price":700,"skuCode":"__V3P4-U"}]');
    v_p2 := (v_created ->> 'productId')::uuid;
    v_p2v := (v_created -> 'variantIds' ->> 0)::uuid;

    v_created := public.admin_create_product(
        '{"name":"__v3p4 boom product"}', '[]', '[{"price":400,"skuCode":"__V3P4-B"}]');
    v_boom := (v_created ->> 'productId')::uuid;
    v_boomv := (v_created -> 'variantIds' ->> 0)::uuid;

    insert into public.product_posts (title, status) values ('__verify v3p4 post', 'PUBLISHED') returning id into v_post;
    insert into public.product_post_products (product_post_id, product_id) values (v_post, v_product), (v_post, v_boom);
    insert into public.product_posts (title, status) values ('__verify v3p4 draft', 'DRAFT') returning id into v_post2;
    insert into public.product_post_products (product_post_id, product_id) values (v_post2, v_p2);

    -- ============ Stage 1: only a Payment (BR-01, BR-44) ============
    select count(*) into v_count_before from public.orders where client_id = v_a;
    v_pay := public.create_checkout_payment(v_a,
        jsonb_build_array(jsonb_build_object('productId', v_product, 'productVariantId', v_v1,
                                             'quantity', 2, 'price', 1, 'unitPrice', 1)));
    select count(*) into v_n from public.orders where client_id = v_a;
    insert into _results values ('stage 1: only a Payment exists (no Order); amount from the server price, Client price ignored',
        v_pay.status = 'PENDING' and v_pay.order_id is null and v_pay.purpose = 'ORDER_PAYMENT'
        and v_pay.amount = 2000 and v_n = v_count_before, v_pay.amount::text);
    insert into _results values ('stage 1: no stock is held and nothing is allocated',
        pg_temp._stock(v_w1) = '10/0', pg_temp._stock(v_w1));

    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)',
        v_a, v_pay.id, pg_temp._items(v_product, v_v1, 2), pg_temp._addr()));
    insert into _results values ('finalize: a PENDING (unpaid) Payment cannot be finalized', v_res = 'P0001', v_res);

    -- ============ 1. normal purchase (S-01) ============
    perform public.complete_checkout_payment(v_a, v_pay.id, true, '__v3p4_cb_first');
    v_r := public.finalize_order(v_a, v_pay.id, pg_temp._items(v_product, v_v1, 2), pg_temp._addr());
    select * into v_order from public.orders where id = (v_r ->> 'order_id')::uuid;
    select coalesce(sum(a.quantity), 0) into v_alloc
    from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id
    where oi.order_id = v_order.id;
    insert into _results values ('1 normal purchase: Order PENDING, linked to the Payment, total = Payment amount',
        v_r ->> 'outcome' = 'CREATED' and v_order.status = 'PENDING' and v_order.payment_id = v_pay.id
        and v_order.total_amount = 2000 and v_order.order_number like 'ORD-%'
        and (select order_id from public.payments where id = v_pay.id) = v_order.id, v_r ->> 'outcome');
    insert into _results values ('1 normal purchase: allocation 2, shortage 0, reserved 2, current unchanged (BR-43)',
        v_alloc = 2 and pg_temp._stock(v_w1) = '10/2', v_alloc || ' ' || pg_temp._stock(v_w1));
    insert into _results values ('1 normal purchase: OrderItem snapshot uses the server price and names',
        (select unit_price = 1000 and line_total = 2000 and product_name_snapshot = '__verify v3p4 product'
           from public.order_items where order_id = v_order.id), 'checked');
    select status into v_status from public.payments where id = v_pay.id;
    insert into _results values ('1 normal purchase: payments.status stays SUCCEEDED', v_status = 'SUCCEEDED', v_status);

    -- ============ 5. duplicate finalize (S-10, S-11) ============
    v_r2 := public.finalize_order(v_a, v_pay.id, pg_temp._items(v_product, v_v1, 2), pg_temp._addr());
    select count(*) into v_n from public.orders where payment_id = v_pay.id;
    select count(*) into v_short from public.order_item_ware_allocations a
      join public.order_items oi on oi.id = a.order_item_id where oi.order_id = v_order.id;
    insert into _results values ('5 duplicate finalize: the second call returns the same Order (EXISTING)',
        v_r2 ->> 'outcome' = 'EXISTING' and (v_r2 ->> 'order_id')::uuid = v_order.id and v_n = 1,
        v_r2 ->> 'outcome');
    insert into _results values ('5 duplicate finalize: allocation and reserved change once',
        v_short = 1 and pg_temp._stock(v_w1) = '10/2', v_short || ' ' || pg_temp._stock(v_w1));

    v_r2 := public.finalize_order(v_a, v_pay.id, pg_temp._items(v_product, v_v2, 9), '{"a":"b"}'::jsonb);
    insert into _results values ('5 duplicate finalize: a repeat ignores whatever is resubmitted and returns the Order',
        (v_r2 ->> 'order_id')::uuid = v_order.id, v_r2 ->> 'outcome');

    v_pay1 := (public.complete_checkout_payment(v_a, v_pay.id, true, '__v3p4_cb_other')).id;
    insert into _results values ('S-11: a repeated confirm changes nothing (PG reference kept)',
        (select pg_callback_id from public.payments where id = v_pay.id) = '__v3p4_cb_first', 'checked');
    v_res := (public.complete_checkout_payment(v_a, v_pay.id, false, null, 'late failure')).status;
    insert into _results values ('S-11: a failure report cannot overwrite a PG success (CF-15)',
        v_res = 'SUCCEEDED', v_res);

    -- ============ 2. shortage-tolerant purchase (S-02: stock 10, Orders of 6 and 6) ============
    v_pay2 := pg_temp._paid(v_a, pg_temp._items(v_product, v_vs, 6));   -- amount 600
    v_pay3 := pg_temp._paid(v_b, pg_temp._items(v_product, v_vs, 6));
    v_r := public.finalize_order(v_a, v_pay2, pg_temp._items(v_product, v_vs, 6), pg_temp._addr());
    insert into _results values ('2 shortage purchase: Order A x6 allocated 6, stock 10/6',
        v_r ->> 'outcome' = 'CREATED' and pg_temp._stock(v_ws) = '10/6', pg_temp._stock(v_ws));
    v_r2 := public.finalize_order(v_b, v_pay3, pg_temp._items(v_product, v_vs, 6), pg_temp._addr());
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage((v_r2 ->> 'order_id')::uuid);
    insert into _results values ('2 shortage purchase: Order B is created PENDING with allocated 4, shortage 2, stock 10/10, never negative',
        v_r2 ->> 'outcome' = 'CREATED' and v_alloc = 4 and v_short = 2 and pg_temp._stock(v_ws) = '10/10'
        and (select status from public.orders where id = (v_r2 ->> 'order_id')::uuid) = 'PENDING',
        v_alloc || ' ' || v_short || ' ' || pg_temp._stock(v_ws));

    -- S-03: no Ware, and stock 0 - both orderable, full shortage
    v_pay4 := pg_temp._paid(v_a, pg_temp._items(v_product, v_v2, 3));
    v_r := public.finalize_order(v_a, v_pay4, pg_temp._items(v_product, v_v2, 3), pg_temp._addr());
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage((v_r ->> 'order_id')::uuid);
    insert into _results values ('S-03: a Ware-less Variant is orderable; allocated 0, shortage = quantity',
        v_r ->> 'outcome' = 'CREATED' and v_alloc = 0 and v_short = 3, v_alloc || ' ' || v_short);

    v_pay5 := pg_temp._paid(v_a, pg_temp._items(v_product, v_vz, 4));
    v_r := public.finalize_order(v_a, v_pay5, pg_temp._items(v_product, v_vz, 4), pg_temp._addr());
    select allocated_quantity, shortage_quantity into v_alloc, v_short
    from public.get_order_shortage((v_r ->> 'order_id')::uuid);
    insert into _results values ('S-03: a stock-0 Variant (not sold out) is orderable; allocated 0, shortage 4, stock stays 0/0',
        v_r ->> 'outcome' = 'CREATED' and v_alloc = 0 and v_short = 4 and pg_temp._stock(v_wz) = '0/0',
        v_alloc || ' ' || v_short);

    -- ============ 3. SOLD_OUT (S-04 before the PG, S-07 after PG success) ============
    perform public.admin_set_variant_sold_out(v_v1, true);
    select count(*) into v_count_before from public.payments where client_id = v_a;
    v_res := pg_temp._try(format('select public.create_checkout_payment(%L, %L)', v_a, pg_temp._items(v_product, v_v1, 1)));
    select count(*) into v_n from public.payments where client_id = v_a;
    insert into _results values ('3 SOLD_OUT (S-04): refused before the PG, no Payment and no Order',
        v_res = 'P0001' and v_n = v_count_before, v_res);
    perform public.admin_set_variant_sold_out(v_v1, false);

    v_pay6 := pg_temp._paid(v_a, pg_temp._items(v_product, v_v1, 3));   -- amount 3000
    perform public.admin_set_variant_sold_out(v_v1, true);
    v_r := public.finalize_order(v_a, v_pay6, pg_temp._items(v_product, v_v1, 3), pg_temp._addr());
    select * into v_rev from public.payment_reversals where id = (v_r ->> 'reversal_id')::uuid;
    select count(*) into v_n from public.orders where payment_id = v_pay6;
    insert into _results values ('3 SOLD_OUT (S-07): PG success then sold out -> no Order, one full FINALIZE_FAILURE reversal',
        v_r ->> 'outcome' = 'REJECTED' and v_r ->> 'reason' = 'NOT_SELLABLE' and v_n = 0
        and v_rev.reason_type = 'FINALIZE_FAILURE' and v_rev.amount = 3000 and v_rev.status = 'PENDING'
        and v_rev.order_id is null and v_rev.payment_id = v_pay6, v_r ->> 'reason');
    select status into v_status from public.payments where id = v_pay6;
    insert into _results values ('3 SOLD_OUT (S-07): payments.status stays SUCCEEDED, no stock touched',
        v_status = 'SUCCEEDED' and pg_temp._stock(v_w1) = '10/2', v_status || ' ' || pg_temp._stock(v_w1));

    v_r2 := public.finalize_order(v_a, v_pay6, pg_temp._items(v_product, v_v1, 3), pg_temp._addr());
    select count(*) into v_n from public.payment_reversals where payment_id = v_pay6;
    insert into _results values ('3 SOLD_OUT: a repeated finalize returns ALREADY_CLOSED with the same reversal, still one reversal',
        v_r2 ->> 'reason' = 'ALREADY_CLOSED' and v_r2 ->> 'reversal_id' = v_r ->> 'reversal_id' and v_n = 1, v_n::text);

    perform public.admin_set_variant_sold_out(v_v1, false);
    v_r2 := public.finalize_order(v_a, v_pay6, pg_temp._items(v_product, v_v1, 3), pg_temp._addr());
    insert into _results values ('3 SOLD_OUT: after the item is sellable again a closed Payment is NOT resurrected',
        v_r2 ->> 'outcome' = 'REJECTED' and (select count(*) from public.orders where payment_id = v_pay6) = 0, v_r2 ->> 'outcome');

    -- other not-sellable reasons
    v_res := pg_temp._try(format('select public.create_checkout_payment(%L, %L)', v_a, pg_temp._items(v_p2, v_p2v, 1)));
    insert into _results values ('S-04: a Product of an unpublished ProductPost is refused (NOT_PUBLISHED)', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.create_checkout_payment(%L, %L)', v_a, pg_temp._items(v_product, gen_random_uuid(), 1)));
    insert into _results values ('S-04: an unknown Variant is refused', v_res = 'P0001', v_res);
    update public.product_variants set is_active = false where id = v_vs;
    v_res := pg_temp._try(format('select public.create_checkout_payment(%L, %L)', v_a, pg_temp._items(v_product, v_vs, 1)));
    insert into _results values ('S-04: a sale-disabled Variant is refused', v_res = 'P0001', v_res);
    update public.product_variants set is_active = true where id = v_vs;
    v_res := pg_temp._try(format('select public.create_checkout_payment(%L, %L)', v_a, pg_temp._items(v_product, v_vzero, 1)));
    insert into _results values ('DN-41: a zero-amount checkout is not created (Payment amount must be > 0)', v_res = 'P0001', v_res);

    -- ============ 4. price mismatch (S-06) ============
    v_pay6 := pg_temp._paid(v_a, pg_temp._items(v_product, v_vs, 2));   -- 200
    update public.product_variants set price = 150 where id = v_vs;      -- Admin changes the price
    v_r := public.finalize_order(v_a, v_pay6, pg_temp._items(v_product, v_vs, 2), pg_temp._addr());
    select * into v_rev from public.payment_reversals where id = (v_r ->> 'reversal_id')::uuid;
    insert into _results values ('4 price mismatch (S-06): no Order and one FINALIZE_FAILURE reversal for the full amount',
        v_r ->> 'outcome' = 'REJECTED' and v_r ->> 'reason' = 'PRICE_MISMATCH'
        and (select count(*) from public.orders where payment_id = v_pay6) = 0
        and v_rev.reason_type = 'FINALIZE_FAILURE' and v_rev.amount = 200
        and (select amount from public.payments where id = v_pay6) = 200,
        v_r ->> 'reason' || ' ' || v_rev.amount);
    update public.product_variants set price = 100 where id = v_vs;

    -- a tampered resubmission (other quantity) is also a mismatch
    v_pay6 := pg_temp._paid(v_a, pg_temp._items(v_product, v_vs, 2));
    v_r := public.finalize_order(v_a, v_pay6, pg_temp._items(v_product, v_vs, 5), pg_temp._addr());
    insert into _results values ('4 price mismatch: resubmitted items whose total differs from the Payment are rejected + reversed',
        v_r ->> 'reason' = 'PRICE_MISMATCH', v_r ->> 'reason');

    -- ============ malformed requests raise and keep the Payment finalizable (DN-39) ============
    v_pay6 := pg_temp._paid(v_a, pg_temp._items(v_product, v_vs, 1));   -- 100
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_a, v_pay6, '[]'::jsonb, pg_temp._addr()));
    insert into _results values ('malformed: empty items raise', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_a, v_pay6,
        (pg_temp._items(v_product, v_vs, 1) || pg_temp._items(v_product, v_vs, 1)), pg_temp._addr()));
    insert into _results values ('malformed: a duplicated Variant raises', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_a, v_pay6, pg_temp._items(v_product, v_vs, 0), pg_temp._addr()));
    insert into _results values ('malformed: quantity 0 raises', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_a, v_pay6, '[{"productId":"x"}]'::jsonb, pg_temp._addr()));
    insert into _results values ('malformed: a bad item raises', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_a, v_pay6, pg_temp._items(v_product, v_vs, 1), '{}'::jsonb));
    insert into _results values ('malformed: an empty shipping address raises', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_b, v_pay6, pg_temp._items(v_product, v_vs, 1), pg_temp._addr()));
    insert into _results values ('another client''s Payment cannot be finalized (P0002)', v_res = 'P0002', v_res);
    select count(*) into v_n from public.payment_reversals where payment_id = v_pay6;
    insert into _results values ('malformed: no reversal was created and the Payment is still SUCCEEDED and finalizable',
        v_n = 0 and (select status from public.payments where id = v_pay6) = 'SUCCEEDED'
        and (public.finalize_order(v_a, v_pay6, pg_temp._items(v_product, v_vs, 1), pg_temp._addr()) ->> 'outcome') = 'CREATED',
        v_n::text);

    -- a FAILED PG payment cannot be finalized
    v_pay := public.create_checkout_payment(v_a, pg_temp._items(v_product, v_vs, 1));
    perform public.complete_checkout_payment(v_a, v_pay.id, false, null, 'PG refused');
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_a, v_pay.id, pg_temp._items(v_product, v_vs, 1), pg_temp._addr()));
    insert into _results values ('S-08: a FAILED PG payment cannot be finalized; no Order was created', v_res = 'P0001'
        and (select count(*) from public.orders where payment_id = v_pay.id) = 0, v_res);
    v_res := (public.complete_checkout_payment(v_a, v_pay.id, true, '__v3p4_cb_late')).status;
    insert into _results values ('S-08: a FAILED Payment stays FAILED (no late success overwrites it)', v_res = 'FAILED', v_res);
    v_pay := public.create_checkout_payment(v_a, pg_temp._items(v_product, v_vs, 1));
    v_res := pg_temp._try(format('select public.complete_checkout_payment(%L, %L, true)', v_a, v_pay.id));
    insert into _results values ('confirm: a success without a PG reference is rejected; the Payment stays PENDING',
        v_res = 'P0001' and (select status from public.payments where id = v_pay.id) = 'PENDING', v_res);

    -- ============ a failing finalize transaction loses nothing (DN-39) ============
    create function public.__v3p4_boom() returns trigger language plpgsql as $f$
    begin
        if new.product_name_snapshot = '__v3p4 boom product' then
            raise exception 'simulated database failure';
        end if;
        return new;
    end;
    $f$;
    create trigger __v3p4_boom before insert on public.order_items
        for each row execute function public.__v3p4_boom();

    v_pay1 := pg_temp._paid(v_a, pg_temp._items(v_boom, v_boomv, 1));
    v_res := pg_temp._try(format('select public.finalize_order(%L, %L, %L, %L)', v_a, v_pay1, pg_temp._items(v_boom, v_boomv, 1), pg_temp._addr()));
    select count(*) into v_n from public.orders where payment_id = v_pay1;
    select count(*) into v_short from public.payment_reversals where payment_id = v_pay1;
    insert into _results values ('failing transaction: the whole finalize rolled back (no Order, no reversal, no partial allocation)',
        v_res = 'P0001' and v_n = 0 and v_short = 0
        and (select order_id from public.payments where id = v_pay1) is null, v_res);
    insert into _results values ('failing transaction: the Payment is still SUCCEEDED (not lost, not failed)',
        (select status from public.payments where id = v_pay1) = 'SUCCEEDED', 'checked');

    -- ============ orphan rule (S-26, IN-11) ============
    select count(*) into v_n from public.reverse_orphan_payments(interval '30 minutes');
    insert into _results values ('orphan: a fresh Payment inside the window is not reversed',
        v_n = 0 and (select count(*) from public.payment_reversals where payment_id = v_pay1) = 0, v_n::text);

    update public.payments set completed_at = now() - interval '2 hours' where id = v_pay1;
    select * into v_rows from public.reverse_orphan_payments(interval '30 minutes') where payment_id = v_pay1;
    select * into v_rev from public.payment_reversals where payment_id = v_pay1;
    insert into _results values ('orphan: after the window a full ORPHAN_PAYMENT reversal is created, no Order',
        v_rows.reversal_id = v_rev.id and v_rev.reason_type = 'ORPHAN_PAYMENT' and v_rev.amount = 400
        and v_rev.order_id is null and v_rev.status = 'PENDING', v_rev.reason_type);
    select count(*) into v_n from public.reverse_orphan_payments(interval '30 minutes') where payment_id = v_pay1;
    insert into _results values ('orphan: repeating the job creates nothing more (idempotent)',
        v_n = 0 and (select count(*) from public.payment_reversals where payment_id = v_pay1) = 1, v_n::text);

    -- retry finalize with the failure removed: it must not resurrect the orphan
    drop trigger __v3p4_boom on public.order_items;
    v_r := public.finalize_order(v_a, v_pay1, pg_temp._items(v_boom, v_boomv, 1), pg_temp._addr());
    insert into _results values ('orphan: a late finalize cannot resurrect a reversed orphan (ALREADY_CLOSED, no Order)',
        v_r ->> 'reason' = 'ALREADY_CLOSED' and (select count(*) from public.orders where payment_id = v_pay1) = 0, v_r ->> 'reason');

    -- retry after a failed transaction, inside the window, succeeds
    v_pay2 := pg_temp._paid(v_a, pg_temp._items(v_boom, v_boomv, 1));
    v_r := public.finalize_order(v_a, v_pay2, pg_temp._items(v_boom, v_boomv, 1), pg_temp._addr());
    insert into _results values ('failing transaction: the retry after the failure is gone creates the Order',
        v_r ->> 'outcome' = 'CREATED', v_r ->> 'outcome');

    -- the job never touches Payments that are not orphans
    update public.payments set completed_at = now() - interval '3 hours'
     where client_id in (v_a, v_b) and status = 'SUCCEEDED';
    select count(*) into v_n from public.reverse_orphan_payments(interval '30 minutes')
     where payment_id in (select id from public.payments where order_id is not null);
    insert into _results values ('orphan: Payments that have an Order are never reversed',
        v_n = 0, v_n::text);
    select count(*) into v_n from public.payments p
     where p.client_id in (v_a, v_b) and p.order_id is not null
       and exists (select 1 from public.payment_reversals r where r.payment_id = p.id);
    insert into _results values ('no Payment has both an Order and a closing reversal', v_n = 0, v_n::text);

    -- ============ closing-reversal exclusivity (no duplicate money movement) ============
    select payment_id into v_pay3 from public.orders where id = (v_r ->> 'order_id')::uuid;
    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 400, ''FINALIZE_FAILURE'', ''__v3p4_x1'')', v_pay3));
    insert into _results values ('exclusivity: a Payment that has an Order cannot get a FINALIZE_FAILURE reversal', v_res = '23514', v_res);
    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 400, ''ORPHAN_PAYMENT'', ''__v3p4_x2'')', v_pay3));
    insert into _results values ('exclusivity: ... nor an ORPHAN_PAYMENT reversal', v_res = '23514', v_res);
    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 400, ''ORPHAN_PAYMENT'', ''__v3p4_x3'')', v_pay1));
    insert into _results values ('exclusivity: a Payment already closed by one reversal cannot get a second closing reversal',
        v_res in ('23514', 'P0001') and (select count(*) from public.payment_reversals where payment_id = v_pay1) = 1, v_res);
    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''MANUAL_RECONCILIATION'', ''__v3p4_x4'')', v_pay3));
    insert into _results values ('exclusivity: ordinary reversals (cancel/refund/manual) on an Order''s Payment stay possible',
        v_res = 'OK', v_res);

    -- ============ invariants and grants ============
    select count(*) into v_n from public.orders o join public.payments p on p.id = o.payment_id
     where p.status <> 'SUCCEEDED' and p.client_id in (v_a, v_b);
    insert into _results values ('no v3 Order exists without a SUCCEEDED Payment', v_n = 0, v_n::text);

    select count(*) into v_n from public.wares w
     where w.id in (v_w1, v_ws, v_wz)
       and (w.reserved_stock > w.current_stock or w.current_stock < 0
            or w.reserved_stock <> coalesce((
                select sum(a.quantity) from public.order_item_ware_allocations a
                join public.order_items oi on oi.id = a.order_item_id
                join public.orders o on o.id = oi.order_id
                where a.ware_id = w.id and o.status = 'PENDING'), 0));
    insert into _results values ('consistency: reserved_stock = allocations of PENDING Orders on every Ware, never over-reserved',
        v_n = 0, v_n::text);

    insert into _results values ('grants: Phase 4 functions are service_role only',
        (select bool_and(
            has_function_privilege('service_role', f, 'execute')
            and not has_function_privilege('anon', f, 'execute')
            and not has_function_privilege('authenticated', f, 'execute'))
         from unnest(array[
            'public.create_checkout_payment(uuid, jsonb)',
            'public.complete_checkout_payment(uuid, uuid, boolean, text, text)',
            'public.finalize_order(uuid, uuid, jsonb, jsonb)',
            'public.reverse_orphan_payments(interval, integer)',
            'public.v3_resolve_checkout_items(jsonb)'
         ]::regprocedure[]) as f),
        'checked');

    insert into _results values ('v2 regression: the v2 Order and payment functions still exist unchanged',
        to_regprocedure('public.create_order_from_cart(jsonb, text)') is not null
        and to_regprocedure('public.create_payment(uuid, text, uuid, numeric)') is not null
        and to_regprocedure('public.complete_payment(uuid, uuid, boolean, text, text)') is not null, 'checked');

    insert into _fx values ('payment', v_pay3), ('client', v_a);
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
    v_payment uuid := (select id from _fx where key = 'payment');
begin
    begin
        perform public.create_checkout_payment(v_client, '[]'::jsonb);
        insert into _results values ('rls: authenticated cannot create a checkout Payment', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot create a checkout Payment', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.finalize_order(v_client, v_payment, '[]'::jsonb, '{}'::jsonb);
        insert into _results values ('rls: authenticated cannot finalize', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot finalize', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.reverse_orphan_payments();
        insert into _results values ('rls: authenticated cannot run the orphan job', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot run the orphan job', sqlstate = '42501', sqlerrm);
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
        raise exception 'v3 phase 4 finalize check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 4 finalize check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
