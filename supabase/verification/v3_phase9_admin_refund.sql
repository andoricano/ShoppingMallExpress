-- ============================================================
-- Local verification: Mall v3 Phase 9 seller-initiated Refund (DN-46)
-- (migration 20260927100000_v3_phase9_admin_refund_request.sql)
--
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/verification/v3_phase9_admin_refund.sql
--
-- One transaction, ROLLED BACK. Covers: an Admin creates the Refund for the
-- Order's Client (after PROCESSING, where Cancel is refused), the normal
-- decision path with its reversal, all Refund invariants, grants.
-- ============================================================

\set ON_ERROR_STOP on

begin;

create temp table _results (scenario text, ok boolean, detail text) on commit drop;
create temp table _fx (key text primary key, id uuid) on commit drop;
grant select on _results, _fx to anon, authenticated;
grant insert on _results to anon, authenticated;

create function pg_temp._try(p_sql text) returns text language plpgsql as $$
begin execute p_sql; return 'OK'; exception when others then return sqlstate; end; $$;

create sequence pg_temp._cb;

do $$
declare
    v_client uuid := gen_random_uuid();
    v_admin uuid := gen_random_uuid();
    v_other uuid := gen_random_uuid();
    v_wh uuid; v_w uuid;
    v_created jsonb; v_product uuid; v_variant uuid; v_post uuid;
    v_items jsonb; v_pay public.payments; v_order uuid; v_item uuid;
    v_r uuid; v_r2 uuid; v_d jsonb; v_res text; v_rr public.refund_requests; v_rev public.payment_reversals;
    v_stock text;
begin
    insert into auth.users (id) values (v_client), (v_admin), (v_other);
    v_wh := public.create_warehouse('__verify v3p9 warehouse');
    v_w := public.create_ware(v_wh, '__verify v3p9 W', null, 'GENERAL', 20);
    v_created := public.admin_create_product('{"name":"__verify v3p9 product"}', '[]', '[{"price":1000,"skuCode":"__V3P9-1"}]');
    v_product := (v_created ->> 'productId')::uuid;
    v_variant := (v_created -> 'variantIds' ->> 0)::uuid;
    perform public.link_product_variant_ware(v_variant, v_w);
    insert into public.product_posts (title, status) values ('__verify v3p9 post', 'PUBLISHED') returning id into v_post;
    insert into public.product_post_products (product_post_id, product_id) values (v_post, v_product);

    v_items := jsonb_build_array(jsonb_build_object('productId', v_product, 'productVariantId', v_variant, 'quantity', 5));
    v_pay := public.create_checkout_payment(v_client, v_items);
    perform public.complete_checkout_payment(v_client, v_pay.id, true, '__v3p9_cb_1');
    v_order := (public.finalize_order(v_client, v_pay.id, v_items, '{"recipient":"x","address":"y"}'::jsonb) ->> 'order_id')::uuid;
    select id into v_item from public.order_items where order_id = v_order;

    -- PENDING: refused (Cancel exists for it)
    v_res := pg_temp._try(format('select public.admin_create_refund_request(%L, %L, null, %L)', v_order,
        jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 1)), v_admin));
    insert into _results values ('a PENDING Order cannot get a seller-initiated Refund (Cancel is used)', v_res = 'P0001', v_res);

    perform public.admin_advance_order(v_order, 'PROCESSING');
    select current_stock || '/' || reserved_stock into v_stock from public.wares where id = v_w;

    v_res := pg_temp._try(format('select public.cancel_pending_order(%L, %L, ''ADMIN'')', v_order, v_admin));
    insert into _results values ('DN-46: after PROCESSING, Cancel is still refused (BR-35)', v_res = 'P0001', v_res);

    v_r := public.admin_create_refund_request(v_order,
        jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 3)), 'seller could not ship', v_admin);
    select * into v_rr from public.refund_requests where id = v_r;
    insert into _results values ('the Admin creates the Refund for the Order''s Client: REQUESTED, initiated by ADMIN, snapshot priced (3 x 1000)',
        v_rr.status = 'REQUESTED' and v_rr.initiated_by = 'ADMIN' and v_rr.client_id = v_client
        and v_rr.requested_amount = 3000 and v_rr.reason = 'seller could not ship', v_rr.initiated_by);
    insert into _results values ('a Client-created request stays CLIENT-initiated',
        (select initiated_by from public.refund_requests where id = public.create_refund_request(v_client, v_order,
            jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 1)))) = 'CLIENT', 'checked');

    v_res := pg_temp._try(format('select public.admin_create_refund_request(%L, %L, null, %L)', v_order,
        jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 2)), v_admin));
    insert into _results values ('BR-38: the cumulative limit holds for Admin requests too (3 + 1 + 2 > 5)', v_res = 'P0001', v_res);

    v_d := public.admin_decide_refund(v_r, 'APPROVED', v_admin);
    select * into v_rev from public.payment_reversals where id = (v_d ->> 'reversal_id')::uuid;
    insert into _results values ('the normal decision path: approval + one REFUND reversal (3000, PENDING, actor recorded)',
        v_d ->> 'outcome' = 'APPROVED' and v_rev.amount = 3000 and v_rev.status = 'PENDING' and v_rev.requested_by = v_admin, v_d ->> 'outcome');
    insert into _results values ('BR-40/41: approval changes no stock and not the Order status',
        (select current_stock || '/' || reserved_stock from public.wares where id = v_w) = v_stock
        and (select status from public.orders where id = v_order) = 'PROCESSING', v_stock);
    insert into _results values ('the original Payment stays SUCCEEDED (BR-29)',
        (select status from public.payments where id = v_pay.id) = 'SUCCEEDED', 'checked');

    v_res := pg_temp._try(format('select public.admin_create_refund_request(%L, %L, null, %L)', gen_random_uuid(),
        jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 1)), v_admin));
    insert into _results values ('an unknown Order -> P0002', v_res = 'P0002', v_res);
    v_res := pg_temp._try(format('select public.admin_create_refund_request(%L, %L, null, null)', v_order,
        jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 1))));
    insert into _results values ('a missing actor is rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('insert into public.refund_requests (order_id, client_id, initiated_by) values (%L, %L, ''SELLER'')', v_order, v_client));
    insert into _results values ('initiated_by accepts only CLIENT / ADMIN', v_res = '23514', v_res);
    insert into _results values ('grants: service_role only',
        has_function_privilege('service_role', 'public.admin_create_refund_request(uuid, jsonb, text, uuid)', 'execute')
        and not has_function_privilege('anon', 'public.admin_create_refund_request(uuid, jsonb, text, uuid)', 'execute')
        and not has_function_privilege('authenticated', 'public.admin_create_refund_request(uuid, jsonb, text, uuid)', 'execute'), 'checked');
end;
$$;

select scenario, ok, detail from _results;

do $$
declare v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;
    if cardinality(v_failures) > 0 then
        raise exception 'v3 phase 9 admin refund check FAILED: %', v_failures;
    end if;
    raise notice 'v3 phase 9 admin refund check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
