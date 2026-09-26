-- ============================================================
-- Mall v3 - Phase 2: stock, allocation, and sellability core
--
-- Source: docs/mall1/v3/PHASES.md (Phase 2),
--         docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md
--         (BR-06 .. BR-12, BR-15, BR-17, BR-18, BR-19, BR-28,
--          BR-43, BR-46, BR-47, BR-48; IN-09).
--
-- Additive only. No existing function is replaced and no existing
-- data changes meaning. The v2 runtime (create_order_from_cart,
-- cancel_order, get_product_variant_availability, ...) keeps its v2
-- behavior until the v3 cutover (PHASES.md 2.2 / 2.3).
--
-- Stock model B1 (BR-43)
--   wares.current_stock  physical stock, never negative
--   wares.reserved_stock quantity held by allocations of PENDING Orders
--   0 <= reserved_stock <= current_stock   (already a table CHECK)
--   available = current_stock - reserved_stock
--
--   allocate   reserved_stock up      (Stage 2 / Admin additional allocation)
--   release    reserved_stock down    (PENDING cancel)
--   consume    both down              (entering PROCESSING)
--   restock    current_stock up       (existing adjust_ware_stock and the
--                                      refund restock path; both refuse to go
--                                      below reserved_stock)
--
-- New objects
--   get_product_variant_sellability(variant)   Consumer-safe, stock-free
--   admin_set_variant_sold_out(variant, bool)  trusted server only
--   allocate_order_item_stock(order_item)      trusted server only
--   allocate_order_stock(order)                trusted server only
--   release_order_allocation(order)            trusted server only
--   consume_order_allocation(order)            trusted server only
--   get_order_shortage(order)                  trusted server only (Admin)
--
-- Lock order (everywhere): Order -> OrderItem -> Ware (by id).
-- Existing Wares/Orders are not converted here. The conversion of v2
-- stock values and the switch of get_product_variant_availability
-- are cutover items: supabase/cutover/v3_stock_and_sellability.sql
-- (deliberately outside supabase/migrations).
--
-- Decision recorded here (DN-25, implementation decision inside
-- Phase 2): the Consumer sellability status has no LOW_STOCK value.
-- A low-stock hint would reveal stock levels (BR-20). The values are
-- AVAILABLE | SOLD_OUT | UNAVAILABLE.
-- ============================================================

