-- ============================================================
-- Local verification: Mall v3 Phase 3 payment reversal engine
-- (migration 20260926150000_v3_phase3_payment_reversal_engine.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/verification/v3_phase3_reversal.sql
--
-- Runs in one transaction and is ROLLED BACK. Every negative case runs
-- in its own subtransaction.
--
-- Covers: idempotent creation (BR-32), amount limit and FAILED freeing
-- the amount (BR-34, S-29), causes and links (BR-30), the state cycle
-- PENDING -> SUCCEEDED | FAILED and retry on the same row (IN-01),
-- claim/lease, late PG success, immutability of SUCCEEDED, the derived
-- display (IN-06), payments.status never changed (BR-29), grants.
-- Parallel requests: v3_phase3_concurrency.sh. Executor with a forced
-- PG failure/delay: v3_phase3_executor.sh.
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

create function pg_temp._pay(p_client uuid, p_amount numeric, p_status text default 'SUCCEEDED') returns uuid
language plpgsql as $$
declare v uuid;
begin
    insert into public.payments (client_id, purpose, amount, status, completed_at)
    values (p_client, 'ORDER_PAYMENT', p_amount, p_status,
            case when p_status = 'PENDING' then null else now() end)
    returning id into v;
    return v;
end;
$$;

create function pg_temp._sum(p_pay uuid) returns text
language sql as $$
    select display_status || ' ' || succeeded_amount::bigint || '/' || pending_amount::bigint || '/' || reversible_amount::bigint
    from public.get_payment_reversal_summary(p_pay);
$$;

do $$
declare
    v_a uuid := gen_random_uuid();
    v_b uuid := gen_random_uuid();
    v_p1 uuid; v_p2 uuid; v_p3 uuid; v_p4 uuid; v_p5 uuid;
    v_pending_pay uuid; v_failed_pay uuid;
    v_order_a uuid; v_order_b uuid; v_refund uuid;
    v_r1 public.payment_reversals; v_r2 public.payment_reversals; v_r3 public.payment_reversals;
    v_r4 public.payment_reversals; v_r5 public.payment_reversals;
    v_again public.payment_reversals;
    v_claim jsonb;
    v_res text;
    v_n bigint;
    v_status text;
begin
    insert into auth.users (id) values (v_a), (v_b);

    v_p1 := pg_temp._pay(v_a, 100000);
    v_pending_pay := pg_temp._pay(v_a, 5000, 'PENDING');
    v_failed_pay := pg_temp._pay(v_a, 5000, 'FAILED');
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_a, 'CANCELLED', 100000, 100000) returning id into v_order_a;
    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_b, 'PENDING', 1000, 1000) returning id into v_order_b;

    -- ============ creation and idempotency (BR-32) ============
    v_r1 := public.create_payment_reversal(v_p1, 30000, 'MANUAL_RECONCILIATION', '__v3p3_k1');
    insert into _results values ('create: PENDING reversal with no attempts and no completion',
        v_r1.status = 'PENDING' and v_r1.attempt_count = 0 and v_r1.completed_at is null
        and v_r1.amount = 30000, v_r1.status);

    v_again := public.create_payment_reversal(v_p1, 30000, 'MANUAL_RECONCILIATION', '__v3p3_k1');
    select count(*) into v_n from public.payment_reversals where idempotency_key = '__v3p3_k1';
    insert into _results values ('idempotency: same key and request returns the existing reversal',
        v_again.id = v_r1.id and v_n = 1, v_n::text);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 29999, ''MANUAL_RECONCILIATION'', ''__v3p3_k1'')', v_p1));
    insert into _results values ('idempotency: same key with another amount rejected', v_res = 'P0001', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 30000, ''ORPHAN_PAYMENT'', ''__v3p3_k1'')', v_p1));
    insert into _results values ('idempotency: same key with another reason rejected', v_res = 'P0001', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 30000, ''MANUAL_RECONCILIATION'', ''   '')', v_p1));
    insert into _results values ('create: blank idempotency key rejected', v_res = 'P0001', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''MANUAL_RECONCILIATION'', ''__v3p3_np'')', gen_random_uuid()));
    insert into _results values ('create: unknown Payment -> P0002', v_res = 'P0002', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''MANUAL_RECONCILIATION'', ''__v3p3_pp'')', v_pending_pay));
    insert into _results values ('create: PENDING Payment cannot be reversed', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''MANUAL_RECONCILIATION'', ''__v3p3_fp'')', v_failed_pay));
    insert into _results values ('create: FAILED Payment cannot be reversed', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''BOGUS'', ''__v3p3_bg'')', v_p1));
    insert into _results values ('create: unknown reason rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 0, ''MANUAL_RECONCILIATION'', ''__v3p3_z'')', v_p1));
    insert into _results values ('create: non-positive amount rejected', v_res = '23514', v_res);

    -- ============ causes and links (BR-30, BR-32) ============
    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''ORDER_CANCEL'', ''__v3p3_oc1'', %L)', v_p1, v_order_a));
    insert into _results values ('cause: ORDER_CANCEL linked to the client''s Order', v_res = 'OK', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''ORDER_CANCEL'', ''__v3p3_oc2'', %L)', v_p1, v_order_b));
    insert into _results values ('cause: an Order of another client rejected', v_res = 'P0002', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''ORDER_CANCEL'', ''__v3p3_oc3'')', v_p1));
    insert into _results values ('cause: ORDER_CANCEL without an Order rejected', v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''FINALIZE_FAILURE'', ''__v3p3_ff'')', v_p1));
    insert into _results values ('cause: FINALIZE_FAILURE without an Order allowed', v_res = 'OK', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''ORPHAN_PAYMENT'', ''__v3p3_op'')', pg_temp._pay(v_a, 1000)));
    insert into _results values ('cause: ORPHAN_PAYMENT without an Order allowed', v_res = 'OK', v_res);

    insert into public.refund_requests (order_id, client_id, status, requested_amount)
    values (v_order_a, v_a, 'APPROVED', 100) returning id into v_refund;
    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''REFUND'', ''__v3p3_rf'', %L, %L)', v_p1, v_order_a, v_refund));
    insert into _results values ('cause: REFUND linked to its refund request', v_res = 'OK', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 100, ''REFUND'', ''__v3p3_rf2'', %L)', v_p1, v_order_a));
    insert into _results values ('cause: REFUND without a refund request rejected', v_res = '23514', v_res);

    -- ============ S-29 on a clean Payment (100,000) ============
    v_p2 := pg_temp._pay(v_a, 100000);
    v_r1 := public.create_payment_reversal(v_p2, 30000, 'MANUAL_RECONCILIATION', '__v3p3_s1');
    v_claim := public.claim_payment_reversal(v_r1.id);
    v_r1 := public.complete_payment_reversal(v_r1.id, true, '__v3p3_pg_s1');
    insert into _results values ('state: PENDING -> SUCCEEDED records PG reference and completed_at',
        v_r1.status = 'SUCCEEDED' and v_r1.pg_reference = '__v3p3_pg_s1' and v_r1.completed_at is not null
        and (v_claim ->> 'claimed')::boolean, v_r1.status);

    v_r2 := public.create_payment_reversal(v_p2, 50000, 'MANUAL_RECONCILIATION', '__v3p3_s2');
    insert into _results values ('S-29: SUCCEEDED 30,000 + PENDING 50,000 -> in progress, 20,000 reversible',
        pg_temp._sum(v_p2) = 'REFUND_IN_PROGRESS 30000/50000/20000', pg_temp._sum(v_p2));

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 30000, ''MANUAL_RECONCILIATION'', ''__v3p3_s3'')', v_p2));
    insert into _results values ('S-29: a further 30,000 exceeds the payment and is rejected (BR-34)',
        v_res = '23514', v_res);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 20000, ''MANUAL_RECONCILIATION'', ''__v3p3_s3b'')', v_p2));
    insert into _results values ('S-29: exactly the remaining 20,000 is allowed', v_res = 'OK', v_res);
    delete from public.payment_reversals where idempotency_key = '__v3p3_s3b';

    perform public.claim_payment_reversal(v_r2.id);
    v_r2 := public.complete_payment_reversal(v_r2.id, false, null, 'PG refused');
    insert into _results values ('state: PENDING -> FAILED keeps the failure reason',
        v_r2.status = 'FAILED' and v_r2.failure_reason = 'PG refused' and v_r2.completed_at is null, v_r2.status);
    insert into _results values ('S-29: FAILED frees the amount: partially refunded, 70,000 reversible',
        pg_temp._sum(v_p2) = 'PARTIALLY_REFUNDED 30000/0/70000', pg_temp._sum(v_p2));

    v_r3 := public.create_payment_reversal(v_p2, 30000, 'MANUAL_RECONCILIATION', '__v3p3_s3');
    insert into _results values ('S-29: the second 30,000 request is now allowed',
        v_r3.status = 'PENDING' and pg_temp._sum(v_p2) = 'REFUND_IN_PROGRESS 30000/30000/40000', pg_temp._sum(v_p2));

    v_res := pg_temp._try(format('select public.retry_payment_reversal(%L)', v_r2.id));
    insert into _results values ('retry: 50,000 no longer fits (30,000 + 30,000 + 50,000 > 100,000), stays FAILED',
        v_res = '23514' and (select status from public.payment_reversals where id = v_r2.id) = 'FAILED', v_res);

    perform public.claim_payment_reversal(v_r3.id);
    perform public.complete_payment_reversal(v_r3.id, true, '__v3p3_pg_s3');
    v_r4 := public.create_payment_reversal(v_p2, 40000, 'MANUAL_RECONCILIATION', '__v3p3_s4');
    perform public.claim_payment_reversal(v_r4.id);
    perform public.complete_payment_reversal(v_r4.id, true, '__v3p3_pg_s4');
    insert into _results values ('display: SUCCEEDED reversals cover the payment -> REFUNDED, 0 reversible',
        pg_temp._sum(v_p2) = 'REFUNDED 100000/0/0', pg_temp._sum(v_p2));

    select status into v_status from public.payments where id = v_p2;
    insert into _results values ('BR-29: payments.status stays SUCCEEDED after full reversal',
        v_status = 'SUCCEEDED', v_status);

    v_res := pg_temp._try(format(
        'select public.create_payment_reversal(%L, 1, ''MANUAL_RECONCILIATION'', ''__v3p3_over'')', v_p2));
    insert into _results values ('BR-34: nothing more can be reversed on a fully reversed Payment',
        v_res = '23514', v_res);

    -- ============ claim / lease / retry on one row (IN-01) ============
    v_p3 := pg_temp._pay(v_a, 10000);
    v_r1 := public.create_payment_reversal(v_p3, 10000, 'ORPHAN_PAYMENT', '__v3p3_t1');
    v_claim := public.claim_payment_reversal(v_r1.id);
    insert into _results values ('claim: first claim counts attempt 1 and returns the Payment reference field',
        (v_claim ->> 'claimed')::boolean and (v_claim ->> 'attempt_count')::int = 1
        and v_claim ? 'payment_pg_callback_id', v_claim ->> 'attempt_count');

    v_claim := public.claim_payment_reversal(v_r1.id);
    insert into _results values ('claim: a second claim inside the lease is not granted, attempts stay 1',
        not (v_claim ->> 'claimed')::boolean and (v_claim ->> 'attempt_count')::int = 1, v_claim ->> 'attempt_count');

    update public.payment_reversals set last_attempted_at = now() - interval '10 minutes' where id = v_r1.id;
    v_claim := public.claim_payment_reversal(v_r1.id);
    insert into _results values ('claim: after the lease expires the reversal can be claimed again (attempt 2)',
        (v_claim ->> 'claimed')::boolean and (v_claim ->> 'attempt_count')::int = 2, v_claim ->> 'attempt_count');

    v_res := pg_temp._try(format('select public.claim_payment_reversal(%L, 0)', v_r1.id));
    insert into _results values ('claim: a non-positive lease is rejected', v_res = 'P0001', v_res);

    v_r1 := public.complete_payment_reversal(v_r1.id, false, null, 'PG down');
    v_claim := public.claim_payment_reversal(v_r1.id);
    insert into _results values ('claim: a FAILED reversal is not claimable',
        not (v_claim ->> 'claimed')::boolean and v_claim ->> 'status' = 'FAILED', v_claim ->> 'status');

    v_again := public.complete_payment_reversal(v_r1.id, false, null, 'another message');
    insert into _results values ('complete: a repeated failure is idempotent (first reason kept)',
        v_again.status = 'FAILED' and v_again.failure_reason = 'PG down', v_again.failure_reason);

    v_r1 := public.retry_payment_reversal(v_r1.id, v_a);
    insert into _results values ('retry: FAILED -> PENDING on the same row, reason cleared, attempts kept, actor recorded',
        v_r1.status = 'PENDING' and v_r1.failure_reason is null and v_r1.last_attempted_at is null
        and v_r1.attempt_count = 2 and v_r1.requested_by = v_a, v_r1.status);

    v_again := public.retry_payment_reversal(v_r1.id);
    insert into _results values ('retry: a PENDING reversal is returned unchanged', v_again.status = 'PENDING', v_again.status);

    select count(*) into v_n from public.payment_reversals where payment_id = v_p3;
    insert into _results values ('retry: no second reversal row was created', v_n = 1, v_n::text);

    v_claim := public.claim_payment_reversal(v_r1.id);
    v_r1 := public.complete_payment_reversal(v_r1.id, true, '__v3p3_pg_t1');
    insert into _results values ('retry: the retried reversal succeeds (attempt 3)',
        v_r1.status = 'SUCCEEDED' and v_r1.attempt_count = 3, v_r1.attempt_count::text);

    v_res := pg_temp._try(format('select public.retry_payment_reversal(%L)', v_r1.id));
    insert into _results values ('retry: a SUCCEEDED reversal cannot be retried', v_res = 'P0001', v_res);

    v_again := public.complete_payment_reversal(v_r1.id, true, 'other-ref');
    insert into _results values ('complete: a repeated success is idempotent (first PG reference kept)',
        v_again.pg_reference = '__v3p3_pg_t1', v_again.pg_reference);

    v_again := public.complete_payment_reversal(v_r1.id, false, null, 'late failure');
    insert into _results values ('complete: a failure report cannot undo a SUCCEEDED reversal',
        v_again.status = 'SUCCEEDED', v_again.status);

    -- ============ immutability ============
    v_res := pg_temp._try(format('update public.payment_reversals set status = ''FAILED'' where id = %L', v_r1.id));
    insert into _results values ('final: SUCCEEDED cannot be moved back', v_res = '23514', v_res);
    v_res := pg_temp._try(format('update public.payment_reversals set failure_reason = ''x'' where id = %L', v_r1.id));
    insert into _results values ('final: SUCCEEDED cannot be edited', v_res = '23514', v_res);
    v_res := pg_temp._try(format('update public.payment_reversals set amount = 1 where id = %L', v_r1.id));
    insert into _results values ('final: the amount of a reversal never changes', v_res = '23514', v_res);
    v_res := pg_temp._try(format('update public.payment_reversals set idempotency_key = ''__v3p3_new'' where id = %L', v_r1.id));
    insert into _results values ('final: the idempotency key never changes', v_res = '23514', v_res);

    -- ============ completion input ============
    v_p4 := pg_temp._pay(v_a, 10000);
    v_r1 := public.create_payment_reversal(v_p4, 10000, 'ORPHAN_PAYMENT', '__v3p3_c1');
    v_res := pg_temp._try(format('select public.complete_payment_reversal(%L, true)', v_r1.id));
    insert into _results values ('complete: success without a PG reference rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.complete_payment_reversal(%L, null)', v_r1.id));
    insert into _results values ('complete: a missing result rejected', v_res = 'P0001', v_res);
    v_res := pg_temp._try(format('select public.complete_payment_reversal(%L, true, ''__v3p3_dup'')', gen_random_uuid()));
    insert into _results values ('complete: unknown reversal -> P0002', v_res = 'P0002', v_res);

    -- late PG success on a FAILED reversal
    v_r1 := public.complete_payment_reversal(v_r1.id, false, null, 'timeout treated as failure');
    v_r1 := public.complete_payment_reversal(v_r1.id, true, '__v3p3_pg_late');
    insert into _results values ('late success: FAILED -> SUCCEEDED is recorded when the amount is still free',
        v_r1.status = 'SUCCEEDED' and v_r1.completed_at is not null, v_r1.status);

    -- ... but not when the freed amount was taken meanwhile
    v_p5 := pg_temp._pay(v_a, 10000);
    v_r1 := public.create_payment_reversal(v_p5, 10000, 'ORPHAN_PAYMENT', '__v3p3_l1');
    v_r1 := public.complete_payment_reversal(v_r1.id, false, null, 'failed');
    v_r2 := public.create_payment_reversal(v_p5, 10000, 'MANUAL_RECONCILIATION', '__v3p3_l2');
    v_res := pg_temp._try(format('select public.complete_payment_reversal(%L, true, ''__v3p3_pg_l1'')', v_r1.id));
    insert into _results values ('late success: rejected when the freed amount was taken (needs reconciliation)',
        v_res = '23514' and (select status from public.payment_reversals where id = v_r1.id) = 'FAILED', v_res);

    -- ============ grants ============
    insert into _results values ('grants: engine functions are service_role only',
        (select bool_and(
            has_function_privilege('service_role', f, 'execute')
            and not has_function_privilege('anon', f, 'execute')
            and not has_function_privilege('authenticated', f, 'execute'))
         from unnest(array[
            'public.create_payment_reversal(uuid, numeric, text, text, uuid, uuid, uuid)',
            'public.claim_payment_reversal(uuid, integer)',
            'public.complete_payment_reversal(uuid, boolean, text, text)',
            'public.retry_payment_reversal(uuid, uuid)',
            'public.get_payment_reversal_summary(uuid)'
         ]::regprocedure[]) as f),
        'checked');

    -- payments rows are never modified by the engine
    select count(*) into v_n from public.payments
    where id in (v_p1, v_p2, v_p3, v_p4, v_p5) and status <> 'SUCCEEDED';
    insert into _results values ('BR-29: every reversed payment is still SUCCEEDED', v_n = 0, v_n::text);

    insert into _fx values ('payment', v_p1), ('reversal', v_r2.id);
end;
$$;

-- ------------------------------------------------------------
-- Consumer boundary
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', gen_random_uuid()::text, true),
    set_config('request.jwt.claims',
        json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

do $$
declare
    v_payment uuid := (select id from _fx where key = 'payment');
    v_reversal uuid := (select id from _fx where key = 'reversal');
begin
    begin
        perform public.create_payment_reversal(v_payment, 1, 'MANUAL_RECONCILIATION', '__v3p3_auth');
        insert into _results values ('rls: authenticated cannot create a reversal', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot create a reversal', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.retry_payment_reversal(v_reversal);
        insert into _results values ('rls: authenticated cannot retry a reversal', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot retry a reversal', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform * from public.get_payment_reversal_summary(v_payment);
        insert into _results values ('rls: authenticated cannot read the reversal summary', false, 'allowed');
    exception when others then
        insert into _results values ('rls: authenticated cannot read the reversal summary', sqlstate = '42501', sqlerrm);
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
        raise exception 'v3 phase 3 reversal check FAILED: %', v_failures;
    end if;

    raise notice 'v3 phase 3 reversal check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
