-- ============================================================
-- Mall v3 - Phase 5: whole-Order Cancel of a PENDING Order
--
-- Source: docs/mall1/v3/PHASES.md (Phase 5),
--         docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md
--         (BR-16, BR-17, BR-26, BR-28, BR-35, BR-36, BR-43;
--          S-12 .. S-15, S-27, S-30, S-32).
--
-- Additive only. The v2 cancel_order() (Client only, unpaid PENDING Order,
-- stock added back to current_stock) is untouched and stays the production
-- path until the v3 cutover (PHASES.md 2.2). The v3 path is a new function
-- for the v3 stock model (B1) and the v3 Payment model.
--
--   cancel_pending_order(order, actor, role, reason)
--     One database transaction:
--       1. the Order goes PENDING -> CANCELLED (whole Order only, BR-36);
--       2. its allocation is released once: reserved_stock down,
--          current_stock unchanged, allocation rows removed (BR-43);
--       3. one ORDER_CANCEL reversal for the full Payment amount is created
--          as PENDING (BR-26, BR-30, BR-32, BR-34);
--       4. who cancelled, and why, is recorded (order_cancellations).
--     The PG call is NOT made here. The caller executes the reversal after
--     the commit (apps/*/lib/payment/reversal.ts), so a slow or failing PG
--     never repeats the cancellation or the release (BR-26).
--
--     Idempotent (BR-17): an already CANCELLED Order returns
--     ALREADY_CANCELLED with the existing reversal id and changes nothing.
--     A repeat, a double click, Client + Admin at the same moment, and a
--     retry after a timeout therefore produce ONE release and ONE reversal.
--     After PROCESSING there is no Cancel (BR-35): the call raises and
--     nothing changes; the Refund domain handles money from then on.
--
-- Decisions inside Phase 5 (implementation; policy stays as approved)
--   DN-12  Actor and reason are recorded in the internal table
--          order_cancellations (Order id primary key, so the FIRST cancel
--          wins and a later or concurrent cancel never overwrites it). It has
--          no Consumer access: the Consumer sees only the status until the
--          Consumer surfaces are aligned (Phase 8). The reason is optional
--          free text of at most 500 characters.
--   DN-19  The functions return machine-readable outcomes only; what the
--          Client sees about reversal progress is a Phase 8 item.
--
-- Lock order: Payment -> Order -> Ware (by id), the same as finalize_order,
-- so a cancel and a finalize can never deadlock.
-- ============================================================

create table public.order_cancellations (
    order_id     uuid                     not null,
    actor_id     uuid,
    actor_role   text                     not null,
    reason       text,
    cancelled_at timestamp with time zone not null default now(),
    constraint order_cancellations_pkey primary key (order_id),
    constraint order_cancellations_order_fk foreign key (order_id)
        references public.orders(id) on delete restrict,
    constraint order_cancellations_actor_fk foreign key (actor_id)
        references auth.users(id) on delete set null,
    constraint order_cancellations_role_valid
        check (actor_role in ('CLIENT', 'ADMIN')),
    constraint order_cancellations_reason_length
        check (reason is null or (btrim(reason) <> '' and char_length(reason) <= 500))
);

-- Internal record: no Consumer access; written by the trusted RPC only.
alter table public.order_cancellations enable row level security;
revoke all on public.order_cancellations from anon, authenticated;


create or replace function public.cancel_pending_order(
    p_order_id   uuid,
    p_actor_id   uuid,
    p_actor_role text,
    p_reason     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment_id uuid;
    v_order public.orders;
    v_payment public.payments;
    v_reason text;
    v_reversal public.payment_reversals;
    v_key text := 'order-cancel:' || p_order_id::text;
begin
    if p_actor_id is null then
        raise exception 'Authentication required';
    end if;

    if p_actor_role is null or p_actor_role not in ('CLIENT', 'ADMIN') then
        raise exception 'Unsupported actor role';
    end if;

    v_reason := nullif(btrim(coalesce(p_reason, '')), '');

    if v_reason is not null and char_length(v_reason) > 500 then
        raise exception 'Cancel reason must be at most 500 characters';
    end if;

    -- Payment first (same order as finalize_order), then the Order.
    select o.payment_id into v_payment_id
    from public.orders o
    where o.id = p_order_id;

    if v_payment_id is not null then
        perform 1
        from public.payments p
        where p.id = v_payment_id
        for no key update;
    end if;

    select o.* into v_order
    from public.orders o
    where o.id = p_order_id
    for update;

    -- A Client only ever sees its own Orders.
    if v_order.id is null
       or (p_actor_role = 'CLIENT' and v_order.client_id <> p_actor_id) then
        raise exception 'Order not found' using errcode = 'P0002';
    end if;

    -- Idempotent: already cancelled -> same final state, no side effect.
    if v_order.status = 'CANCELLED' then
        select r.* into v_reversal
        from public.payment_reversals r
        where r.idempotency_key = v_key;

        return jsonb_build_object(
            'outcome', 'ALREADY_CANCELLED',
            'order_id', v_order.id,
            'reversal_id', v_reversal.id
        );
    end if;

    if v_order.status <> 'PENDING' then
        raise exception 'Only PENDING Orders can be cancelled (status %)', v_order.status;
    end if;

    -- 2. Release the allocation exactly once. Keeps the Order PENDING until
    --    the status update below, in this same transaction.
    perform public.release_order_allocation(v_order.id);

    -- 1. The Order is cancelled.
    update public.orders
       set status = 'CANCELLED'
     where id = v_order.id;

    -- 4. Who and why (the first cancel wins by primary key).
    insert into public.order_cancellations (order_id, actor_id, actor_role, reason)
    values (v_order.id, p_actor_id, p_actor_role, v_reason);

    -- 3. One full-amount reversal for the paid Payment (nothing to reverse for
    --    an Order without a Payment, e.g. a legacy v2 Order).
    if v_payment_id is not null then
        select p.* into v_payment
        from public.payments p
        where p.id = v_payment_id;

        v_reversal := public.create_payment_reversal(
            v_payment.id,
            v_payment.amount,
            'ORDER_CANCEL',
            v_key,
            v_order.id,
            null,
            p_actor_id
        );
    end if;

    return jsonb_build_object(
        'outcome', 'CANCELLED',
        'order_id', v_order.id,
        'reversal_id', v_reversal.id
    );
end;
$$;

revoke all on function public.cancel_pending_order(uuid, uuid, text, text)
    from public, anon, authenticated;
grant execute on function public.cancel_pending_order(uuid, uuid, text, text)
    to service_role;
