-- ============================================================
-- Mall v3 - Phase 9: seller-initiated Refund (DN-46)
--
-- Source: docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md (DN-46, BR-35,
-- BR-37 .. BR-42), PHASES.md Phase 9.
--
-- Additive only. When an Order must be stopped after PROCESSING (a seller
-- failure), Cancel stays refused (BR-35). The money goes back through the
-- ordinary Refund domain: the Admin creates the Refund request on behalf of the
-- Order's Client, and it then follows the normal path (admin_decide_refund:
-- approval + REFUND reversal in one transaction; explicit restock afterwards).
-- Every Refund invariant holds unchanged (status allow-list, cumulative
-- quantity, snapshot pricing, amount limit, Order status not changed).
--
--   admin_create_refund_request(order, items, reason, actor)
--     Trusted server only. Same eligibility and limits as
--     create_refund_request; the request is marked initiated_by = 'ADMIN'.
--     The acting Admin is recorded on the reversal (requested_by) when it is
--     approved.
--
-- Decision recorded here (DN-46, a recommendation for the user's approval):
-- the Admin-created Refund is the seller-failure path; a separate
-- seller-failure workflow is not built.
-- ============================================================

alter table public.refund_requests
    add column initiated_by text not null default 'CLIENT';

alter table public.refund_requests
    add constraint refund_requests_initiated_by_valid
    check (initiated_by in ('CLIENT', 'ADMIN'));


create or replace function public.admin_create_refund_request(
    p_order_id uuid,
    p_items    jsonb,
    p_reason   text,
    p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client uuid;
    v_request uuid;
begin
    if p_actor_id is null then
        raise exception 'Authentication required';
    end if;

    select o.client_id into v_client
    from public.orders o
    where o.id = p_order_id;

    if v_client is null then
        raise exception 'Order not found' using errcode = 'P0002';
    end if;

    -- Same rules and locks as the Client request (allow-list, cumulative limit).
    v_request := public.create_refund_request(v_client, p_order_id, p_items, p_reason);

    update public.refund_requests
       set initiated_by = 'ADMIN'
     where id = v_request;

    return v_request;
end;
$$;

revoke all on function public.admin_create_refund_request(uuid, jsonb, text, uuid)
    from public, anon, authenticated;
grant execute on function public.admin_create_refund_request(uuid, jsonb, text, uuid)
    to service_role;
