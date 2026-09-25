-- ============================================================
-- Local verification: payments / point_balances / point_ledger
-- (migration 20260925140000_payments_and_points.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/payments_and_points.sql
--
-- Runs in one transaction and is ROLLED BACK. Service RPCs run as the
-- owner (= trusted server boundary); consumer access runs as
-- authenticated / anon with JWT claims.
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

do $$
declare
    v_a uuid := gen_random_uuid();
    v_b uuid := gen_random_uuid();
    v_order uuid;
    v_order2 uuid;
    v_order_b uuid;
    v_cancelled uuid;
    v_payment public.payments;
    v_payment2 public.payments;
    v_topup public.payments;
    v_status text;
    v_text text;
    v_count bigint;
    v_balance bigint;
    v_amount numeric;
begin
    insert into auth.users (id) values (v_a), (v_b);

    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'PENDING', 5000, 5000) returning id into v_order;
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'PENDING', 3000, 3000) returning id into v_order2;
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_b, 'PENDING', 7000, 7000) returning id into v_order_b;
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'CANCELLED', 1000, 1000) returning id into v_cancelled;

    insert into _fx values ('a', v_a), ('b', v_b), ('order_b', v_order_b);

    -- ---------------- ORDER_PAYMENT ----------------
    v_payment := public.create_payment(v_a, 'ORDER_PAYMENT', v_order, null);
    insert into _results values ('order: attempt amount = order total',
        v_payment.amount = 5000 and v_payment.status = 'PENDING', v_payment.amount::text);

    begin
        perform public.create_payment(v_a, 'ORDER_PAYMENT', v_order, 4999);
        insert into _results values ('order: amount mismatch rejected', false, 'created');
    exception when others then
        insert into _results values ('order: amount mismatch rejected', sqlerrm like '%does not match%', sqlerrm);
    end;

    begin
        perform public.create_payment(v_b, 'ORDER_PAYMENT', v_order, null);
        insert into _results values ('order: other user cannot pay', false, 'created');
    exception when others then
        insert into _results values ('order: other user cannot pay', sqlstate = 'P0002', sqlerrm);
    end;

    begin
        perform public.create_payment(v_a, 'ORDER_PAYMENT', v_cancelled, null);
        insert into _results values ('order: non-PENDING order rejected', false, 'created');
    exception when others then
        insert into _results values ('order: non-PENDING order rejected', sqlerrm like '%not payable%', sqlerrm);
    end;

    -- failure keeps PENDING
    v_payment := public.complete_payment(v_a, v_payment.id, false, 'cb_fail', null);
    select status into v_status from public.orders where id = v_order;
    insert into _results values ('order: failed payment keeps order PENDING',
        v_payment.status = 'FAILED' and v_status = 'PENDING', v_payment.status || '/' || v_status);

    -- a FAILED payment is terminal
    v_payment := public.complete_payment(v_a, v_payment.id, true, 'cb_late', null);
    select status into v_status from public.orders where id = v_order;
    insert into _results values ('order: FAILED payment cannot be completed later',
        v_payment.status = 'FAILED' and v_status = 'PENDING', v_payment.status || '/' || v_status);

    -- other user cannot complete A's payment
    v_payment := public.create_payment(v_a, 'ORDER_PAYMENT', v_order, 5000);
    begin
        perform public.complete_payment(v_b, v_payment.id, true, 'cb_x', null);
        insert into _results values ('order: other user cannot complete payment', false, 'completed');
    exception when others then
        insert into _results values ('order: other user cannot complete payment', sqlstate = 'P0002', sqlerrm);
    end;

    -- success -> PAID exactly once
    v_payment := public.complete_payment(v_a, v_payment.id, true, 'cb_ok', null);
    select status, payment_reference into v_status, v_text from public.orders where id = v_order;
    insert into _results values ('order: success -> PAID with payment reference',
        v_payment.status = 'SUCCEEDED' and v_status = 'PAID' and v_text = v_payment.id::text,
        v_status || '/' || coalesce(v_text, 'null'));

    select status into v_status from public.orders where id = v_order2;
    insert into _results values ('order: other orders untouched', v_status = 'PENDING', v_status);

    v_payment2 := public.complete_payment(v_a, v_payment.id, true, 'cb_retry', null);
    select count(*) into v_count from public.payments where order_id = v_order and status = 'SUCCEEDED';
    insert into _results values ('order: retry is idempotent',
        v_payment2.pg_callback_id = 'cb_ok' and v_count = 1, v_payment2.pg_callback_id);

    begin
        perform public.create_payment(v_a, 'ORDER_PAYMENT', v_order, null);
        insert into _results values ('order: PAID order cannot be paid again', false, 'created');
    exception when others then
        insert into _results values ('order: PAID order cannot be paid again', sqlerrm like '%not payable%', sqlerrm);
    end;

    -- two open attempts for one order: only the first success pays
    v_payment := public.create_payment(v_a, 'ORDER_PAYMENT', v_order2, null);
    v_payment2 := public.create_payment(v_a, 'ORDER_PAYMENT', v_order2, null);
    v_payment := public.complete_payment(v_a, v_payment.id, true, 'cb_1', null);
    v_payment2 := public.complete_payment(v_a, v_payment2.id, true, 'cb_2', null);
    select count(*) into v_count from public.payments where order_id = v_order2 and status = 'SUCCEEDED';
    insert into _results values ('order: second attempt after PAID fails, one success',
        v_payment.status = 'SUCCEEDED' and v_payment2.status = 'FAILED' and v_count = 1,
        v_payment2.failure_reason);

    -- ---------------- POINT_TOPUP ----------------
    foreach v_amount in array array[0, 999, 1500, 1000001, 1000.5]::numeric[] loop
        begin
            perform public.create_payment(v_a, 'POINT_TOPUP', null, v_amount);
            insert into _results values ('topup: invalid amount ' || v_amount, false, 'created');
        exception when others then
            insert into _results values ('topup: invalid amount ' || v_amount, sqlerrm like '%top-up amount%', sqlerrm);
        end;
    end loop;

    begin
        perform public.create_payment(v_a, 'POINT_TOPUP', null, null);
        insert into _results values ('topup: missing amount rejected', false, 'created');
    exception when others then
        insert into _results values ('topup: missing amount rejected', true, sqlerrm);
    end;

    begin
        perform public.create_payment(v_a, 'POINT_TOPUP', v_order2, 5000);
        insert into _results values ('topup: order id rejected', false, 'created');
    exception when others then
        insert into _results values ('topup: order id rejected', true, sqlerrm);
    end;

    v_topup := public.create_payment(v_a, 'POINT_TOPUP', null, 5000);
    v_topup := public.complete_payment(v_a, v_topup.id, false, 'cb_tf', null);
    select count(*) into v_count from public.point_ledger where client_id = v_a;
    insert into _results values ('topup: failure credits nothing',
        v_topup.status = 'FAILED' and v_count = 0
        and not exists (select 1 from public.point_balances where client_id = v_a and balance > 0),
        v_topup.status);

    v_topup := public.create_payment(v_a, 'POINT_TOPUP', null, 5000);
    begin
        perform public.complete_payment(v_b, v_topup.id, true, 'cb_x', null);
        insert into _results values ('topup: other user cannot complete', false, 'completed');
    exception when others then
        insert into _results values ('topup: other user cannot complete', sqlstate = 'P0002', sqlerrm);
    end;

    v_topup := public.complete_payment(v_a, v_topup.id, true, 'cb_t1', null);
    select balance into v_balance from public.point_balances where client_id = v_a;
    select count(*) into v_count from public.point_ledger where payment_id = v_topup.id;
    insert into _results values ('topup: success credits once',
        v_topup.status = 'SUCCEEDED' and v_balance = 5000 and v_count = 1, v_balance::text);

    perform public.complete_payment(v_a, v_topup.id, true, 'cb_t2', null);
    select balance into v_balance from public.point_balances where client_id = v_a;
    select count(*) into v_count from public.point_ledger where client_id = v_a;
    insert into _results values ('topup: retry does not credit twice',
        v_balance = 5000 and v_count = 1, v_balance::text);

    begin
        insert into public.point_ledger (client_id, type, amount, balance_after, payment_id)
        values (v_a, 'TOPUP', 5000, 10000, v_topup.id);
        insert into _results values ('topup: ledger unique per payment', false, 'inserted');
    exception when unique_violation then
        insert into _results values ('topup: ledger unique per payment', true, sqlerrm);
    end;

    v_topup := public.create_payment(v_a, 'POINT_TOPUP', null, 3000);
    perform public.complete_payment(v_a, v_topup.id, true, 'cb_t3', null);
    select balance into v_balance from public.point_balances where client_id = v_a;
    insert into _results values ('topup: second top-up adds up (5000+3000)',
        v_balance = 8000
        and (select balance_after from public.point_ledger where payment_id = v_topup.id) = 8000,
        v_balance::text);

    select balance into v_balance from public.point_balances where client_id = v_b;
    insert into _results values ('topup: other user balance untouched', v_balance is null, coalesce(v_balance::text, 'none'));

    -- privileges
    insert into _results
    select 'privilege: ' || f || ' service_role only',
           not has_function_privilege('anon', f, 'execute')
           and not has_function_privilege('authenticated', f, 'execute')
           and has_function_privilege('service_role', f, 'execute'),
           null
    from unnest(array[
        'public.create_payment(uuid, text, uuid, numeric)',
        'public.complete_payment(uuid, uuid, boolean, text, text)'
    ]) as f;
