-- ============================================================
-- Mall v3 - Phase 6: Admin fulfillment (lifecycle + allocation gate)
--
-- Source: docs/mall1/v3/PHASES.md (Phase 6),
--         docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md
--         (BR-12 .. BR-15, BR-24, BR-28, BR-35, BR-42, BR-43;
--          S-16, S-17, S-28, S-31, S-37; T-13 .. T-16).
--
-- Additive only. The v2 admin_transition_order_status() (which still has the
-- manual PENDING -> PAID step and no allocation gate) is untouched and stays
-- the production path until the v3 cutover (PHASES.md 2.2).
--
--   admin_advance_order(order, next_status)
--     PENDING -> PROCESSING   only with full allocation; consumes the
--                             reservation (current_stock and reserved_stock
--                             both go down by the allocated quantity), and
--                             needs payment evidence (BR-24)
--     PROCESSING -> SHIPPED
--     SHIPPED -> DELIVERED
--     One step forward at a time. There is no PAID step and no cancel here
--     (Cancel is cancel_pending_order, PENDING only).
--
--   get_orders_shortage(order ids, only short, limit)
--     Admin list read model: ordered / allocated / shortage per Order (BR-12).
--     The per-item view is get_order_shortage (Phase 2).
--
--   A guard trigger: once an Order is PROCESSING, SHIPPED or DELIVERED its
--   allocation rows cannot be deleted or decreased, by any path (BR-42).
--
-- Decisions inside Phase 6 (implementation; policy stays as approved)
--   DN-14  Only the trusted server (service_role, from the Admin Route
--          Handlers) performs the transitions. A request for the status the
--          Order already has returns UNCHANGED (an Admin double click never
--          consumes twice and never shows a transition error); any other
--          step (skipping ahead, going back, PAID, CANCELLED) is refused.
--          SHIPPED and DELIVERED need no condition beyond the previous
--          status (full allocation is already guaranteed at PROCESSING).
--   DN-02  The Admin additional allocation reuses the Phase 2 functions
--          allocate_order_item_stock / allocate_order_stock: they take what
--          is currently available (possibly nothing, never an error), never
--          take stock held by another Order, and never allocate
--          automatically. Which Order gets stock is the Admin's choice, one
--          Order or one OrderItem at a time; a newer Order may take the
--          stock first (BR-28). No new function is needed.
--   DN-04  No automatic PENDING expiry in the initial v3: a PENDING Order is
--          an already-paid Order the seller processes or cancels.
--
-- Lock order: Payment -> Order -> Ware (by id), as in finalize_order and
-- cancel_pending_order, so a transition, a cancel, and a finalize cannot
-- deadlock. The Order row lock also serializes a transition against a
-- concurrent cancel: exactly one of them wins.
-- ============================================================

-- ------------------------------------------------------------
-- No allocation decrease after PROCESSING (BR-42)
-- ------------------------------------------------------------
create or replace function public.enforce_allocation_frozen_after_processing()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_status text;
begin
    select o.status into v_status
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = old.order_item_id;

    if v_status in ('PROCESSING', 'SHIPPED', 'DELIVERED')
       and (
           tg_op = 'DELETE'
           or new.quantity < old.quantity
           or new.order_item_id is distinct from old.order_item_id
           or new.ware_id is distinct from old.ware_id
       ) then
        raise exception
            'Allocation of an Order in status % cannot be decreased or removed', v_status
            using errcode = '23514';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$$;

create trigger order_item_ware_allocations_freeze_after_processing
    before update or delete on public.order_item_ware_allocations
    for each row execute function public.enforce_allocation_frozen_after_processing();

revoke all on function public.enforce_allocation_frozen_after_processing()
    from public, anon, authenticated;


