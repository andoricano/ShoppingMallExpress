-- ============================================================
-- Cutover rehearsal: the LEGACY (seeded v2) data used through the v3 paths
-- after the cutover scripts. Read from the seed markers in public._rehearsal_seed.
-- One transaction, ROLLED BACK.
-- ============================================================
\set ON_ERROR_STOP on
begin;

create temp table _results (scenario text, ok boolean, detail text) on commit drop;
create function pg_temp._try(p_sql text) returns text language plpgsql as $$
begin execute p_sql; return 'OK'; exception when others then return sqlstate; end; $$;
create function pg_temp._s(p_k text) returns uuid language sql as $$ select id from public._rehearsal_seed where k = p_k; $$;
create function pg_temp._stock(p_k text) returns text language sql as $$
    select current_stock || '/' || reserved_stock from public.wares where id = pg_temp._s(p_k); $$;

do $$
declare
    v_admin uuid := gen_random_uuid();
    v_alice uuid := pg_temp._s('alice');
    v_bob uuid := pg_temp._s('bob');
    v_o1 uuid := pg_temp._s('o1');
    v_o3 uuid := pg_temp._s('o3_paid');
    v_o5 uuid := pg_temp._s('o5_cancelled');
    v_o6 uuid := pg_temp._s('o6_processing');
    v_o2 uuid := pg_temp._s('o2_unpaid');
    v_r6 uuid := pg_temp._s('r6_open');
    v_before text; v_res text; v_d jsonb; v_r jsonb; v_n bigint; v_item uuid; v_new uuid; v_rev public.payment_reversals;
    v_pay uuid;
begin
    insert into auth.users (id) values (v_admin);

    -- resolved unpaid legacy Orders are cancelled, with an internal note
    insert into _results values ('the two unpaid legacy Orders were cancelled by the resolve script and recorded',
        (select count(*) from public.order_cancellations where reason like 'v3 cutover:%') = 2
        and (select status from public.orders where id = v_o2) = 'CANCELLED', 'checked');

    -- the converted (formerly PAID) Order goes through the v3 lifecycle
    v_before := pg_temp._stock('w2');
    v_r := public.admin_advance_order(v_o3, 'PROCESSING');
    insert into _results values ('legacy PAID -> PENDING Order enters PROCESSING: its converted reservation (2) is consumed',
        v_r ->> 'outcome' = 'TRANSITIONED'
        and (select current_stock from public.wares where id = pg_temp._s('w2')) = split_part(v_before, '/', 1)::bigint - 2
        and (select reserved_stock from public.wares where id = pg_temp._s('w2')) = split_part(v_before, '/', 2)::bigint - 2, pg_temp._stock('w2'));

    -- legacy PROCESSING Order: its open v2 Refund request is decided the v3 way
    v_d := public.admin_decide_refund(v_r6, 'APPROVED', v_admin);
    select * into v_rev from public.payment_reversals where id = (v_d ->> 'reversal_id')::uuid;
    insert into _results values ('the open v2 Refund request is approved in v3 with its REFUND reversal (1000, PENDING)',
        v_d ->> 'outcome' = 'APPROVED' and v_rev.amount = 1000 and v_rev.status = 'PENDING' and v_rev.refund_request_id = v_r6, v_d ->> 'outcome');
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_alice, v_o6,
        jsonb_build_array(jsonb_build_object('orderItemId', (select id from public.order_items where order_id = v_o6), 'quantity', 1))));
    insert into _results values ('cumulative limit across the legacy request: the item (1) is fully requested, another request is refused', v_res = 'P0001', v_res);

    -- legacy DELIVERED Order: 1 of 2 already refunded (v2, APPROVED, restocked)
    select id into v_item from public.order_items where order_id = v_o1 and quantity = 2;
    v_res := pg_temp._try(format('select public.create_refund_request(%L, %L, %L)', v_alice, v_o1,
        jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 2))));
    insert into _results values ('legacy DELIVERED Order: 2 more would exceed the ordered quantity (1 already refunded in v2): refused', v_res = 'P0001', v_res);
    v_new := public.create_refund_request(v_alice, v_o1, jsonb_build_array(jsonb_build_object('orderItemId', v_item, 'quantity', 1)));
    v_d := public.admin_decide_refund(v_new, 'APPROVED', v_admin);
    insert into _results values ('legacy DELIVERED Order: the remaining 1 is refundable; approval creates one reversal within the payment amount',
        v_d ->> 'outcome' = 'APPROVED'
        and (select coalesce(sum(amount), 0) from public.payment_reversals
              where payment_id = (select payment_id from public.orders where id = v_o1)) = 1000, v_d ->> 'outcome');
    insert into _results values ('the historical v2 APPROVED Refund stays as it was (no reversal was invented)',
        (select status from public.refund_requests where id = pg_temp._s('r1')) = 'APPROVED'
        and not exists (select 1 from public.payment_reversals where refund_request_id = pg_temp._s('r1')), 'checked');

    -- legacy CANCELLED Order: an idempotent cancel, no reversal (it had no payment)
    v_r := public.cancel_pending_order(v_o5, v_alice, 'CLIENT');
    insert into _results values ('legacy CANCELLED Order: cancel is idempotent (ALREADY_CANCELLED, no reversal)',
        v_r ->> 'outcome' = 'ALREADY_CANCELLED' and v_r -> 'reversal_id' = 'null'::jsonb, v_r ->> 'outcome');

    -- the orphan job and the in-flight legacy payment
    select count(*) into v_n from public.reverse_orphan_payments(interval '0 seconds');
    insert into _results values ('the orphan job touches no legacy Payment (they all have an Order or never succeeded)', v_n = 0, v_n::text);
    select p.id into v_pay from public.payments p where p.status = 'PENDING' and p.order_id is not null limit 1;
    v_res := pg_temp._try(format('select public.complete_checkout_payment(%L, %L, true, ''x'')', v_alice, v_pay));
    insert into _results values ('the in-flight legacy payment cannot be completed through the v3 path (it stays PENDING)',
        v_res = 'P0001' and (select status from public.payments where id = v_pay) = 'PENDING', v_res);

    -- Point is retained
    v_n := (select balance from public.point_balances where client_id = v_alice);
    insert into _results values ('Point balance and ledger are intact (5000)', v_n = 5000, v_n::text);

    -- stock invariants over the whole rehearsed database
    select count(*) into v_n from public.wares w
    left join (select a.ware_id, sum(a.quantity)::bigint q from public.order_item_ware_allocations a
               join public.order_items oi on oi.id = a.order_item_id join public.orders o on o.id = oi.order_id
               where o.status = 'PENDING' group by a.ware_id) h on h.ware_id = w.id
    where w.reserved_stock <> coalesce(h.q, 0) or w.reserved_stock > w.current_stock or w.current_stock < 0;
    insert into _results values ('stock: reserved = allocations of PENDING Orders on every Ware after the legacy flows', v_n = 0, v_n::text);
end;
$$;

select scenario, ok, detail from _results;

do $$
declare v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;
    if cardinality(v_failures) > 0 then raise exception 'legacy-through-v3 check FAILED: %', v_failures; end if;
    raise notice 'legacy-through-v3 check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
