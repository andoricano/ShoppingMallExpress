-- ============================================================
-- Mall v3 - Phase 1: schema and contract foundation
--
-- Source: docs/mall1/v3/PHASES.md (Phase 1),
--         docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md
--         (BR-07, BR-25, BR-29 .. BR-34, BR-45, BR-46; IN-05, IN-10).
--
-- Additive and backward-compatible only. No v2 function is replaced,
-- no existing column changes meaning, and no data is converted.
-- The v2 runtime keeps working unchanged until the v3 cutover.
--
--   1. payments: an ORDER_PAYMENT may exist without an Order (BR-25);
--      unique PG reference.
--   2. orders.payment_id: v3 link to the Payment, at most one Order
--      per Payment (BR-45, IN-10). payments.order_id stays for v2
--      compatibility until the Phase 8 contraction, which decides its
--      fate. Neither direction is confirmed as the permanent model.
--   3. payment_reversals: reversal history of a Payment (BR-29..34).
--   4. product_variants.is_sold_out (BR-46).
--   5. order_item_ware_allocations: allocation total per OrderItem is
--      bounded by OrderItem.quantity (BR-07).
--
-- Pre-apply check for a database that already holds payments:
--   select pg_callback_id, count(*) from public.payments
--   where pg_callback_id is not null
--   group by 1 having count(*) > 1;
-- must return no rows (the unique PG reference index would fail).
-- ============================================================

-- ------------------------------------------------------------
-- 1. payments
-- ------------------------------------------------------------

-- v2: ORDER_PAYMENT requires order_id. v3 Stage 1 records the Payment
-- before any Order exists, so ORDER_PAYMENT may have order_id NULL.
-- POINT_TOPUP still never has an Order. Every v2 row still satisfies
-- the relaxed constraint.
alter table public.payments
    drop constraint payments_target_valid;

alter table public.payments
    add constraint payments_target_valid check (
        purpose = 'ORDER_PAYMENT'
        or (purpose = 'POINT_TOPUP' and order_id is null)
    );

-- One PG reference identifies one Payment. NULL (not yet reported) is
-- allowed any number of times.
create unique index payments_pg_callback_id_uidx
    on public.payments (pg_callback_id)
    where pg_callback_id is not null;


-- ------------------------------------------------------------
-- 2. orders.payment_id
-- ------------------------------------------------------------

alter table public.orders
    add column payment_id uuid;

alter table public.orders
    add constraint orders_payment_fk foreign key (payment_id)
        references public.payments(id) on delete restrict;

-- Exactly one Order per Payment (NULLs are not compared).
alter table public.orders
    add constraint orders_payment_id_unique unique (payment_id);

-- While both directions exist (v2 payments.order_id, v3 orders.payment_id)
-- they must never disagree. The v3 finalize links them in one
-- transaction; these guards make a mismatch impossible to commit.
create or replace function public.check_order_payment_link()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
    v_order public.orders;
begin
    if tg_table_name = 'orders' then
        if new.payment_id is null then
            return new;
        end if;

        select p.* into v_payment
        from public.payments p
        where p.id = new.payment_id;

        if v_payment.id is null then
            return new; -- the foreign key reports the missing Payment
        end if;

        if v_payment.purpose <> 'ORDER_PAYMENT' then
            raise exception 'Only an ORDER_PAYMENT can be linked to an Order'
                using errcode = '23514';
        end if;

        if v_payment.client_id <> new.client_id then
            raise exception 'Payment and Order belong to different clients'
                using errcode = '23514';
        end if;

        if v_payment.order_id is not null and v_payment.order_id <> new.id then
            raise exception 'Payment is already attached to a different Order'
                using errcode = '23514';
        end if;
    else
        -- payments: order_id is being set or changed.
        if new.order_id is null then
            return new;
        end if;

        select o.* into v_order
        from public.orders o
        where o.payment_id = new.id;

        if v_order.id is not null and v_order.id <> new.order_id then
            raise exception 'Payment is already linked to a different Order'
                using errcode = '23514';
        end if;
    end if;

    return new;
end;
$$;

create trigger orders_check_payment_link
    before insert or update of payment_id on public.orders
    for each row execute function public.check_order_payment_link();

create trigger payments_check_order_link
    before insert or update of order_id on public.payments
    for each row execute function public.check_order_payment_link();

revoke all on function public.check_order_payment_link()
    from public, anon, authenticated;


-- ------------------------------------------------------------
-- 3. payment_reversals
--
-- Cancel / refund / reversal history of a Payment. The original
-- payments.status is never changed by a reversal (BR-29). Several
-- reversals may exist per Payment (BR-30).
--
-- Consumer read scope is decided with DN-19 (Phase 5): until then no
-- authenticated/anon access exists. Writes are service-role only.
-- ------------------------------------------------------------

