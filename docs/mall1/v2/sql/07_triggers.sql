-- ============================================================
-- Mall v2
-- 07_triggers.sql
--
-- Purpose:
--   Database-level final integrity protections.
--
-- Responsibilities:
--
--   1. Automatically maintain updated_at.
--
--   2. Enforce ProductVariant / ProductOption /
--      ProductOptionValue configuration integrity at the end
--      of a transaction.
--
--   3. Protect immutable OrderItem snapshots from mutation.
--
-- Not handled here:
--
--   - Order workflow
--   - Stock deduction
--   - Refund processing
--   - Consumer authorization
--
-- Those remain RPC / RLS responsibilities.
-- ============================================================

begin;


-- ============================================================
-- Generic updated_at Trigger
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;


revoke all
on function public.set_updated_at()
from public;


-- ============================================================
-- ProductPost Domain
-- ============================================================

create trigger product_posts_set_updated_at
before update
on public.product_posts
for each row
execute function public.set_updated_at();


create trigger product_post_categories_set_updated_at
before update
on public.product_post_categories
for each row
execute function public.set_updated_at();


-- ============================================================
-- Product Domain
-- ============================================================

create trigger products_set_updated_at
before update
on public.products
for each row
execute function public.set_updated_at();


create trigger product_options_set_updated_at
before update
on public.product_options
for each row
execute function public.set_updated_at();


create trigger product_option_values_set_updated_at
before update
on public.product_option_values
for each row
execute function public.set_updated_at();


create trigger product_variants_set_updated_at
before update
on public.product_variants
for each row
execute function public.set_updated_at();


-- ============================================================
-- Warehouse Domain
-- ============================================================

create trigger warehouses_set_updated_at
before update
on public.warehouses
for each row
execute function public.set_updated_at();


create trigger wares_set_updated_at
before update
on public.wares
for each row
execute function public.set_updated_at();


-- ============================================================
-- Cart Domain
-- ============================================================

create trigger carts_set_updated_at
before update
on public.carts
for each row
execute function public.set_updated_at();


create trigger cart_items_set_updated_at
before update
on public.cart_items
for each row
execute function public.set_updated_at();


-- ============================================================
-- Order Domain
-- ============================================================

create trigger orders_set_updated_at
before update
on public.orders
for each row
execute function public.set_updated_at();


-- ============================================================
-- Refund Domain
-- ============================================================

create trigger refund_requests_set_updated_at
before update
on public.refund_requests
for each row
execute function public.set_updated_at();


-- ============================================================
-- Variant Validation Helper
--
-- This function safely validates a Variant only when that
-- Variant still exists.
--
-- This matters because cascading DELETE may remove
-- product_variant_values after the Variant itself is gone.
-- ============================================================

