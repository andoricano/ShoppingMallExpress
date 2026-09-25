-- ============================================================
-- Mall v2
-- Payment attempts (ORDER_PAYMENT | POINT_TOPUP) and Point ledger
--
-- Contract (docs/mall1/v2/PHASES.md, Phase 6 Point/Payment):
--
--   payments
--     One row per payment attempt made by an authenticated user.
--     purpose ORDER_PAYMENT: pays an existing PENDING Order; amount
--       is copied from orders.total_amount (never from the client).
--     purpose POINT_TOPUP: charges the user's Point balance; amount
--       must satisfy the server top-up policy (1,000 ~ 1,000,000,
--       multiple of 1,000).
--     status: PENDING -> SUCCEEDED | FAILED (terminal).
--
--   point_balances / point_ledger
--     Minimal Point domain. The balance changes only through ledger
--     entries written by trusted RPCs. A ledger entry references at
--     most one payment (unique), so a payment can credit Points once.
--
--   The external PG Test service only records test results. Mall
--   state changes happen exclusively in complete_payment(), after the
--   trusted server boundary has recorded the PG Test result.
--
--   All RPCs below are SECURITY DEFINER and executable by
--   service_role only (client Route Handlers verify the user and pass
--   the user id). Consumers read their own rows through owner RLS.
--   No anon/authenticated write policy exists on these tables.
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table public.payments (
    id              uuid                     not null default gen_random_uuid(),
    client_id       uuid                     not null,
    purpose         text                     not null,
    order_id        uuid,
    amount          numeric(14, 2)           not null,
    status          text                     not null default 'PENDING',
    pg_callback_id  text,
    failure_reason  text,
    created_at      timestamp with time zone not null default now(),
    updated_at      timestamp with time zone not null default now(),
    completed_at    timestamp with time zone,
    constraint payments_pkey primary key (id),
    constraint payments_client_fk foreign key (client_id)
        references auth.users(id) on delete restrict,
    constraint payments_order_fk foreign key (order_id)
        references public.orders(id) on delete restrict,
    constraint payments_purpose_valid
        check (purpose in ('ORDER_PAYMENT', 'POINT_TOPUP')),
    constraint payments_status_valid
        check (status in ('PENDING', 'SUCCEEDED', 'FAILED')),
    constraint payments_target_valid check (
        (purpose = 'ORDER_PAYMENT' and order_id is not null)
        or (purpose = 'POINT_TOPUP' and order_id is null)
    ),
    constraint payments_amount_positive check (amount > 0),
    constraint payments_completed_state check (
        (status = 'PENDING') = (completed_at is null)
    )
);

-- At most one successful payment per Order.
create unique index payments_order_succeeded_uidx
    on public.payments (order_id)
    where status = 'SUCCEEDED';

create index payments_client_created_idx
    on public.payments (client_id, created_at desc);

create trigger payments_set_updated_at
    before update on public.payments
    for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy payments_owner_select on public.payments
    for select to authenticated
    using (client_id = auth.uid());


create table public.point_balances (
    client_id   uuid                     not null,
    balance     bigint                   not null default 0,
    created_at  timestamp with time zone not null default now(),
    updated_at  timestamp with time zone not null default now(),
    constraint point_balances_pkey primary key (client_id),
    constraint point_balances_client_fk foreign key (client_id)
        references auth.users(id) on delete cascade,
    constraint point_balances_nonnegative check (balance >= 0)
);

create trigger point_balances_set_updated_at
    before update on public.point_balances
    for each row execute function public.set_updated_at();

alter table public.point_balances enable row level security;

create policy point_balances_owner_select on public.point_balances
    for select to authenticated
    using (client_id = auth.uid());


create table public.point_ledger (
    id             uuid                     not null default gen_random_uuid(),
    client_id      uuid                     not null,
    type           text                     not null,
    amount         bigint                   not null,
    balance_after  bigint                   not null,
    payment_id     uuid,
    created_at     timestamp with time zone not null default now(),
    constraint point_ledger_pkey primary key (id),
    constraint point_ledger_client_fk foreign key (client_id)
        references auth.users(id) on delete cascade,
    constraint point_ledger_payment_fk foreign key (payment_id)
        references public.payments(id) on delete restrict,
    -- Only top-ups exist in the current contract; spending Points is
    -- not part of Mall v2 yet.
    constraint point_ledger_type_valid check (type in ('TOPUP')),
    constraint point_ledger_topup_shape check (
        type <> 'TOPUP' or (amount > 0 and payment_id is not null)
    ),
    constraint point_ledger_balance_nonnegative check (balance_after >= 0),
    -- A payment credits Points at most once.
    constraint point_ledger_payment_unique unique (payment_id)
);

create index point_ledger_client_created_idx
    on public.point_ledger (client_id, created_at desc);

alter table public.point_ledger enable row level security;

create policy point_ledger_owner_select on public.point_ledger
    for select to authenticated
    using (client_id = auth.uid());


-- Tables are written only by the service RPCs below.
revoke insert, update, delete, truncate
    on public.payments, public.point_balances, public.point_ledger
    from anon, authenticated;


