-- ============================================================
-- Mall v2
-- 08_seed.sql
--
-- Purpose:
--   Insert only the minimum initial data required for the
--   Mall v2 domain to operate.
--
-- Policy:
--
--   - No demo Product
--   - No demo ProductPost
--   - No demo Order
--   - No demo Consumer data
--
--   Only stable infrastructure/domain defaults belong here.
--
-- ============================================================

begin;


-- ============================================================
-- Default Warehouse
--
-- Used as the initial internal stock location.
--
-- This Warehouse is internal-only and must never be exposed
-- directly to Consumers.
-- ============================================================

insert into public.warehouses (
    name,
    code,
    description,
    is_active,
    meta
)
values (
    'Default Warehouse',
    'DEFAULT',
    'Default internal warehouse for Mall v2.',
    true,
    jsonb_build_object(
        'systemDefault',
        true
    )
)
on conflict do nothing;


commit;