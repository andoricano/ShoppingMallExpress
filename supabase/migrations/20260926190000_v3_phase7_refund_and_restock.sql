-- ============================================================
-- Mall v3 - Phase 7: Refund and restock
--
-- Source: docs/mall1/v3/PHASES.md (Phase 7),
--         docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md
--         (BR-30, BR-32, BR-34, BR-37 .. BR-43; S-18 .. S-22, S-33 .. S-36).
--
-- Additive only. The v2 request_refund() (deny-list of PENDING/CANCELLED,
-- no row locking) and admin_transition_refund_status() (approval without a
-- reversal) are untouched and stay the production path until the v3 cutover
-- (PHASES.md 2.2); they are retired in the Phase 8 contraction together with
-- restock_order_item(). The v3 path is:
--
--   create_refund_request(client, order, items, reason)     trusted server
--     Refund is possible only for PROCESSING / SHIPPED / DELIVERED (BR-37).
--     Partial Refund per OrderItem quantity, priced at the immutable OrderItem
--     snapshot unit price. The affected OrderItem rows are locked (by id), so
--     the cumulative valid quantity of an OrderItem never exceeds
--     OrderItem.quantity, also under concurrent requests (BR-38). A "valid"
--     request is REQUESTED or APPROVED.
--
--   admin_decide_refund(refund request, decision, actor)    trusted server
--     REQUESTED -> APPROVED and the linked REFUND reversal (PENDING) are created
--     in ONE database transaction; if the reversal row cannot be created (no
--     Payment, amount beyond the payment, ...) the approval is not committed
--     (BR-39). The PG call is made after the commit by the reversal executor;
--     a PG failure never reverts the approval. REQUESTED -> REJECTED creates
--     no reversal and has no Payment or stock effect. Neither touches stock
--     (Policy B, BR-40) or the Order status (BR-41).
--
--   Restock stays admin_restock_refund_item() (v2, migration
--   20260925150000): explicit, original allocation Ware, at most the allocated
--   quantity and at most the refunded quantity, current_stock up. It already
--   matches B1 (BR-40, BR-43); no shortage quantity can be restocked because
--   only allocation rows are eligible, and after PROCESSING those rows are
--   frozen (Phase 6).
--
-- Decisions inside Phase 7 (implementation; policy stays as approved)
--   DN-47  The Refund status set is REQUESTED / APPROVED / REJECTED. COMPLETED
--          and CANCELLED are not used in the initial v3 (no RPC ever set them).
--          A CHECK enforces it for new rows (NOT VALID: rows that already exist
--          are not re-checked; VALIDATE CONSTRAINT is a cutover verification
--          step).
--   DN-44  The Client cannot withdraw a request in the initial v3.
--   DN-43  Approval is all or nothing: the whole requested quantity.
--   DN-45  A repeated decision equal to the current status returns
--          ALREADY_APPROVED / ALREADY_REJECTED (no error, no second reversal:
--          the reversal idempotency key is refund:<id>); the opposite decision
--          on a decided request is refused.
--   DN-27  The refund amount is the sum of snapshot unit price x quantity of
--          the requested items. Discount and shipping are 0 in the initial v3;
--          DN-27 stays open for when they exist.
--   DN-42  No refund window is enforced (as in v2); carried to Phase 9.
--   DN-46  A seller-initiated Refund / seller-failure workflow is not built;
--          carried to Phase 8/9.
--
-- Lock order: Payment -> RefundRequest (approval); OrderItem by id (request).
-- ============================================================

-- DN-47: the status set (new rows only).
alter table public.refund_requests
    add constraint refund_requests_status_v3_valid
    check (status in ('REQUESTED', 'APPROVED', 'REJECTED')) not valid;


