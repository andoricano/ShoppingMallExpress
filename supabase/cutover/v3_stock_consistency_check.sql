-- ============================================================
-- Mall v3 cutover: stock consistency check (read-only)
--
-- Returns one row per Ware whose reservation does not match the
-- allocation rows of the Orders that hold reservations, or that
-- breaks 0 <= reserved_stock <= current_stock.
--
--   Expected before the conversion: rows for every Ware with a
--     PENDING/PAID Order (v2 stores the net remainder), or none.
--   Expected after the conversion: NO rows.
--
-- Holding statuses: PENDING and (v2 only) PAID. v3 has no PAID; v2
-- PAID Orders are mapped to PENDING at cutover, and both hold their
-- allocation until the Order enters PROCESSING.
--
-- Run against the target database with psql, e.g. locally:
--   docker exec -i supabase_db_ShoppingEx psql -U postgres -d postgres \
--     < supabase/cutover/v3_stock_consistency_check.sql
-- ============================================================
select
    w.id as ware_id,
    w.current_stock,
    w.reserved_stock,
    coalesce(h.quantity, 0) as expected_reserved_stock
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
   or w.reserved_stock > w.current_stock
   or w.current_stock < 0
order by w.id;
