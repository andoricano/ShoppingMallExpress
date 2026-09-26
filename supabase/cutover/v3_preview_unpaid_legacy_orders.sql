-- ============================================================
-- Mall v3 cutover: READ-ONLY preview of the unpaid legacy Orders
--
-- Shows exactly what supabase/cutover/v3_resolve_unpaid_legacy_orders.sql would
-- cancel (decision #1) and how much stock would return to which Ware, BEFORE
-- anything is applied. Uses v2 tables only, one statement per result set, no
-- writes. Run it with a read-only session (docs/mall1/v3/PRECHECK.md).
--
-- The selection rule is the same as the resolve script:
--   Order status PENDING or PAID and no SUCCEEDED Payment for it.
-- Nothing is paid, created, or invented for these Orders.
-- ============================================================

-- 1. Orders and their items (order number, status, quantities, allocation)
select o.order_number,
       o.status,
       o.ordered_at,
       oi.product_name_snapshot as product,
       oi.variant_label_snapshot as variant,
       oi.quantity as ordered_quantity,
       coalesce((select sum(a.quantity) from public.order_item_ware_allocations a where a.order_item_id = oi.id), 0) as allocated_quantity
from public.orders o
join public.order_items oi on oi.order_id = o.id
where o.status in ('PENDING', 'PAID')
  and not exists (select 1 from public.payments p where p.order_id = o.id and p.status = 'SUCCEEDED')
order by o.order_number, oi.created_at;

-- 2. Stock that would return to current_stock (v2 cancel_order semantics), per Ware
select w.ware_code,
       w.name as ware,
       w.current_stock as current_stock_now,
       b.quantity as would_return,
       w.current_stock + b.quantity as current_stock_after
from (
    select a.ware_id, sum(a.quantity)::bigint as quantity
    from public.order_item_ware_allocations a
    join public.order_items oi on oi.id = a.order_item_id
    join public.orders o on o.id = oi.order_id
    where o.status in ('PENDING', 'PAID')
      and not exists (select 1 from public.payments p where p.order_id = o.id and p.status = 'SUCCEEDED')
    group by a.ware_id
) b
join public.wares w on w.id = b.ware_id
order by w.ware_code, w.name;

-- 3. Totals
select count(*) as orders,
       coalesce(sum((select sum(oi.quantity) from public.order_items oi where oi.order_id = o.id)), 0) as ordered_quantity,
       coalesce(sum((select sum(a.quantity) from public.order_item_ware_allocations a
                     join public.order_items oi on oi.id = a.order_item_id where oi.order_id = o.id)), 0) as quantity_returning_to_stock
from public.orders o
where o.status in ('PENDING', 'PAID')
  and not exists (select 1 from public.payments p where p.order_id = o.id and p.status = 'SUCCEEDED');