-- ------------------------------------------------------------
-- create_refund_request(client, order, items, reason)
--
-- items: [{ "orderItemId": uuid, "quantity": int }]   (no price is accepted)
-- Returns the RefundRequest id.
-- ------------------------------------------------------------
create or replace function public.create_refund_request(
    p_client_id uuid,
    p_order_id  uuid,
    p_items     jsonb,
    p_reason    text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_reason text;
    v_status text;
    v_item jsonb;
    v_index integer := 0;
    v_ids uuid[] := array[]::uuid[];
    v_id uuid;
    v_qty integer;
    v_locked integer;
    v_request_id uuid;
    v_order_quantity integer;
    v_unit_price numeric(14, 2);
    v_previous bigint;
    v_amount numeric(14, 2);
    v_total numeric(14, 2) := 0;
begin
    if p_client_id is null then
        raise exception 'Authentication required';
    end if;

    v_reason := nullif(btrim(coalesce(p_reason, '')), '');

    if v_reason is not null and char_length(v_reason) > 500 then
        raise exception 'Refund reason must be at most 500 characters';
    end if;

    if p_items is null
       or jsonb_typeof(p_items) <> 'array'
       or jsonb_array_length(p_items) = 0
       or jsonb_array_length(p_items) > 100 then
        raise exception 'Refund items are required';
    end if;

    -- Validate the shape first (a malformed request changes nothing).
    for v_item in select value from jsonb_array_elements(p_items)
    loop
        v_index := v_index + 1;

        if jsonb_typeof(v_item) <> 'object' then
            raise exception 'Invalid refund item %', v_index;
        end if;

        begin
            v_id := (v_item ->> 'orderItemId')::uuid;
            v_qty := (v_item ->> 'quantity')::integer;
        exception when others then
            raise exception 'Invalid refund item %', v_index;
        end;

        if v_id is null or v_qty is null or v_qty <= 0 then
            raise exception 'Invalid refund item %', v_index;
        end if;

        if v_id = any (v_ids) then
            raise exception 'Duplicate OrderItem in refund items';
        end if;

        v_ids := v_ids || v_id;
    end loop;

    select o.status into v_status
    from public.orders o
    where o.id = p_order_id
      and o.client_id = p_client_id;

    if v_status is null then
        raise exception 'Order not found' using errcode = 'P0002';
    end if;

    -- Allow-list (BR-37): PENDING uses Cancel; CANCELLED cannot be refunded.
    if v_status not in ('PROCESSING', 'SHIPPED', 'DELIVERED') then
        raise exception 'Order cannot be refunded in status %', v_status;
    end if;

    -- Serialize every request touching these OrderItems (BR-38): lock in id order.
    select count(*) into v_locked
    from (
        select oi.id
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.id = any (v_ids)
        order by oi.id
        for update
    ) locked;

    if v_locked <> cardinality(v_ids) then
        raise exception 'OrderItem does not belong to Order';
    end if;

    insert into public.refund_requests (order_id, client_id, status, reason, requested_amount)
    values (p_order_id, p_client_id, 'REQUESTED', v_reason, 0)
    returning id into v_request_id;

    for v_item in select value from jsonb_array_elements(p_items)
    loop
        v_id := (v_item ->> 'orderItemId')::uuid;
        v_qty := (v_item ->> 'quantity')::integer;

        select oi.quantity, oi.unit_price
          into v_order_quantity, v_unit_price
        from public.order_items oi
        where oi.id = v_id;

        -- Valid = REQUESTED or APPROVED. Read after the locks above (a fresh
        -- statement snapshot), so concurrent requests see each other's rows.
        select coalesce(sum(ri.quantity), 0) into v_previous
        from public.refund_items ri
        join public.refund_requests rr on rr.id = ri.refund_request_id
        where ri.order_item_id = v_id
          and rr.status in ('REQUESTED', 'APPROVED');

        if v_previous + v_qty > v_order_quantity then
            raise exception 'Refund quantity exceeds ordered quantity';
        end if;

        v_amount := v_unit_price * v_qty;

        insert into public.refund_items (refund_request_id, order_item_id, quantity, refund_amount)
        values (v_request_id, v_id, v_qty, v_amount);

        v_total := v_total + v_amount;
    end loop;

    update public.refund_requests
       set requested_amount = v_total,
           updated_at = now()
     where id = v_request_id;

    return v_request_id;
end;
$$;

revoke all on function public.create_refund_request(uuid, uuid, jsonb, text)
    from public, anon, authenticated;
grant execute on function public.create_refund_request(uuid, uuid, jsonb, text)
    to service_role;


-- ------------------------------------------------------------
-- admin_decide_refund(refund request, decision, actor)
--
-- Returns jsonb:
--   { "outcome": "APPROVED" | "REJECTED" | "ALREADY_APPROVED" | "ALREADY_REJECTED",
--     "refund_request_id", "reversal_id" }
-- ------------------------------------------------------------
create or replace function public.admin_decide_refund(
    p_refund_request_id uuid,
    p_decision          text,
    p_actor_id          uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_decision text := upper(btrim(coalesce(p_decision, '')));
    v_order_id uuid;
    v_payment_id uuid;
    v_request public.refund_requests;
    v_key text := 'refund:' || p_refund_request_id::text;
    v_amount numeric(14, 2);
    v_reversal public.payment_reversals;
begin
    if p_actor_id is null then
        raise exception 'Authentication required';
    end if;

    if v_decision not in ('APPROVED', 'REJECTED') then
        raise exception 'Invalid Admin refund decision: %', p_decision;
    end if;

    select rr.order_id into v_order_id
    from public.refund_requests rr
    where rr.id = p_refund_request_id;

    if v_order_id is null then
        raise exception 'RefundRequest % not found', p_refund_request_id
            using errcode = 'P0002';
    end if;

    -- Payment first (the reversal needs it), then the request.
    select coalesce(
               o.payment_id,
               (select p.id from public.payments p
                 where p.order_id = o.id and p.status = 'SUCCEEDED'
                 limit 1)
           )
      into v_payment_id
    from public.orders o
    where o.id = v_order_id;

    if v_payment_id is not null then
        perform 1
        from public.payments p
        where p.id = v_payment_id
        for no key update;
    end if;

    select rr.* into v_request
    from public.refund_requests rr
    where rr.id = p_refund_request_id
    for update;

    -- Idempotent: the same decision again changes nothing (DN-45).
    if v_request.status = v_decision then
        select r.* into v_reversal
        from public.payment_reversals r
        where r.idempotency_key = v_key;

        return jsonb_build_object(
            'outcome', 'ALREADY_' || v_decision,
            'refund_request_id', v_request.id,
            'reversal_id', v_reversal.id
        );
    end if;

    if v_request.status <> 'REQUESTED' then
        raise exception 'RefundRequest % is already %; it cannot become %',
            p_refund_request_id, v_request.status, v_decision;
    end if;

    if v_decision = 'REJECTED' then
        update public.refund_requests
           set status = 'REJECTED',
               processed_at = now(),
               updated_at = now()
         where id = v_request.id;

        return jsonb_build_object(
            'outcome', 'REJECTED',
            'refund_request_id', v_request.id,
            'reversal_id', null
        );
    end if;

    -- APPROVED: the approval and its REFUND reversal are one transaction. If the
    -- reversal cannot be created this raises and the approval is rolled back.
    select coalesce(sum(ri.refund_amount), 0) into v_amount
    from public.refund_items ri
    where ri.refund_request_id = v_request.id;

    if v_payment_id is null then
        raise exception 'Order has no Payment to reverse; the Refund cannot be approved';
    end if;

    if v_amount <= 0 then
        raise exception 'Refund amount must be greater than zero';
    end if;

    update public.refund_requests
       set status = 'APPROVED',
           processed_at = now(),
           updated_at = now()
     where id = v_request.id;

    v_reversal := public.create_payment_reversal(
        v_payment_id,
        v_amount,
        'REFUND',
        v_key,
        v_order_id,
        v_request.id,
        p_actor_id
    );

    return jsonb_build_object(
        'outcome', 'APPROVED',
        'refund_request_id', v_request.id,
        'reversal_id', v_reversal.id
    );
end;
$$;

revoke all on function public.admin_decide_refund(uuid, text, uuid)
    from public, anon, authenticated;
grant execute on function public.admin_decide_refund(uuid, text, uuid)
    to service_role;
