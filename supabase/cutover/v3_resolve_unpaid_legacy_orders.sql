-- ============================================================
-- Mall v3 cutover: resolve unpaid legacy Orders
--
-- NOT a migration; applied at the cutover, on the user's explicit instruction,
-- AFTER the additive migrations (it writes order_cancellations, Phase 5) and
-- BEFORE supabase/cutover/v3_stock_and_sellability.sql.
--
-- The v3 lifecycle has no unpaid Orders: PENDING means "already paid". A v2
-- PENDING Order that was never paid, or an Order the Admin marked PAID by hand
-- without a payment, has no payment evidence, so it cannot enter v3 as it is.
-- The default resolution (decided for the release, see CUTOVER.md #1) is to
-- CANCEL them, with the v2 stock semantics of cancel_order: the allocated
-- quantity goes back to current_stock (v2 deducted it at Order creation). The
-- affected Orders are printed first so the user can review them.
--
-- Run inside ONE transaction (no BEGIN/COMMIT here):
--   psql --single-transaction -v ON_ERROR_STOP=1 -f <this file>
-- Guarded: refuses when the v3 migrations are missing or when the stock is
-- already converted (a Ware with reserved_stock <> 0). Idempotent: with nothing
-- to resolve it changes nothing.
-- ============================================================

do $$
begin
    if to_regclass('public.order_cancellations') is null then
        raise exception 'Refused: apply the v3 migrations first (order_cancellations is missing)';
    end if;

    if exists (select 1 from public.wares where reserved_stock <> 0) then
        raise exception 'Refused: the stock is already converted (a Ware has reserved_stock <> 0)';
    end if;
end;
$$;

create temp table _unpaid_legacy on commit drop as
select o.id, o.order_number, o.status
from public.orders o
where o.status in ('PENDING', 'PAID')
  and not exists (
      select 1 from public.payments p where p.order_id = o.id and p.status = 'SUCCEEDED'
  );

-- for review (visible in the psql output)
select order_number, status from _unpaid_legacy order by order_number;

-- v2 cancel_order stock semantics: the allocation goes back to current_stock.
with back as (
    select a.ware_id, sum(a.quantity)::bigint as quantity
    from public.order_item_ware_allocations a
    join public.order_items oi on oi.id = a.order_item_id
    join _unpaid_legacy u on u.id = oi.order_id
    group by a.ware_id
)
update public.wares w
   set current_stock = w.current_stock + b.quantity,
       updated_at = now()
  from back b
 where b.ware_id = w.id;

update public.orders o
   set status = 'CANCELLED'
  from _unpaid_legacy u
 where u.id = o.id;

insert into public.order_cancellations (order_id, actor_id, actor_role, reason)
select id, null, 'ADMIN', 'v3 cutover: unpaid legacy Order (no payment evidence)'
from _unpaid_legacy
on conflict (order_id) do nothing;