-- ------------------------------------------------------------
-- admin_advance_order(order, next_status)
-- ------------------------------------------------------------
create or replace function public.admin_advance_order(
    p_order_id    uuid,
    p_next_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_next text := upper(btrim(coalesce(p_next_status, '')));
    v_payment_id uuid;
    v_order public.orders;
begin
    if v_next not in ('PROCESSING', 'SHIPPED', 'DELIVERED') then
        raise exception 'Unsupported target Order status: %', p_next_status;
    end if;

    -- Payment evidence: the v3 link, or a succeeded v2-direction Payment.
    select coalesce(
               o.payment_id,
               (select p.id from public.payments p
                 where p.order_id = o.id and p.status = 'SUCCEEDED'
                 limit 1)
           )
      into v_payment_id
    from public.orders o
    where o.id = p_order_id;

    -- Payment first (same order as finalize/cancel), then the Order.
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

    if v_order.id is null then
        raise exception 'Order not found' using errcode = 'P0002';
    end if;

    -- Idempotent: already in the requested status.
    if v_order.status = v_next then
        return jsonb_build_object(
            'outcome', 'UNCHANGED',
            'order_id', v_order.id,
            'status', v_order.status
        );
    end if;

    if not (
        (v_order.status = 'PENDING'    and v_next = 'PROCESSING')
        or (v_order.status = 'PROCESSING' and v_next = 'SHIPPED')
        or (v_order.status = 'SHIPPED'    and v_next = 'DELIVERED')
    ) then
        raise exception 'Invalid Order status transition: % -> %', v_order.status, v_next;
    end if;

    if v_next = 'PROCESSING' then
        -- No default path advances an Order without payment evidence (BR-24).
        if v_payment_id is null
           or not exists (
               select 1 from public.payments p
               where p.id = v_payment_id and p.status = 'SUCCEEDED'
           ) then
            raise exception 'Order has no succeeded Payment; it cannot enter PROCESSING';
        end if;

        -- Full allocation gate + reservation consume, exactly once (BR-15, BR-43).
        -- Raises while any OrderItem still has unallocated quantity.
        perform public.consume_order_allocation(v_order.id);
    end if;

    update public.orders
       set status = v_next
     where id = v_order.id;

    return jsonb_build_object(
        'outcome', 'TRANSITIONED',
        'order_id', v_order.id,
        'status', v_next
    );
end;
$$;

revoke all on function public.admin_advance_order(uuid, text)
    from public, anon, authenticated;
grant execute on function public.admin_advance_order(uuid, text)
    to service_role;


-- ------------------------------------------------------------
-- get_orders_shortage(order ids, only short, limit)   Admin read model
--
-- Per Order: ordered, allocated, and shortage quantity (BR-8, BR-12). With
-- no ids it lists PENDING Orders (the only ones that can hold shortage),
-- oldest first. Internal: never exposed to Consumers.
-- ------------------------------------------------------------
create or replace function public.get_orders_shortage(
    p_order_ids  uuid[]  default null,
    p_only_short boolean default false,
    p_limit      integer default 200
)
returns table (
    order_id           uuid,
    order_status       text,
    ordered_quantity   bigint,
    allocated_quantity bigint,
    shortage_quantity  bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    with per_item as (
        select
            oi.order_id,
            oi.quantity::bigint as ordered,
            coalesce(sum(a.quantity), 0)::bigint as allocated
        from public.order_items oi
        left join public.order_item_ware_allocations a on a.order_item_id = oi.id
        group by oi.id, oi.order_id, oi.quantity
    ),
    per_order as (
        select
            o.id,
            o.status,
            o.ordered_at,
            sum(pi.ordered)::bigint as ordered,
            sum(pi.allocated)::bigint as allocated
        from public.orders o
        join per_item pi on pi.order_id = o.id
        where (p_order_ids is not null and o.id = any (p_order_ids))
           or (p_order_ids is null and o.status = 'PENDING')
        group by o.id, o.status, o.ordered_at
    )
    select
        po.id,
        po.status,
        po.ordered,
        po.allocated,
        (po.ordered - po.allocated)::bigint
    from per_order po
    where not coalesce(p_only_short, false) or po.ordered > po.allocated
    order by po.ordered_at, po.id
    limit greatest(1, least(coalesce(p_limit, 200), 1000));
$$;

revoke all on function public.get_orders_shortage(uuid[], boolean, integer)
    from public, anon, authenticated;
grant execute on function public.get_orders_shortage(uuid[], boolean, integer)
    to service_role;
