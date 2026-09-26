-- ============================================================
-- Mall v3 cutover (Phase 2 part): stock conversion and sellability
--
-- NOT a migration. This file lives outside supabase/migrations on
-- purpose: `supabase db push` applies every pending migration, and
-- this changes the meaning of existing v2 objects. It is applied
-- only at the v3 cutover (docs/mall1/v3/PHASES.md 2.3), on the
-- user's explicit instruction, together with the other v3 runtime
-- switches (Phases 4-8), and only after the Phase 2 migration
-- 20260926140000_v3_phase2_stock_allocation_core.sql is applied.
--
-- Run it inside ONE transaction, e.g.
--   psql --single-transaction -v ON_ERROR_STOP=1 -f <this file>
-- (no BEGIN/COMMIT in this file so that a test harness can wrap it).
--
-- 1. Stock conversion (IN-09)
--    v2: current_stock is the net remainder (allocation decremented it
--        at Order creation, cancel added it back), reserved_stock is 0.
--    v3: current_stock is physical stock; reserved_stock is the
--        quantity held by Orders that have not entered PROCESSING.
--    For every Ware:  reserved = sum(allocations of PENDING/PAID Orders)
--                     current  = old current + reserved
--    PROCESSING/SHIPPED/DELIVERED/CANCELLED Orders are unchanged: their
--    stock is already out of (or back in) the remainder.
--    Guarded: refuses to run when any reserved_stock is not 0 (already
--    converted, or unexpected reservations).
--
-- 2. Sellability
--    get_product_variant_availability() keeps its signature and its
--    Consumer result shape (stock_status AVAILABLE/OUT_OF_STOCK/
--    UNAVAILABLE) but is derived from is_active / is_sold_out instead
--    of stock (BR-18, BR-19). SOLD_OUT is reported as OUT_OF_STOCK
--    until Phase 8 aligns the Consumer contract. Because get_cart,
--    get_product_detail, and get_product_post_detail call it, they
--    follow without being redefined.
--
-- Not included here (other phases' cutover items): replacing
-- create_order_from_cart / cancel_order with the v3 flow, mapping
-- v2 PAID Orders to PENDING, removing legacy paths.
-- ============================================================

do $$
begin
    if exists (select 1 from public.wares where reserved_stock <> 0) then
        raise exception
            'Stock conversion refused: some Ware already has reserved_stock <> 0 (already converted?)';
    end if;
end;
$$;

with held as (
    select a.ware_id, sum(a.quantity)::bigint as quantity
    from public.order_item_ware_allocations a
    join public.order_items oi on oi.id = a.order_item_id
    join public.orders o on o.id = oi.order_id
    where o.status in ('PENDING', 'PAID')
    group by a.ware_id
)
update public.wares w
   set current_stock = w.current_stock + h.quantity,
       reserved_stock = h.quantity,
       updated_at = now()
  from held h
 where h.ware_id = w.id;

do $$
declare
    v_mismatches bigint;
begin
    select count(*) into v_mismatches
    from public.wares w
    left join (
        select a.ware_id, sum(a.quantity)::bigint as quantity
        from public.order_item_ware_allocations a
        join public.order_items oi on oi.id = a.order_item_id
        join public.orders o on o.id = oi.order_id
        where o.status in ('PENDING', 'PAID')
        group by a.ware_id
    ) h on h.ware_id = w.id
    where w.reserved_stock <> coalesce(h.quantity, 0)
       or w.reserved_stock > w.current_stock;

    if v_mismatches > 0 then
        raise exception 'Stock conversion verification failed for % Ware(s)', v_mismatches;
    end if;
end;
$$;

create or replace function public.get_product_variant_availability(
    p_product_variant_id uuid
)
returns table (
    product_variant_id uuid,
    is_available       boolean,
    stock_status       text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select
        s.product_variant_id,
        s.is_available,
        case s.sellability_status
            when 'SOLD_OUT' then 'OUT_OF_STOCK'
            else s.sellability_status
        end as stock_status
    from public.get_product_variant_sellability(p_product_variant_id) s;
$$;
