-- ============================================================
-- Mall v3 - Phase 3: payment reversal engine
--
-- Source: docs/mall1/v3/PHASES.md (Phase 3),
--         docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md
--         (BR-26, BR-29 .. BR-34; IN-01, IN-03, IN-06; DN-40; S-27, S-29).
--
-- Additive only. payments and every v2 function are untouched; the v2
-- runtime keeps working. payments.status is never changed by a reversal
-- (BR-29): the original PG success is preserved.
--
-- Builds on the Phase 1 table payment_reversals and its guard trigger
-- (SUM(PENDING + SUCCEEDED) <= payments.amount, SUCCEEDED Payment only,
-- idempotency key unique).
--
-- Decisions inside Phase 3 (implementation, not business policy)
--
--   IN-03  Enforcement: the Phase 1 trigger stays the constraint-level
--          guard (Payment row lock + sum, so direct inserts are guarded
--          too). create_payment_reversal takes the same Payment lock
--          first, so a repeated request with one idempotency key returns
--          the existing row and concurrent requests are serialized.
--
--   IN-01  Retry history: a reversal is one business request, so a retry
--          reuses the SAME row (FAILED -> PENDING) instead of creating
--          another reversal. The row carries attempt_count and
--          last_attempted_at; the latest failure_reason is kept. No
--          separate attempt table (raw PG callback logging stays IN-02).
--
--   DN-40  Reprocessing a FAILED reversal and creating a
--          MANUAL_RECONCILIATION reversal are trusted-server operations
--          only (service_role RPCs; no Consumer path). The acting Admin
--          may be recorded in requested_by. The Admin screen / approval
--          workflow is wired in the phase that uses it (Phases 5-7).
--          Registering a PG payment the Mall has no record of is a
--          Payment record, not a reversal, and is not part of this phase.
--
--   IN-06  The payment-level refund display is computed
--          (get_payment_reversal_summary), not stored.
--
-- External PG calls are NOT made inside these functions. The executor
-- claims a reversal (a short transaction), calls the PG outside any
-- database transaction, then records the outcome (another short
-- transaction). See apps/client-web/lib/payment/reversal.ts.
-- ============================================================

-- ------------------------------------------------------------
-- Columns for the state cycle
-- ------------------------------------------------------------
alter table public.payment_reversals
    add column attempt_count     integer                  not null default 0,
    add column last_attempted_at timestamp with time zone,
    add column completed_at      timestamp with time zone,
    add column requested_by      uuid;

alter table public.payment_reversals
    add constraint payment_reversals_requested_by_fk foreign key (requested_by)
        references auth.users(id) on delete set null,
    add constraint payment_reversals_attempt_count_nonnegative
        check (attempt_count >= 0),
    add constraint payment_reversals_completed_state
        check ((status = 'SUCCEEDED') = (completed_at is not null));

-- ------------------------------------------------------------
-- State-transition guard
--
--   PENDING   -> SUCCEEDED | FAILED
--   FAILED    -> PENDING (retry) | SUCCEEDED (late PG success)
--   SUCCEEDED is terminal and immutable.
--
-- What the reversal is for (payment, links, amount, reason, key) never
-- changes after creation. completed_at follows the status.
-- ------------------------------------------------------------
create or replace function public.enforce_payment_reversal_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    if tg_op = 'INSERT' then
        new.completed_at := case when new.status = 'SUCCEEDED' then now() else null end;
        return new;
    end if;

    if new.payment_id is distinct from old.payment_id
       or new.order_id is distinct from old.order_id
       or new.refund_request_id is distinct from old.refund_request_id
       or new.amount is distinct from old.amount
       or new.reason_type is distinct from old.reason_type
       or new.idempotency_key is distinct from old.idempotency_key then
        raise exception 'A reversal cannot change what it reverses'
            using errcode = '23514';
    end if;

    if old.status = 'SUCCEEDED' then
        if new.status is distinct from old.status
           or new.pg_reference is distinct from old.pg_reference
           or new.failure_reason is distinct from old.failure_reason
           or new.completed_at is distinct from old.completed_at then
            raise exception 'A SUCCEEDED reversal is final'
                using errcode = '23514';
        end if;

        return new;
    end if;

    if new.status = 'SUCCEEDED' and old.status <> 'SUCCEEDED' then
        new.completed_at := now();
    elsif new.status <> 'SUCCEEDED' then
        new.completed_at := null;
    end if;

    return new;
end;
$$;

create trigger payment_reversals_enforce_transition
    before insert or update on public.payment_reversals
    for each row execute function public.enforce_payment_reversal_transition();

revoke all on function public.enforce_payment_reversal_transition()
    from public, anon, authenticated;


