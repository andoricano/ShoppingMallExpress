-- ============================================================
-- Mall v3 cutover: production READ-ONLY precheck (v2 schema)
--
-- Run this on the production database BEFORE any v3 migration. It only reads
-- (a single SELECT; no writes) and uses v2 tables only, so it works on the
-- current production schema. Nothing here is applied to production by an
-- agent: the user runs it (or explicitly instructs it) and reads the result.
--
--   psql "<production connection>" -f supabase/cutover/v3_precheck_v2_baseline.sql
--
-- Levels
--   BLOCKER  the cutover must not proceed until the count is 0.
--   ACTION   the count must be resolved by the cutover procedure
--            (docs/mall1/v3/CUTOVER.md); the resolve script is provided.
--   WARN     unexpected data to look at; decide before the cutover.
--   INFO     context only.
-- ============================================================
with
dup_refs as (
    select pg_callback_id from public.payments
    where pg_callback_id is not null
    group by pg_callback_id having count(*) > 1
),
no_evidence as (
    select o.id, o.order_number, o.status
    from public.orders o
    where o.status in ('PENDING', 'PAID')
      and not exists (
          select 1 from public.payments p where p.order_id = o.id and p.status = 'SUCCEEDED'
      )
),
bad_refund_status as (
    select id from public.refund_requests
    where status not in ('REQUESTED', 'APPROVED', 'REJECTED')
),
over_refund as (
    select ri.order_item_id
    from public.refund_items ri
    join public.refund_requests rr on rr.id = ri.refund_request_id
    where rr.status in ('REQUESTED', 'APPROVED')
    group by ri.order_item_id
    having sum(ri.quantity) > (select oi.quantity from public.order_items oi where oi.id = ri.order_item_id)
),
alloc_mismatch as (
    select oi.id
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status <> 'CANCELLED'
      and oi.quantity <> coalesce((select sum(a.quantity) from public.order_item_ware_allocations a where a.order_item_id = oi.id), 0)
),
paid_cancelled as (
    select p.id from public.payments p
    join public.orders o on o.id = p.order_id
    where p.purpose = 'ORDER_PAYMENT' and p.status = 'SUCCEEDED' and o.status = 'CANCELLED'
),
point_mismatch as (
    select b.client_id from public.point_balances b
    where b.balance <> coalesce((select sum(l.amount) from public.point_ledger l where l.client_id = b.client_id), 0)
)
select 'duplicate pg_callback_id values (unique reference index would fail)' as check_name,
       'BLOCKER' as level, (select count(*) from dup_refs) as count,
       (select string_agg(pg_callback_id, ', ') from (select pg_callback_id from dup_refs limit 10) x) as detail
union all
select 'Refund requests with a status outside REQUESTED/APPROVED/REJECTED', 'BLOCKER',
       (select count(*) from bad_refund_status), null
union all
select 'OrderItems whose valid cumulative refund quantity exceeds the ordered quantity', 'BLOCKER',
       (select count(*) from over_refund), null
union all
select 'Wares with reserved_stock <> 0 (v2 never reserves; the stock conversion refuses)', 'BLOCKER',
       (select count(*) from public.wares where reserved_stock <> 0), null
union all
select 'PENDING/PAID Orders without a succeeded Payment (v3 has no unpaid Orders; resolve script cancels them)', 'ACTION',
       (select count(*) from no_evidence),
       (select string_agg(order_number || ' (' || status || ')', ', ') from (select * from no_evidence order by order_number limit 20) x)
union all
select 'non-cancelled OrderItems whose allocation does not sum to the quantity', 'WARN',
       (select count(*) from alloc_mismatch), null
union all
select 'payments still PENDING (in flight at the cutover; they stay PENDING and are never finalized)', 'WARN',
       (select count(*) from public.payments where status = 'PENDING'),
       (select 'oldest ' || min(created_at)::text from public.payments where status = 'PENDING')
union all
select 'succeeded ORDER_PAYMENTs whose Order is CANCELLED (money taken, Order cancelled)', 'WARN',
       (select count(*) from paid_cancelled), null
union all
select 'Point balances that differ from their ledger', 'WARN',
       (select count(*) from point_mismatch), null
union all
select 'APPROVED Refunds (historical: v2 created no reversal and moved no money; they stay as they are)', 'INFO',
       (select count(*) from public.refund_requests where status = 'APPROVED'), null
union all
select 'REQUESTED Refunds (open: approved in v3 with a reversal)', 'INFO',
       (select count(*) from public.refund_requests where status = 'REQUESTED'), null
union all
select 'Orders by status', 'INFO', (select count(*) from public.orders),
       (select string_agg(status || '=' || n, ', ' order by status) from (select status, count(*) n from public.orders group by status) s)
union all
select 'Wares (total current_stock is the v2 net remainder)', 'INFO', (select count(*) from public.wares),
       (select 'total current_stock ' || coalesce(sum(current_stock), 0) from public.wares)
union all
select 'Variants without a linked Ware (orderable in v3, fully short)', 'INFO',
       (select count(*) from public.product_variants pv
         where not exists (select 1 from public.product_variant_wares w where w.product_variant_id = pv.id)), null
union all
select 'Point top-ups (retained)', 'INFO', (select count(*) from public.payments where purpose = 'POINT_TOPUP'), null
order by 2, 1;