create table public.payment_reversals (
    id                uuid                     not null default gen_random_uuid(),
    payment_id        uuid                     not null,
    order_id          uuid,
    refund_request_id uuid,
    amount            numeric(14, 2)           not null,
    reason_type       text                     not null,
    status            text                     not null default 'PENDING',
    idempotency_key   text                     not null,
    pg_reference      text,
    failure_reason    text,
    created_at        timestamp with time zone not null default now(),
    updated_at        timestamp with time zone not null default now(),
    constraint payment_reversals_pkey primary key (id),
    constraint payment_reversals_payment_fk foreign key (payment_id)
        references public.payments(id) on delete restrict,
    constraint payment_reversals_order_fk foreign key (order_id)
        references public.orders(id) on delete restrict,
    constraint payment_reversals_refund_request_fk foreign key (refund_request_id)
        references public.refund_requests(id) on delete restrict,
    constraint payment_reversals_amount_positive check (amount > 0),
    constraint payment_reversals_reason_type_valid check (
        reason_type in (
            'ORDER_CANCEL',
            'REFUND',
            'FINALIZE_FAILURE',
            'ORPHAN_PAYMENT',
            'MANUAL_RECONCILIATION'
        )
    ),
    constraint payment_reversals_status_valid
        check (status in ('PENDING', 'SUCCEEDED', 'FAILED')),
    constraint payment_reversals_idempotency_key_not_blank
        check (btrim(idempotency_key) <> ''),
    -- A refund reversal is linked to its refund request; no other reason is.
    constraint payment_reversals_refund_link check (
        (reason_type = 'REFUND') = (refund_request_id is not null)
    ),
    -- An Order-cancel reversal is linked to its Order. Finalize-failure and
    -- orphan reversals may have no Order (BR-32).
    constraint payment_reversals_cancel_order_link check (
        reason_type <> 'ORDER_CANCEL' or order_id is not null
    ),
    -- The same business request cannot create a second reversal (BR-32).
    constraint payment_reversals_idempotency_key_unique unique (idempotency_key)
);

create unique index payment_reversals_pg_reference_uidx
    on public.payment_reversals (pg_reference)
    where pg_reference is not null;

create index payment_reversals_payment_idx
    on public.payment_reversals (payment_id);

create index payment_reversals_order_idx
    on public.payment_reversals (order_id)
    where order_id is not null;

create index payment_reversals_refund_request_idx
    on public.payment_reversals (refund_request_id)
    where refund_request_id is not null;

create trigger payment_reversals_set_updated_at
    before update on public.payment_reversals
    for each row execute function public.set_updated_at();

-- BR-34: SUM(amount of PENDING + SUCCEEDED reversals) <= payments.amount.
-- A FAILED reversal frees its amount. The Payment row is locked so two
-- concurrent reversals cannot both fit under the limit. Only a
-- SUCCEEDED Payment can be reversed (BR-29).
create or replace function public.enforce_payment_reversal_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
    v_others numeric(14, 2);
begin
    if tg_op = 'UPDATE' and new.payment_id <> old.payment_id then
        raise exception 'A reversal cannot move to another Payment'
            using errcode = '23514';
    end if;

    select p.* into v_payment
    from public.payments p
    where p.id = new.payment_id
    for no key update;

    if v_payment.id is null then
        return new; -- the foreign key reports the missing Payment
    end if;

    if tg_op = 'INSERT' and v_payment.status <> 'SUCCEEDED' then
        raise exception 'Only a SUCCEEDED Payment can be reversed'
            using errcode = '23514';
    end if;

    if new.status not in ('PENDING', 'SUCCEEDED') then
        return new;
    end if;

    select coalesce(sum(r.amount), 0) into v_others
    from public.payment_reversals r
    where r.payment_id = new.payment_id
      and r.status in ('PENDING', 'SUCCEEDED')
      and r.id <> new.id;

    if v_others + new.amount > v_payment.amount then
        raise exception 'Reversal amount exceeds the original payment amount'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

create trigger payment_reversals_enforce_limit
    before insert or update of amount, status, payment_id on public.payment_reversals
    for each row execute function public.enforce_payment_reversal_limit();

revoke all on function public.enforce_payment_reversal_limit()
    from public, anon, authenticated;

alter table public.payment_reversals enable row level security;

-- No anon/authenticated policy and no grant: service-role only.
revoke all on public.payment_reversals from anon, authenticated;


-- ------------------------------------------------------------
-- 4. product_variants.is_sold_out (BR-46)
--
-- Admin-set explicit state, independent of stock (BR-18). Default
-- false keeps every existing Variant sellable exactly as in v2.
-- v2 RPCs do not read it; v3 checkout/finalize will (Phase 2/4).
-- ------------------------------------------------------------

alter table public.product_variants
    add column is_sold_out boolean not null default false;


-- ------------------------------------------------------------
-- 5. Allocation total per OrderItem <= OrderItem.quantity (BR-07)
--
-- The OrderItem row is locked (FOR NO KEY UPDATE) so concurrent
-- allocations of the same OrderItem are serialized. This does not
-- require full allocation: shortage (quantity - allocated) is allowed.
-- Rows that already exist are not re-validated.
-- ------------------------------------------------------------

create or replace function public.enforce_allocation_within_item_quantity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_quantity integer;
    v_others bigint;
begin
    select oi.quantity into v_quantity
    from public.order_items oi
    where oi.id = new.order_item_id
    for no key update;

    if v_quantity is null then
        return new; -- the foreign key reports the missing OrderItem
    end if;

    select coalesce(sum(a.quantity), 0) into v_others
    from public.order_item_ware_allocations a
    where a.order_item_id = new.order_item_id
      and a.id <> new.id;

    if v_others + new.quantity > v_quantity then
        raise exception 'Allocated quantity exceeds the OrderItem quantity'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

create trigger order_item_ware_allocations_enforce_quantity
    before insert or update of quantity, order_item_id
    on public.order_item_ware_allocations
    for each row execute function public.enforce_allocation_within_item_quantity();

revoke all on function public.enforce_allocation_within_item_quantity()
    from public, anon, authenticated;