-- ------------------------------------------------------------
-- Sellability (BR-18, BR-19, BR-46, BR-47)
--
-- Stock is never read. Sellable = Variant active, Product active,
-- and not explicitly sold out. Post publication is enforced by the
-- callers that only expose published posts (list/detail RPCs).
-- A Variant without a linked Ware is sellable (BR-47).
-- ------------------------------------------------------------
create or replace function public.get_product_variant_sellability(
    p_product_variant_id uuid
)
returns table (
    product_variant_id uuid,
    is_available       boolean,
    sellability_status text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select
        pv.id,
        (pv.is_active and p.is_active and not pv.is_sold_out) as is_available,
        case
            when not pv.is_active or not p.is_active then 'UNAVAILABLE'
            when pv.is_sold_out then 'SOLD_OUT'
            else 'AVAILABLE'
        end as sellability_status
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = p_product_variant_id;
$$;

revoke all on function public.get_product_variant_sellability(uuid) from public;
grant execute on function public.get_product_variant_sellability(uuid)
    to anon, authenticated, service_role;


-- ------------------------------------------------------------
-- admin_set_variant_sold_out(variant, is_sold_out)
--
-- Explicit Admin-decided state (BR-19, BR-46). Independent of stock
-- and of is_active.
-- ------------------------------------------------------------
create or replace function public.admin_set_variant_sold_out(
    p_product_variant_id uuid,
    p_is_sold_out boolean
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    if p_is_sold_out is null then
        raise exception 'Sold-out state is required';
    end if;

    update public.product_variants
       set is_sold_out = p_is_sold_out,
           updated_at = now()
     where id = p_product_variant_id;

    if not found then
        raise exception 'ProductVariant % does not exist', p_product_variant_id
            using errcode = 'P0002';
    end if;

    return p_is_sold_out;
end;
$$;

revoke all on function public.admin_set_variant_sold_out(uuid, boolean)
    from public, anon, authenticated;
grant execute on function public.admin_set_variant_sold_out(uuid, boolean)
    to service_role;


-- ------------------------------------------------------------
-- allocate_order_item_stock(order_item)
--
-- Reserves what can currently be secured for the OrderItem (BR-09):
-- linked, active Wares in active Warehouses are taken in a
-- deterministic order (by Ware id, BR-48); each takes at most its
-- available stock (current_stock - reserved_stock). The rest stays
-- shortage (unallocated). A Variant without a linked Ware allocates
-- nothing (BR-47). Never raises for insufficient stock (BR-04, BR-11).
--
-- Used for Stage 2 allocation and for a later Admin additional
-- allocation: it only tops up what is still unallocated. It never
-- takes stock that is already reserved by another Order (BR-10).
-- Only a PENDING Order can hold allocation (BR-43).
--
-- Returns the quantity newly allocated by this call.
-- ------------------------------------------------------------
create or replace function public.allocate_order_item_stock(
    p_order_item_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_order_id uuid;
    v_status text;
    v_variant_id uuid;
    v_quantity integer;
    v_allocated bigint;
    v_remaining bigint;
    v_ware record;
    v_available bigint;
    v_take bigint;
    v_total bigint := 0;
begin
    select oi.order_id
      into v_order_id
    from public.order_items oi
    where oi.id = p_order_item_id;

    if v_order_id is null then
        raise exception 'OrderItem % does not exist', p_order_item_id
            using errcode = 'P0002';
    end if;

    -- Order -> OrderItem -> Ware. FOR SHARE keeps a concurrent status
    -- change (PROCESSING, CANCELLED) from interleaving with the allocation.
    select o.status
      into v_status
    from public.orders o
    where o.id = v_order_id
    for share;

    if v_status <> 'PENDING' then
        raise exception 'Only a PENDING Order can hold allocation (status %)', v_status;
    end if;

    select oi.product_variant_id, oi.quantity
      into v_variant_id, v_quantity
    from public.order_items oi
    where oi.id = p_order_item_id
    for no key update;

    select coalesce(sum(a.quantity), 0)
      into v_allocated
    from public.order_item_ware_allocations a
    where a.order_item_id = p_order_item_id;

    v_remaining := v_quantity - v_allocated;

    if v_remaining <= 0 then
        return 0;
    end if;

    for v_ware in
        select w.id
        from public.product_variant_wares pvw
        join public.wares w on w.id = pvw.ware_id
        join public.warehouses wh on wh.id = w.warehouse_id
        where pvw.product_variant_id = v_variant_id
          and w.is_active = true
          and wh.is_active = true
        order by w.id
        for update of w
    loop
        exit when v_remaining <= 0;

        -- Re-read under the lock: this is the authoritative value.
        select greatest(w.current_stock - w.reserved_stock, 0)
          into v_available
        from public.wares w
        where w.id = v_ware.id;

        v_take := least(v_remaining, v_available);

        if v_take > 0 then
            update public.wares
               set reserved_stock = reserved_stock + v_take,
                   updated_at = now()
             where id = v_ware.id;

            insert into public.order_item_ware_allocations (
                order_item_id, ware_id, quantity
            )
            values (p_order_item_id, v_ware.id, v_take)
            on conflict (order_item_id, ware_id)
            do update set quantity =
                public.order_item_ware_allocations.quantity + excluded.quantity;

            v_remaining := v_remaining - v_take;
            v_total := v_total + v_take;
        end if;
    end loop;

    return v_total;
end;
$$;

revoke all on function public.allocate_order_item_stock(uuid)
    from public, anon, authenticated;
grant execute on function public.allocate_order_item_stock(uuid)
    to service_role;


-- ------------------------------------------------------------
-- allocate_order_stock(order)
--
-- Allocates every OrderItem of a PENDING Order in a deterministic
-- order (creation time, id). Returns the total newly allocated.
-- ------------------------------------------------------------
create or replace function public.allocate_order_stock(
    p_order_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_status text;
    v_item record;
    v_total bigint := 0;
begin
    select o.status
      into v_status
    from public.orders o
    where o.id = p_order_id
    for share;

    if v_status is null then
        raise exception 'Order % does not exist', p_order_id
            using errcode = 'P0002';
    end if;

    if v_status <> 'PENDING' then
        raise exception 'Only a PENDING Order can hold allocation (status %)', v_status;
    end if;

    for v_item in
        select oi.id
        from public.order_items oi
        where oi.order_id = p_order_id
        order by oi.created_at, oi.id
    loop
        v_total := v_total + public.allocate_order_item_stock(v_item.id);
    end loop;

    return v_total;
end;
$$;

revoke all on function public.allocate_order_stock(uuid)
    from public, anon, authenticated;
grant execute on function public.allocate_order_stock(uuid)
    to service_role;


-- ------------------------------------------------------------
-- release_order_allocation(order)
--
-- Releases the allocation of a PENDING Order: reserved_stock goes
-- down, current_stock is unchanged (BR-43), and the allocation rows
-- are removed so that BR-08 (shortage = quantity - allocated) stays
-- true. Idempotent (BR-17): once released there is nothing left to
-- release. A CANCELLED Order is a no-op (returns 0). After
-- PROCESSING there is no allocation decrease path (BR-42).
--
-- The caller (Phase 5 cancel) calls this while the Order is still
-- PENDING and then sets CANCELLED in the same transaction.
-- Returns the quantity released.
-- ------------------------------------------------------------
create or replace function public.release_order_allocation(
    p_order_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_status text;
    v_ware record;
    v_reserved bigint;
    v_total bigint := 0;
begin
    select o.status
      into v_status
    from public.orders o
    where o.id = p_order_id
    for update;

    if v_status is null then
        raise exception 'Order % does not exist', p_order_id
            using errcode = 'P0002';
    end if;

    if v_status = 'CANCELLED' then
        return 0;
    end if;

    if v_status <> 'PENDING' then
        raise exception 'Allocation of an Order in status % cannot be released', v_status;
    end if;

    for v_ware in
        select a.ware_id, sum(a.quantity)::bigint as quantity
        from public.order_item_ware_allocations a
        join public.order_items oi on oi.id = a.order_item_id
        where oi.order_id = p_order_id
        group by a.ware_id
        order by a.ware_id
    loop
        select w.reserved_stock
          into v_reserved
        from public.wares w
        where w.id = v_ware.ware_id
        for update;

        if v_reserved < v_ware.quantity then
            raise exception
                'Reserved stock of Ware % is below the allocation being released',
                v_ware.ware_id;
        end if;

        update public.wares
           set reserved_stock = reserved_stock - v_ware.quantity,
               updated_at = now()
         where id = v_ware.ware_id;

        v_total := v_total + v_ware.quantity;
    end loop;

    delete from public.order_item_ware_allocations a
    using public.order_items oi
    where oi.id = a.order_item_id
      and oi.order_id = p_order_id;

    return v_total;
end;
$$;

revoke all on function public.release_order_allocation(uuid)
    from public, anon, authenticated;
grant execute on function public.release_order_allocation(uuid)
    to service_role;


-- ------------------------------------------------------------
-- consume_order_allocation(order)
--
-- Consumes the reservation when an Order enters PROCESSING (BR-43):
-- current_stock and reserved_stock both go down by the allocated
-- quantity. Allocation rows stay (refund restock is limited to
-- them, BR-40).
--
-- Gate (BR-15): every OrderItem must be fully allocated.
--
-- The Order must be PENDING and the caller (Phase 6 transition) must
-- set PROCESSING in the same transaction; the Order row stays locked
-- until then, so the consumption cannot run twice for one Order.
-- Returns the quantity consumed.
-- ------------------------------------------------------------
create or replace function public.consume_order_allocation(
    p_order_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_status text;
    v_short bigint;
    v_ware record;
    v_reserved bigint;
    v_total bigint := 0;
begin
    select o.status
      into v_status
    from public.orders o
    where o.id = p_order_id
    for update;

    if v_status is null then
        raise exception 'Order % does not exist', p_order_id
            using errcode = 'P0002';
    end if;

    if v_status <> 'PENDING' then
        raise exception 'Only a PENDING Order can consume its allocation (status %)', v_status;
    end if;

    select count(*)
      into v_short
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.quantity > coalesce((
            select sum(a.quantity)
            from public.order_item_ware_allocations a
            where a.order_item_id = oi.id
      ), 0);

    if v_short > 0 then
        raise exception 'Order has unallocated quantity; it cannot enter PROCESSING';
    end if;

    for v_ware in
        select a.ware_id, sum(a.quantity)::bigint as quantity
        from public.order_item_ware_allocations a
        join public.order_items oi on oi.id = a.order_item_id
        where oi.order_id = p_order_id
        group by a.ware_id
        order by a.ware_id
    loop
        select w.reserved_stock
          into v_reserved
        from public.wares w
        where w.id = v_ware.ware_id
        for update;

        if v_reserved < v_ware.quantity then
            raise exception
                'Reserved stock of Ware % is below the allocation being consumed',
                v_ware.ware_id;
        end if;

        update public.wares
           set current_stock = current_stock - v_ware.quantity,
               reserved_stock = reserved_stock - v_ware.quantity,
               updated_at = now()
         where id = v_ware.ware_id;

        v_total := v_total + v_ware.quantity;
    end loop;

    return v_total;
end;
$$;

revoke all on function public.consume_order_allocation(uuid)
    from public, anon, authenticated;
grant execute on function public.consume_order_allocation(uuid)
    to service_role;


-- ------------------------------------------------------------
-- get_order_shortage(order)
--
-- Admin read model (BR-12): per OrderItem, quantity, allocated, and
-- shortage. Shortage is computed from the allocation rows (BR-08),
-- never stored. Never exposed to Consumers.
-- ------------------------------------------------------------
create or replace function public.get_order_shortage(
    p_order_id uuid
)
returns table (
    order_item_id      uuid,
    quantity           integer,
    allocated_quantity bigint,
    shortage_quantity  bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select
        oi.id,
        oi.quantity,
        coalesce(sum(a.quantity), 0)::bigint,
        (oi.quantity - coalesce(sum(a.quantity), 0))::bigint
    from public.order_items oi
    left join public.order_item_ware_allocations a on a.order_item_id = oi.id
    where oi.order_id = p_order_id
    group by oi.id, oi.quantity, oi.created_at
    order by oi.created_at, oi.id;
$$;

revoke all on function public.get_order_shortage(uuid)
    from public, anon, authenticated;
grant execute on function public.get_order_shortage(uuid)
    to service_role;