-- ------------------------------------------------------------
-- create_payment_reversal
--
-- Creates a PENDING reversal, or returns the existing one when the same
-- idempotency key was already used for the SAME request (BR-32). A key
-- reused for a different request is rejected.
-- Amount limit (BR-34) and "only a SUCCEEDED Payment" come from the
-- guard trigger; the Payment row is locked first so concurrent requests
-- are serialized.
-- ------------------------------------------------------------
create or replace function public.create_payment_reversal(
    p_payment_id        uuid,
    p_amount            numeric,
    p_reason_type       text,
    p_idempotency_key   text,
    p_order_id          uuid default null,
    p_refund_request_id uuid default null,
    p_requested_by      uuid default null
)
returns public.payment_reversals
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
    v_existing public.payment_reversals;
    v_order_client uuid;
    v_row public.payment_reversals;
begin
    if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
        raise exception 'Idempotency key is required';
    end if;

    select p.* into v_payment
    from public.payments p
    where p.id = p_payment_id
    for no key update;

    if v_payment.id is null then
        raise exception 'Payment not found' using errcode = 'P0002';
    end if;

    select r.* into v_existing
    from public.payment_reversals r
    where r.idempotency_key = p_idempotency_key;

    if v_existing.id is not null then
        if v_existing.payment_id is distinct from p_payment_id
           or v_existing.amount is distinct from p_amount
           or v_existing.reason_type is distinct from p_reason_type
           or v_existing.order_id is distinct from p_order_id
           or v_existing.refund_request_id is distinct from p_refund_request_id then
            raise exception
                'Idempotency key was already used for a different reversal request';
        end if;

        return v_existing;
    end if;

    if p_order_id is not null then
        select o.client_id into v_order_client
        from public.orders o
        where o.id = p_order_id;

        if v_order_client is null or v_order_client <> v_payment.client_id then
            raise exception 'Order does not belong to the Payment client'
                using errcode = 'P0002';
        end if;
    end if;

    insert into public.payment_reversals (
        payment_id, order_id, refund_request_id, amount,
        reason_type, idempotency_key, requested_by
    )
    values (
        p_payment_id, p_order_id, p_refund_request_id, p_amount,
        p_reason_type, p_idempotency_key, p_requested_by
    )
    returning * into v_row;

    return v_row;
end;
$$;


