-- ============================================================
-- Mall v3 cutover: READ-ONLY schema state check of production
--
-- Tells which migrations are applied and whether any v3 object or converted
-- stock already exists, so the precheck (v3_precheck_v2_baseline.sql) is read
-- against the schema it expects. Reads catalogs and the migration history only.
-- ============================================================

-- 1. last applied migrations (expected before the cutover: 20260925150000)
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 8;

-- 2. v3 objects that must NOT exist yet (all false before the cutover)
select 'payment_reversals table' as object, to_regclass('public.payment_reversals') is not null as exists_now
union all select 'order_cancellations table', to_regclass('public.order_cancellations') is not null
union all select 'orders.payment_id column',
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'orders' and column_name = 'payment_id')
union all select 'product_variants.is_sold_out column',
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'product_variants' and column_name = 'is_sold_out')
union all select 'finalize_order function',
       exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = 'finalize_order');

-- 3. stock already converted? (expected 0 before the cutover)
select count(*) as wares_with_reserved_stock
from public.wares
where reserved_stock <> 0;
