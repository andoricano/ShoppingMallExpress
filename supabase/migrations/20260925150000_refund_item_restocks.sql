-- ============================================================
-- Mall v2
-- Refund restock confirmation (Admin, internal only)
--
-- Contract (docs/mall1/v2/PHASES.md, Phase 8 Refund stock policy B;
-- docs/mall1/v2/product-schema.md section 13):
--
--   Refund APPROVED never changes Ware stock by itself. After the
--   returned goods are actually confirmed, an Admin restocks the
--   refunded quantity explicitly:
--
--     refund_item_restocks
--       One row per restock action of a refund item into one Ware.
--       Internal only: RLS is enabled and no anon/authenticated
--       policy or privilege exists. Consumers never see restock or
--       Ware information; refund_items (owner RLS) is unchanged.
--
--     admin_restock_refund_item(refund, refund item, ware, qty)
--       Service-role-only, SECURITY DEFINER. In one transaction:
--         * the RefundRequest must be APPROVED,
--         * the refund item must belong to that RefundRequest,
--         * the Ware must be one of the OrderItem's original
--           order_item_ware_allocations,
--         * cumulative restock per refund item <= refund_items.quantity,
--         * cumulative restock per (OrderItem, Ware) across all its
--           refund items <= the allocation quantity of that Ware,
--         * the Ware row is locked and current_stock is increased,
--         * the restock record is written.
--       Concurrent or repeated calls serialize on the refund item and
--       the allocation row, then re-check the cumulative limits, so a
--       refund item can never be restocked beyond what was refunded
--       and a Ware never beyond what was deducted from it.
--
--   admin_transition_refund_status() additionally stamps
--   refund_requests.processed_at when the request is APPROVED or
--   REJECTED (REQUESTED rows keep it NULL). Signature, statuses and
--   errors are unchanged.
--
--   restock_order_item() is intentionally left untouched. It keeps
--   no restock record and no refund linkage; no application uses it
--   and the Refund flow must use admin_restock_refund_item().
-- ============================================================

-- ------------------------------------------------------------
-- refund_item_restocks
-- ------------------------------------------------------------

create table public.refund_item_restocks (
    id              uuid                     not null default gen_random_uuid(),
    refund_item_id  uuid                     not null,
    ware_id         uuid                     not null,
    quantity        bigint                   not null,
    created_at      timestamp with time zone not null default now(),
    constraint refund_item_restocks_pkey primary key (id),
    constraint refund_item_restocks_refund_item_fk foreign key (refund_item_id)
        references public.refund_items(id) on delete restrict,
    constraint refund_item_restocks_ware_fk foreign key (ware_id)
        references public.wares(id) on delete restrict,
    constraint refund_item_restocks_quantity_positive check (quantity > 0)
);

create index refund_item_restocks_refund_item_idx
    on public.refund_item_restocks (refund_item_id);

create index refund_item_restocks_ware_idx
    on public.refund_item_restocks (ware_id);

-- Internal only: no policy for any client role, and no table
-- privilege either. service_role (trusted server boundary) bypasses RLS.
alter table public.refund_item_restocks enable row level security;

revoke all on table public.refund_item_restocks
    from public, anon, authenticated;


-- ------------------------------------------------------------
-- admin_restock_refund_item(refund, refund item, ware, quantity)
-- ------------------------------------------------------------

create or replace function public.admin_restock_refund_item (
    p_refund_request_id uuid,
    p_refund_item_id    uuid,
    p_ware_id           uuid,
    p_quantity          bigint
)
    returns public.refund_item_restocks
    language plpgsql
    security definer
    set search_path to 'pg_catalog', 'public'
    as $function$
declare
    v_status              text;
    v_order_item_id       uuid;
    v_refund_quantity     integer;
    v_allocated           bigint;
    v_item_restocked      bigint;
    v_pair_restocked      bigint;
    v_restock             public.refund_item_restocks;