create or replace function public.validate_variant_if_exists(
    p_product_variant_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin

    if p_product_variant_id is null then
        return;
    end if;


    if exists (
        select 1
        from public.product_variants pv
        where pv.id = p_product_variant_id
    ) then

        perform
            public.validate_product_variant_configuration(
                p_product_variant_id
            );

    end if;

end;
$$;


revoke all
on function public.validate_variant_if_exists(uuid)
from public;


-- ============================================================
-- Variant Value Change Validation Trigger
--
-- Deferred until transaction commit.
--
-- Why deferred:
--
-- A valid Variant may require several ProductOptionValues.
--
-- Example:
--
--   Color = Black
--   Size  = M
--
-- During creation those rows are inserted one at a time.
-- Immediate validation would incorrectly reject the Variant
-- after the first insert.
--
-- INITIALLY DEFERRED allows the complete combination to be
-- assembled before final validation.
-- ============================================================

create or replace function public.trigger_validate_variant_values()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin

    if tg_op = 'INSERT' then

        perform
            public.validate_variant_if_exists(
                new.product_variant_id
            );


    elsif tg_op = 'UPDATE' then

        perform
            public.validate_variant_if_exists(
                old.product_variant_id
            );

        if new.product_variant_id
           is distinct from old.product_variant_id then

            perform
                public.validate_variant_if_exists(
                    new.product_variant_id
                );

        end if;


    elsif tg_op = 'DELETE' then

        perform
            public.validate_variant_if_exists(
                old.product_variant_id
            );

    end if;


    return null;
end;
$$;


revoke all
on function public.trigger_validate_variant_values()
from public;


create constraint trigger product_variant_values_validate
after insert or update or delete
on public.product_variant_values
deferrable
initially deferred
for each row
execute function public.trigger_validate_variant_values();


-- ============================================================
-- ProductVariant Validation
--
-- Ensures a newly created or moved Variant is valid against
-- the Product's required Options by transaction commit.
--
-- An optionless Product remains valid because there are no
-- required ProductOptions to satisfy.
-- ============================================================

create or replace function public.trigger_validate_product_variant()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin

    perform
        public.validate_variant_if_exists(
            new.id
        );

    return null;
end;
$$;


revoke all
on function public.trigger_validate_product_variant()
from public;


create constraint trigger product_variants_validate
after insert or update
on public.product_variants
deferrable
initially deferred
for each row
execute function public.trigger_validate_product_variant();


-- ============================================================
-- Validate all Variants belonging to a Product
-- ============================================================

create or replace function public.validate_product_variants(
    p_product_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_variant record;
begin

    if p_product_id is null then
        return;
    end if;


    for v_variant in
        select pv.id
        from public.product_variants pv
        where pv.product_id = p_product_id
        order by pv.id
    loop

        perform
            public.validate_product_variant_configuration(
                v_variant.id
            );

    end loop;

end;
$$;


revoke all
on function public.validate_product_variants(uuid)
from public;


-- ============================================================
-- ProductOption Structural Changes
--
-- Adding/changing a required Option can invalidate existing
-- Variants.
--
-- Validation is deferred until transaction commit so a trusted
-- Product operation can:
--
--   1. Add/change ProductOption
--   2. Update all affected Variants
--   3. Commit only when the final state is valid
-- ============================================================

create or replace function public.trigger_validate_product_options()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin

    if tg_op = 'INSERT' then

        perform
            public.validate_product_variants(
                new.product_id
            );


    elsif tg_op = 'UPDATE' then

        perform
            public.validate_product_variants(
                old.product_id
            );

        if new.product_id
           is distinct from old.product_id then

            perform
                public.validate_product_variants(
                    new.product_id
                );

        end if;


    elsif tg_op = 'DELETE' then

        perform
            public.validate_product_variants(
                old.product_id
            );

    end if;


    return null;
end;
$$;


revoke all
on function public.trigger_validate_product_options()
from public;


create constraint trigger product_options_validate
after insert or update or delete
on public.product_options
deferrable
initially deferred
for each row
execute function public.trigger_validate_product_options();


-- ============================================================
-- ProductOptionValue Structural Changes
--
-- Moving an OptionValue to another ProductOption may silently
-- invalidate Variants already using that value.
--
-- Validate every Variant currently referencing the affected
-- OptionValue.
-- ============================================================

create or replace function public.trigger_validate_option_value()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_variant record;
    v_value_id uuid;
begin

    if tg_op = 'DELETE' then
        v_value_id := old.id;
    else
        v_value_id := new.id;
    end if;


    for v_variant in
        select distinct
            pvv.product_variant_id as id
        from public.product_variant_values pvv
        where pvv.product_option_value_id =
              v_value_id
        order by pvv.product_variant_id
    loop

        perform
            public.validate_variant_if_exists(
                v_variant.id
            );

    end loop;


    return null;
end;
$$;


revoke all
on function public.trigger_validate_option_value()
from public;


create constraint trigger product_option_values_validate
after insert or update or delete
on public.product_option_values
deferrable
initially deferred
for each row
execute function public.trigger_validate_option_value();


-- ============================================================
-- OrderItem Snapshot Immutability
--
-- OrderItem stores the historical state at purchase time:
--
--   product name
--   selected options
--   price
--   quantity
--   image
--
-- Current Product/ProductVariant changes must never rewrite
-- historical OrderItem data.
--
-- Cancellation/refund changes Order/Refund state instead.
-- ============================================================

create or replace function public.prevent_order_item_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin

    raise exception
        'OrderItem snapshots are immutable';

end;
$$;


revoke all
on function public.prevent_order_item_update()
from public;


create trigger order_items_prevent_update
before update
on public.order_items
for each row
execute function public.prevent_order_item_update();


commit;