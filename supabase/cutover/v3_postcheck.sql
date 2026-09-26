-- ============================================================
-- Mall v3 cutover: READ-ONLY post-check
--
-- Run after the cutover scripts (stock conversion + contraction). One SELECT;
-- every row must have ok = true. Any false row is a rollback signal
-- (docs/mall1/v3/CUTOVER.md, rollback criteria).
--
--   psql "<connection>" -f supabase/cutover/v3_postcheck.sql
-- ============================================================
select check_name, ok, detail from (
    select 'no PAID Order and the status CHECK excludes PAID' as check_name,
           not exists (select 1 from public.orders where status = 'PAID')
           and (select pg_get_constraintdef(c.oid) not like '%PAID%'
                from pg_constraint c where c.conname = 'orders_status_valid') as ok,
           (select count(*) from public.orders where status = 'PAID')::text as detail
    union all
    select 'every PENDING Order has a linked succeeded Payment',
           not exists (
               select 1 from public.orders o
               where o.status = 'PENDING'
                 and not exists (select 1 from public.payments p where p.id = o.payment_id and p.status = 'SUCCEEDED')
           ),
           (select count(*) from public.orders o where o.status = 'PENDING' and o.payment_id is null)::text
    union all
    select 'stock: reserved_stock equals the allocations of PENDING Orders; 0 <= reserved <= current',
           not exists (
               select 1 from public.wares w
               left join (
                   select a.ware_id, sum(a.quantity)::bigint as quantity
                   from public.order_item_ware_allocations a
                   join public.order_items oi on oi.id = a.order_item_id
                   join public.orders o on o.id = oi.order_id
                   where o.status = 'PENDING'
                   group by a.ware_id
               ) h on h.ware_id = w.id
               where w.reserved_stock <> coalesce(h.quantity, 0) or w.reserved_stock > w.current_stock or w.current_stock < 0
           ),
           (select count(*) from public.wares)::text
    union all
    select 'the v2 order paths are removed',
           to_regprocedure('public.create_order_from_cart(jsonb, text)') is null
           and to_regprocedure('public.cancel_order(uuid)') is null
           and to_regprocedure('public.request_refund(uuid, jsonb, text)') is null
           and to_regprocedure('public.admin_transition_order_status(uuid, text)') is null
           and to_regprocedure('public.admin_transition_refund_status(uuid, text)') is null
           and to_regprocedure('public.restock_order_item(uuid, uuid, bigint)') is null,
           null
    union all
    select 'the v3 paths exist',
           to_regprocedure('public.create_checkout_payment(uuid, jsonb)') is not null
           and to_regprocedure('public.complete_checkout_payment(uuid, uuid, boolean, text, text)') is not null
           and to_regprocedure('public.finalize_order(uuid, uuid, jsonb, jsonb)') is not null
           and to_regprocedure('public.cancel_pending_order(uuid, uuid, text, text)') is not null
           and to_regprocedure('public.admin_advance_order(uuid, text)') is not null
           and to_regprocedure('public.create_refund_request(uuid, uuid, jsonb, text)') is not null
           and to_regprocedure('public.admin_create_refund_request(uuid, jsonb, text, uuid)') is not null
           and to_regprocedure('public.admin_decide_refund(uuid, text, uuid)') is not null
           and to_regprocedure('public.create_payment_reversal(uuid, numeric, text, text, uuid, uuid, uuid)') is not null
           and to_regprocedure('public.reverse_orphan_payments(interval, integer)') is not null,
           null
    union all
    select 'the trusted v3 functions are not executable by anon / authenticated',
           (select coalesce(bool_and(not has_function_privilege('anon', f, 'execute') and not has_function_privilege('authenticated', f, 'execute')), true)
            from unnest(array[
                'public.finalize_order(uuid, uuid, jsonb, jsonb)',
                'public.cancel_pending_order(uuid, uuid, text, text)',
                'public.admin_advance_order(uuid, text)',
                'public.create_refund_request(uuid, uuid, jsonb, text)',
                'public.admin_decide_refund(uuid, text, uuid)',
                'public.create_payment_reversal(uuid, numeric, text, text, uuid, uuid, uuid)',
                'public.allocate_order_stock(uuid)',
                'public.get_order_shortage(uuid)'
            ]::regprocedure[]) as f),
           null
    union all
    select 'RLS is enabled and Consumers have no privilege on the internal v3 tables',
           (select bool_and(c.relrowsecurity) from pg_class c where c.oid in ('public.payment_reversals'::regclass, 'public.order_cancellations'::regclass))
           and not has_table_privilege('authenticated', 'public.payment_reversals', 'select')
           and not has_table_privilege('authenticated', 'public.order_cancellations', 'select'),
           null
    union all
    select 'the Refund status CHECK is validated and no Refund is outside the set',
           (select convalidated from pg_constraint where conname = 'refund_requests_status_v3_valid')
           and not exists (select 1 from public.refund_requests where status not in ('REQUESTED', 'APPROVED', 'REJECTED')),
           null
    union all
    select 'no Payment is reversed above its amount; no Order has two ORDER_CANCEL reversals',
           not exists (
               select 1 from public.payments p
               where (select coalesce(sum(r.amount), 0) from public.payment_reversals r
                       where r.payment_id = p.id and r.status in ('PENDING', 'SUCCEEDED')) > p.amount
           )
           and not exists (
               select 1 from public.payment_reversals r where r.reason_type = 'ORDER_CANCEL'
               group by r.order_id having count(*) > 1
           ),
           null
    union all
    select 'PG references are unique (index present, no duplicates)',
           exists (select 1 from pg_indexes where indexname = 'payments_pg_callback_id_uidx')
           and not exists (select 1 from public.payments where pg_callback_id is not null group by pg_callback_id having count(*) > 1),
           null
    union all
    select 'one Order per Payment and the two link directions agree',
           not exists (select 1 from public.orders where payment_id is not null group by payment_id having count(*) > 1)
           and not exists (
               select 1 from public.orders o join public.payments p on p.id = o.payment_id
               where p.order_id is not null and p.order_id <> o.id
           ),
           null
    union all
    select 'availability reports the v3 status names (no OUT_OF_STOCK)',
           not exists (select 1 from public.product_variants pv, lateral public.get_product_variant_availability(pv.id) a where a.stock_status = 'OUT_OF_STOCK'),
           null
    union all
    select 'legacy Orders past PENDING without payment evidence (informational; expected 0 or explained)',
           true,
           (select count(*) from public.orders o where o.status in ('PROCESSING', 'SHIPPED', 'DELIVERED') and o.payment_id is null)::text
) checks
order by ok, check_name;