begin
    if p_refund_request_id is null
       or p_refund_item_id is null
       or p_ware_id is null then

        raise exception
            'RefundRequest, RefundItem and Ware ids are required';
    end if;

    if p_quantity is null or p_quantity <= 0 then
        raise exception
            'Restock quantity must be positive';
    end if;


    -- Status is terminal once APPROVED/REJECTED; a shared lock only
    -- orders this call after a concurrent status transition.
    select rr.status
      into v_status
    from public.refund_requests rr
    where rr.id = p_refund_request_id
    for share;

    if not found then
        raise exception
            'RefundRequest % not found',
            p_refund_request_id
            using errcode = 'P0002';
    end if;

    if v_status <> 'APPROVED' then
        raise exception
            'RefundRequest % must be APPROVED to restock (current status: %)',
            p_refund_request_id,
            v_status;
    end if;


    -- Serializes restocks of the same refund item.
    select ri.order_item_id,
           ri.quantity
      into v_order_item_id,
           v_refund_quantity
    from public.refund_items ri
    where ri.id = p_refund_item_id
      and ri.refund_request_id = p_refund_request_id
    for update;

    if not found then
        raise exception
            'RefundItem % does not belong to RefundRequest %',
            p_refund_item_id,
            p_refund_request_id
            using errcode = 'P0002';
    end if;


    -- Serializes restocks of the same (OrderItem, Ware) across every
    -- refund item of that OrderItem.
    select oiwa.quantity
      into v_allocated
    from public.order_item_ware_allocations oiwa
    where oiwa.order_item_id = v_order_item_id
      and oiwa.ware_id = p_ware_id
    for update;

    if not found then
        raise exception
            'Ware % is not an allocated Ware of the refunded OrderItem',
            p_ware_id;
    end if;


    -- Limits are read after the locks above (fresh statement snapshot),
    -- so concurrent restocks see each other's committed rows.
    select coalesce(sum(r.quantity), 0)
      into v_item_restocked
    from public.refund_item_restocks r
    where r.refund_item_id = p_refund_item_id;

    if v_item_restocked + p_quantity > v_refund_quantity then
        raise exception
            'Restock quantity exceeds refunded quantity (refunded %, already restocked %, requested %)',
            v_refund_quantity,
            v_item_restocked,
            p_quantity;
    end if;

    select coalesce(sum(r.quantity), 0)
      into v_pair_restocked
    from public.refund_item_restocks r
    join public.refund_items ri
      on ri.id = r.refund_item_id
    where ri.order_item_id = v_order_item_id
      and r.ware_id = p_ware_id;

    if v_pair_restocked + p_quantity > v_allocated then
        raise exception
            'Restock quantity exceeds the Ware allocation of the OrderItem (allocated %, already restocked %, requested %)',
            v_allocated,
            v_pair_restocked,
            p_quantity;
    end if;


    perform 1
    from public.wares w
    where w.id = p_ware_id
    for update;

    if not found then
        raise exception
            'Ware % not found',
            p_ware_id
            using errcode = 'P0002';
    end if;

    update public.wares
       set current_stock = current_stock + p_quantity,
           updated_at = now()
     where id = p_ware_id;

    insert into public.refund_item_restocks (
        refund_item_id,
        ware_id,
        quantity
    )
    values (
        p_refund_item_id,
        p_ware_id,
        p_quantity
    )
    returning *
      into v_restock;

    return v_restock;
end;
$function$;

-- Supabase default privileges grant EXECUTE on new public functions to
-- anon and authenticated; remove them explicitly.
revoke all on function public.admin_restock_refund_item(uuid, uuid, uuid, bigint)
    from public, anon, authenticated;

grant execute on function public.admin_restock_refund_item(uuid, uuid, uuid, bigint)
    to service_role;


-- ------------------------------------------------------------
-- admin_transition_refund_status(): stamp processed_at
--
-- Same signature and parameter names as the baseline (privileges are
-- preserved by CREATE OR REPLACE and remain service_role-only).
-- The only change is processed_at = now() on APPROVED/REJECTED.
-- ------------------------------------------------------------

create or replace function public.admin_transition_refund_status (
    p_refund_request_id uuid,
    p_status            text
)
    returns public.refund_requests
    language plpgsql
    security definer
    set search_path to 'pg_catalog', 'public'
    as $function$
declare
    v_refund public.refund_requests;
    v_target_status text;
begin
    if p_refund_request_id is null then
        raise exception 'RefundRequest id is required';
    end if;

    if p_status is null then
        raise exception 'Refund status is required';
    end if;

    v_target_status := upper(btrim(p_status));

    if v_target_status not in (
        'APPROVED',
        'REJECTED'
    ) then
        raise exception
            'Invalid Admin refund status: %. Allowed statuses are APPROVED or REJECTED',
            p_status;
    end if;


    select rr.*
      into v_refund
    from public.refund_requests rr
    where rr.id = p_refund_request_id
    for update;

    if not found then
        raise exception
            'RefundRequest % not found',
            p_refund_request_id;
    end if;


    if v_refund.status <> 'REQUESTED' then
        raise exception
            'RefundRequest % cannot transition from % to %',
            p_refund_request_id,
            v_refund.status,
            v_target_status;
    end if;


    update public.refund_requests
       set status = v_target_status,
           processed_at = now(),
           updated_at = now()
     where id = p_refund_request_id
     returning *
      into v_refund;


    return v_refund;
end;
$function$;