end;
$$;


-- ------------------------------------------------------------
-- authenticated (user A): own rows only, no writes
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', (select id::text from _fx where key = 'a'), true),
    set_config('request.jwt.claims',
        json_build_object('sub', (select id::text from _fx where key = 'a'), 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

insert into _results
select 'rls: A reads only own payments',
       count(*) > 0 and bool_and(client_id = (select id from _fx where key = 'a')), count(*)::text
from public.payments;

insert into _results
select 'rls: A reads own balance / ledger',
       (select balance from public.point_balances) = 8000
       and (select count(*) from public.point_ledger) = 2, null;

do $$
begin
    begin
        insert into public.point_balances (client_id, balance)
        values ((select id from _fx where key = 'a'), 999999);
        insert into _results values ('rls: authenticated cannot write balances', false, 'inserted');
    exception when others then
        insert into _results values ('rls: authenticated cannot write balances', sqlstate = '42501', sqlerrm);
    end;

    begin
        update public.payments set status = 'SUCCEEDED';
        insert into _results values ('rls: authenticated cannot update payments', false, 'updated');
    exception when others then
        insert into _results values ('rls: authenticated cannot update payments', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.create_payment((select id from _fx where key = 'a'), 'POINT_TOPUP', null, 1000);
        insert into _results values ('rls: authenticated cannot call create_payment', false, 'executed');
    exception when others then
        insert into _results values ('rls: authenticated cannot call create_payment', sqlstate = '42501', sqlerrm);
    end;
end;
$$;

reset role;

-- ------------------------------------------------------------
-- anon: nothing visible
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', '', true),
    set_config('request.jwt.claims', '{"role":"anon"}', true)
\g /dev/null
set local role anon;

insert into _results
select 'rls: anon sees no payments / points',
       (select count(*) from public.payments) = 0
       and (select count(*) from public.point_balances) = 0
       and (select count(*) from public.point_ledger) = 0, null;

reset role;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'payments/points check FAILED: %', v_failures;
    end if;

    raise notice 'payments/points check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