-- ------------------------------------------------------------
-- create_payment(client, purpose, order, amount)
--
-- ORDER_PAYMENT: the Order must belong to the client and be
--   PENDING. The attempt amount is the Order's total_amount.
--   p_amount, when given, must equal it (mismatch is rejected).
-- POINT_TOPUP: p_amount must satisfy the top-up policy.
-- ------------------------------------------------------------
create or replace function public.create_payment(
    p_client_id uuid,
    p_purpose text,
    p_order_id uuid default null,
    p_amount numeric default null
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_order public.orders;
    v_amount numeric(14, 2);
    v_payment public.payments;
begin
    if p_client_id is null then
        raise exception 'Authentication required';
    end if;

    if p_purpose = 'ORDER_PAYMENT' then
        if p_order_id is null then
            raise exception 'Order id is required';
        end if;

        select o.* into v_order
        from public.orders o
        where o.id = p_order_id
          and o.client_id = p_client_id;

        if v_order.id is null then
            raise exception 'Order not found' using errcode = 'P0002';
        end if;

        if v_order.status <> 'PENDING' then
            raise exception 'Order is not payable in status %', v_order.status;
        end if;

        if v_order.total_amount <= 0 then
            raise exception 'Order amount must be greater than zero';
        end if;

        if p_amount is not null and p_amount <> v_order.total_amount then
            raise exception 'Payment amount does not match the order total';
        end if;

        v_amount := v_order.total_amount;
    elsif p_purpose = 'POINT_TOPUP' then
        if p_order_id is not null then
            raise exception 'Point top-up does not take an order';
        end if;

        if p_amount is null
           or p_amount <> trunc(p_amount)
           or p_amount < 1000
           or p_amount > 1000000
           or mod(p_amount, 1000) <> 0 then
            raise exception
                'Point top-up amount must be 1,000 to 1,000,000 in units of 1,000';
        end if;

        v_amount := p_amount;
    else
        raise exception 'Unsupported payment purpose: %', p_purpose;
    end if;

    insert into public.payments (client_id, purpose, order_id, amount)
    values (p_client_id, p_purpose, p_order_id, v_amount)
    returning * into v_payment;

    return v_payment;
end;
$$;


-- ------------------------------------------------------------
-- complete_payment(client, payment, succeeded, callback, reason)
--
-- Called by the trusted server boundary only after the PG Test
-- service recorded the result for exactly this payment id/amount.
--
-- Idempotent:
--   * the payment row is locked; a SUCCEEDED/FAILED payment is
--     returned unchanged (no second Order transition / credit);
--   * payments_order_succeeded_uidx and point_ledger_payment_unique
--     back this up at the constraint level.
--
-- ORDER_PAYMENT success: the Order must still be PENDING with the
--   same total; it is moved to PAID through the existing
--   admin_transition_order_status() lifecycle and payment_reference
--   is set to the payment id. If the Order is no longer payable the
--   payment is marked FAILED instead.
-- POINT_TOPUP success: one TOPUP ledger entry and balance credit.
-- Failure: payment FAILED; no Order or Point change.
-- ------------------------------------------------------------
create or replace function public.complete_payment(
    p_client_id uuid,
    p_payment_id uuid,
    p_succeeded boolean,
    p_pg_callback_id text default null,
    p_failure_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
    v_order public.orders;
    v_balance bigint;
begin
    if p_client_id is null then
        raise exception 'Authentication required';
    end if;

    if p_succeeded is null then
        raise exception 'Payment result is required';
    end if;

    select p.* into v_payment
    from public.payments p
    where p.id = p_payment_id
      and p.client_id = p_client_id
    for update;

    if v_payment.id is null then
        raise exception 'Payment not found' using errcode = 'P0002';
    end if;

    -- Already completed: never apply side effects twice.
    if v_payment.status <> 'PENDING' then
        return v_payment;
    end if;

    if not p_succeeded then
        update public.payments
           set status = 'FAILED',
               pg_callback_id = p_pg_callback_id,
               failure_reason = coalesce(p_failure_reason, 'PG test payment failed'),
               completed_at = now()
         where id = v_payment.id
        returning * into v_payment;

        return v_payment;
    end if;

    if v_payment.purpose = 'ORDER_PAYMENT' then
        select o.* into v_order
        from public.orders o
        where o.id = v_payment.order_id
          and o.client_id = p_client_id
        for update;

        if v_order.id is null
           or v_order.status <> 'PENDING'
           or v_order.total_amount <> v_payment.amount then
            update public.payments
               set status = 'FAILED',
                   pg_callback_id = p_pg_callback_id,
                   failure_reason = 'Order is no longer payable',
                   completed_at = now()
             where id = v_payment.id
            returning * into v_payment;

            return v_payment;
        end if;

        perform public.admin_transition_order_status(v_order.id, 'PAID');

        update public.orders
           set payment_reference = v_payment.id::text,
               updated_at = now()
         where id = v_order.id;
    else
        insert into public.point_balances (client_id, balance)
        values (p_client_id, 0)
        on conflict (client_id) do nothing;

        update public.point_balances
           set balance = balance + v_payment.amount::bigint
         where client_id = p_client_id
        returning balance into v_balance;

        insert into public.point_ledger (
            client_id, type, amount, balance_after, payment_id
        )
        values (
            p_client_id, 'TOPUP', v_payment.amount::bigint, v_balance, v_payment.id
        );
    end if;

    update public.payments
       set status = 'SUCCEEDED',
           pg_callback_id = p_pg_callback_id,
           failure_reason = null,
           completed_at = now()
     where id = v_payment.id
    returning * into v_payment;

    return v_payment;
end;
$$;


-- Service-role only (Supabase default privileges grant new public
-- functions to anon/authenticated; revoke them explicitly).
revoke all on function public.create_payment(uuid, text, uuid, numeric)
    from public, anon, authenticated;
grant execute on function public.create_payment(uuid, text, uuid, numeric)
    to service_role;

revoke all on function public.complete_payment(uuid, uuid, boolean, text, text)
    from public, anon, authenticated;
grant execute on function public.complete_payment(uuid, uuid, boolean, text, text)
    to service_role;
