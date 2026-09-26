-- ============================================================
-- Cutover rehearsal: a realistic v2 production-like dataset
--
-- Runs on the v2 schema (migrations up to 20260925150000) of the LOCAL database
-- only. It uses the real v2 RPCs (with the JWT claim of each test user) so the
-- data has exactly the shape v2 produces: net-remainder stock, PAID Orders with
-- succeeded payments, an unpaid PENDING Order, a manually marked PAID Order, a
-- cancelled Order, a delivered Order with an approved and restocked Refund, an
-- open Refund request, Point top-ups, and payments in every status.
-- ============================================================
\set ON_ERROR_STOP on
begin;

create temp table _seed (k text primary key, id uuid);

do $$
declare
    v_alice uuid := '00000000-0000-4000-8000-0000000000a1';
    v_bob   uuid := '00000000-0000-4000-8000-0000000000b2';
    v_wh uuid; v_w1 uuid; v_w2 uuid;
    v_created jsonb; v_prod uuid; v_va uuid; v_vb uuid; v_vc uuid;
    v_o uuid; v_pay public.payments; v_r uuid; v_ri uuid; v_item uuid;
    v_addr jsonb := '{"recipientName":"rehearsal","phone":"010","zonecode":"12345","address":"Seoul","addressDetail":null}'::jsonb;
begin
    insert into auth.users (id, email) values (v_alice, 'rehearsal-alice@example.test'), (v_bob, 'rehearsal-bob@example.test');

    v_wh := public.create_warehouse('rehearsal warehouse');
    v_w1 := public.create_ware(v_wh, 'rehearsal W1', null, 'GENERAL', 50);
    v_w2 := public.create_ware(v_wh, 'rehearsal W2', null, 'GENERAL', 30);
    v_created := public.admin_create_product(
        '{"name":"rehearsal product"}', '[]',
        '[{"price":1000,"skuCode":"REH-A"},{"price":500,"skuCode":"REH-B"},{"price":300,"skuCode":"REH-C"}]');
    v_prod := (v_created ->> 'productId')::uuid;
    v_va := (v_created -> 'variantIds' ->> 0)::uuid;
    v_vb := (v_created -> 'variantIds' ->> 1)::uuid;
    v_vc := (v_created -> 'variantIds' ->> 2)::uuid;
    perform public.link_product_variant_ware(v_va, v_w1);
    perform public.link_product_variant_ware(v_vb, v_w2);
    insert into public.product_posts (title, status) values ('rehearsal post', 'PUBLISHED');
    insert into public.product_post_products (product_post_id, product_id)
    select id, v_prod from public.product_posts where title = 'rehearsal post';

    -- ---------- alice: o1 paid, shipped, delivered, refunded ----------
    perform set_config('request.jwt.claim.sub', v_alice::text, true);
    perform public.add_cart_item(v_prod, v_va, 2);
    perform public.add_cart_item(v_prod, v_vb, 1);
    v_o := public.create_order_from_cart(v_addr, null);
    insert into _seed values ('o1', v_o);
    v_pay := public.create_payment(v_alice, 'ORDER_PAYMENT', v_o, null);
    perform public.complete_payment(v_alice, v_pay.id, true, 'reh-cb-o1');
    perform public.admin_transition_order_status(v_o, 'PROCESSING');
    perform public.admin_transition_order_status(v_o, 'SHIPPED');
    perform public.admin_transition_order_status(v_o, 'DELIVERED');
    select id into v_item from public.order_items where order_id = v_o and product_variant_id = v_va;
    v_r := public.request_refund(v_o, jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 1)), 'rehearsal refund');
    perform public.admin_transition_refund_status(v_r, 'APPROVED');
    select id into v_ri from public.refund_items where refund_request_id = v_r;
    perform public.admin_restock_refund_item(v_r, v_ri, v_w1, 1);
    insert into _seed values ('r1', v_r);

    -- ---------- alice: o2 unpaid PENDING (in-flight payment stays PENDING) ----------
    perform public.add_cart_item(v_prod, v_va, 3);
    v_o := public.create_order_from_cart(v_addr, null);
    insert into _seed values ('o2_unpaid', v_o);
    v_pay := public.create_payment(v_alice, 'ORDER_PAYMENT', v_o, null);      -- stays PENDING (never completed)

    -- ---------- alice: o5 cancelled ----------
    perform public.add_cart_item(v_prod, v_vb, 2);
    v_o := public.create_order_from_cart(v_addr, null);
    insert into _seed values ('o5_cancelled', v_o);
    perform public.cancel_order(v_o);

    -- ---------- alice: o6 paid, PROCESSING, with an open Refund request ----------
    perform public.add_cart_item(v_prod, v_va, 1);
    v_o := public.create_order_from_cart(v_addr, null);
    insert into _seed values ('o6_processing', v_o);
    v_pay := public.create_payment(v_alice, 'ORDER_PAYMENT', v_o, null);
    perform public.complete_payment(v_alice, v_pay.id, true, 'reh-cb-o6');
    perform public.admin_transition_order_status(v_o, 'PROCESSING');
    select id into v_item from public.order_items where order_id = v_o;
    v_r := public.request_refund(v_o, jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 1)), 'open request');
    insert into _seed values ('r6_open', v_r);

    -- ---------- alice: Point top-up ----------
    v_pay := public.create_payment(v_alice, 'POINT_TOPUP', null, 5000);
    perform public.complete_payment(v_alice, v_pay.id, true, 'reh-cb-point');

    -- ---------- bob: o3 paid (PAID), o4 manually PAID without payment, a failed payment ----------
    perform set_config('request.jwt.claim.sub', v_bob::text, true);
    perform public.add_cart_item(v_prod, v_vb, 2);
    v_o := public.create_order_from_cart(v_addr, null);
    insert into _seed values ('o3_paid', v_o);
    v_pay := public.create_payment(v_bob, 'ORDER_PAYMENT', v_o, null);
    perform public.complete_payment(v_bob, v_pay.id, true, 'reh-cb-o3');

    perform public.add_cart_item(v_prod, v_va, 1);
    v_o := public.create_order_from_cart(v_addr, null);
    insert into _seed values ('o4_manual_paid', v_o);
    perform public.admin_transition_order_status(v_o, 'PAID');                 -- no payment behind it

    perform public.add_cart_item(v_prod, v_vc, 1);                             -- Ware-less Variant: v2 refuses it
    perform set_config('request.jwt.claim.sub', '', true);

    insert into _seed values ('alice', v_alice), ('bob', v_bob), ('w1', v_w1), ('w2', v_w2);
end;
$$;

-- fixed marker table so later steps can find the seeded rows (dropped by the rehearsal reset)
create table public._rehearsal_seed as select * from _seed;

commit;