-- ------------------------------------------------------------
-- claim_payment_reversal
--
-- Called by the executor right before the external PG call. Only a
-- PENDING reversal whose last attempt is older than the lease can be
-- claimed; the claim counts an attempt. A reversal that is not claimed
-- must not be sent to the PG by this caller. (The PG request itself
-- must also carry the idempotency key, so a lost lease cannot refund
-- twice.)
--
-- Returns the reversal as jsonb plus `claimed` and the Payment's
-- `payment_pg_callback_id`.
-- ------------------------------------------------------------
create or replace function public.claim_payment_reversal(
    p_reversal_id   uuid,
    p_lease_seconds integer default 300
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_row public.payment_reversals;
    v_callback text;
    v_claimed boolean := false;
begin
    if p_lease_seconds is null or p_lease_seconds <= 0 then
        raise exception 'Lease must be a positive number of seconds';
    end if;

    select r.* into v_row
    from public.payment_reversals r
    where r.id = p_reversal_id
    for update;

    if v_row.id is null then
        raise exception 'Reversal not found' using errcode = 'P0002';
    end if;

    if v_row.status = 'PENDING'
       and (v_row.last_attempted_at is null
            or v_row.last_attempted_at <= now() - make_interval(secs => p_lease_seconds)) then
        update public.payment_reversals
           set attempt_count = attempt_count + 1,
               last_attempted_at = now()
         where id = v_row.id
        returning * into v_row;

        v_claimed := true;
    end if;

    select p.pg_callback_id into v_callback
    from public.payments p
    where p.id = v_row.payment_id;

    return to_jsonb(v_row) || jsonb_build_object(
        'claimed', v_claimed,
        'payment_pg_callback_id', v_callback
    );
end;
$$;


-- ------------------------------------------------------------
-- complete_payment_reversal
--
-- Records the PG outcome. Idempotent: a SUCCEEDED reversal is returned
-- unchanged; a repeated failure on a FAILED reversal is unchanged.
-- Success needs the PG reference (evidence of the PG side). A FAILED
-- reversal frees its amount (BR-34); a late PG success on a FAILED
-- reversal is recorded (FAILED -> SUCCEEDED) and re-checked against the
-- amount limit, which fails if the freed amount was taken meanwhile
-- (a case for MANUAL_RECONCILIATION).
-- payments.status is never touched (BR-29).
-- ------------------------------------------------------------
create or replace function public.complete_payment_reversal(
    p_reversal_id    uuid,
    p_succeeded      boolean,
    p_pg_reference   text default null,
    p_failure_reason text default null
)
returns public.payment_reversals
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_row public.payment_reversals;
begin
    if p_succeeded is null then
        raise exception 'Reversal result is required';
    end if;

    select r.* into v_row
    from public.payment_reversals r
    where r.id = p_reversal_id
    for update;

    if v_row.id is null then
        raise exception 'Reversal not found' using errcode = 'P0002';
    end if;

    if v_row.status = 'SUCCEEDED' then
        return v_row;
    end if;

    if p_succeeded then
        if p_pg_reference is null or btrim(p_pg_reference) = '' then
            raise exception 'PG reference is required for a successful reversal';
        end if;

        update public.payment_reversals
           set status = 'SUCCEEDED',
               pg_reference = p_pg_reference,
               failure_reason = null
         where id = v_row.id
        returning * into v_row;

        return v_row;
    end if;

    if v_row.status = 'FAILED' then
        return v_row;
    end if;

    update public.payment_reversals
       set status = 'FAILED',
           failure_reason = coalesce(p_failure_reason, 'PG reversal failed')
     where id = v_row.id
    returning * into v_row;

    return v_row;
end;
$$;


-- ------------------------------------------------------------
-- retry_payment_reversal
--
-- Reprocessing (DN-40): FAILED -> PENDING on the same row, so the
-- reversal is attempted again under the same idempotency key. The
-- amount limit is re-checked by the guard trigger (the freed amount may
-- have been taken). A PENDING reversal is returned unchanged; a
-- SUCCEEDED one cannot be retried.
-- ------------------------------------------------------------
create or replace function public.retry_payment_reversal(
    p_reversal_id  uuid,
    p_requested_by uuid default null
)
returns public.payment_reversals
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_row public.payment_reversals;
begin
    select r.* into v_row
    from public.payment_reversals r
    where r.id = p_reversal_id
    for update;

    if v_row.id is null then
        raise exception 'Reversal not found' using errcode = 'P0002';
    end if;

    if v_row.status = 'SUCCEEDED' then
        raise exception 'A SUCCEEDED reversal cannot be retried';
    end if;

    if v_row.status = 'PENDING' then
        return v_row;
    end if;

    update public.payment_reversals
       set status = 'PENDING',
           failure_reason = null,
           last_attempted_at = null,
           requested_by = coalesce(p_requested_by, requested_by)
     where id = v_row.id
    returning * into v_row;

    return v_row;
end;
$$;


-- ------------------------------------------------------------
-- get_payment_reversal_summary  (IN-06, BR-29)
--
-- Derived payment-level display. It is never stored and never a
-- payments.status value.
--   REFUNDED             SUCCEEDED reversals cover the whole payment
--   REFUND_IN_PROGRESS   any PENDING reversal
--   PARTIALLY_REFUNDED   some SUCCEEDED reversal, nothing pending
--   NONE                 otherwise
-- Internal read model; the Consumer read scope is decided in Phase 5
-- (DN-19).
-- ------------------------------------------------------------
create or replace function public.get_payment_reversal_summary(
    p_payment_id uuid
)
returns table (
    payment_id        uuid,
    payment_amount    numeric,
    succeeded_amount  numeric,
    pending_amount    numeric,
    reversible_amount numeric,
    display_status    text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    with sums as (
        select
            p.id,
            p.amount,
            coalesce(sum(r.amount) filter (where r.status = 'SUCCEEDED'), 0) as succeeded,
            coalesce(sum(r.amount) filter (where r.status = 'PENDING'), 0) as pending
        from public.payments p
        left join public.payment_reversals r on r.payment_id = p.id
        where p.id = p_payment_id
        group by p.id, p.amount
    )
    select
        s.id,
        s.amount,
        s.succeeded,
        s.pending,
        s.amount - s.succeeded - s.pending,
        case
            when s.succeeded >= s.amount then 'REFUNDED'
            when s.pending > 0 then 'REFUND_IN_PROGRESS'
            when s.succeeded > 0 then 'PARTIALLY_REFUNDED'
            else 'NONE'
        end
    from sums s;
$$;


-- ------------------------------------------------------------
-- Trusted server only
-- ------------------------------------------------------------
revoke all on function public.create_payment_reversal(uuid, numeric, text, text, uuid, uuid, uuid)
    from public, anon, authenticated;
grant execute on function public.create_payment_reversal(uuid, numeric, text, text, uuid, uuid, uuid)
    to service_role;

revoke all on function public.claim_payment_reversal(uuid, integer)
    from public, anon, authenticated;
grant execute on function public.claim_payment_reversal(uuid, integer)
    to service_role;

revoke all on function public.complete_payment_reversal(uuid, boolean, text, text)
    from public, anon, authenticated;
grant execute on function public.complete_payment_reversal(uuid, boolean, text, text)
    to service_role;

revoke all on function public.retry_payment_reversal(uuid, uuid)
    from public, anon, authenticated;
grant execute on function public.retry_payment_reversal(uuid, uuid)
    to service_role;

revoke all on function public.get_payment_reversal_summary(uuid)
    from public, anon, authenticated;
grant execute on function public.get_payment_reversal_summary(uuid)
    to service_role;
