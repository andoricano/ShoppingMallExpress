-- ============================================================
-- Mall v2
-- 06_rpc_warehouse.sql
--
-- Purpose:
--   Internal Warehouse / Ware management RPCs
--
-- Core rules:
--
--   - Warehouse / Ware are INTERNAL ONLY.
--   - Consumer roles never receive EXECUTE permission.
--   - Only trusted server/service_role may call these RPCs.
--
--   - ProductVariant may be connected to multiple Ware records.
--   - Ware may exist without any ProductVariant relation.
--
--   - current_stock:
--       physically/accountably owned stock
--
--   - reserved_stock:
--       stock reserved by a separate reservation workflow
--
--   - available stock:
--       current_stock - reserved_stock
--
--   - Stock must never become negative.
--   - reserved_stock must never exceed current_stock.
--
-- ============================================================

begin;


-- ============================================================
-- Create Warehouse
-- ============================================================

create or replace function public.create_warehouse(
    p_name text,
    p_code text default null,
    p_description text default null,
    p_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_id uuid;
begin
    if p_name is null
       or btrim(p_name) = '' then

        raise exception
            'Warehouse name is required';

    end if;


    insert into public.warehouses (
        name,
        code,
        description,
        meta
    )
    values (
        btrim(p_name),
        nullif(
            btrim(p_code),
            ''
        ),
        p_description,
        coalesce(
            p_meta,
            '{}'::jsonb
        )
    )
    returning id into v_id;


    return v_id;
end;
$$;


revoke all
on function public.create_warehouse(
    text,
    text,
    text,
    jsonb
)
from public;

grant execute
on function public.create_warehouse(
    text,
    text,
    text,
    jsonb
)
to service_role;


-- ============================================================
-- Update Warehouse
-- ============================================================

create or replace function public.update_warehouse(
    p_warehouse_id uuid,
    p_name text default null,
    p_code text default null,
    p_description text default null,
    p_is_active boolean default null,
    p_meta jsonb default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin

    update public.warehouses
       set name =
               case
                   when p_name is null
                       then name
                   when btrim(p_name) = ''
                       then name
                   else btrim(p_name)
               end,

           code =
               case
                   when p_code is null
                       then code
                   else nullif(
                       btrim(p_code),
                       ''
                   )
               end,

           description =
               coalesce(
                   p_description,
                   description
               ),

           is_active =
               coalesce(
                   p_is_active,
                   is_active
               ),

           meta =
               coalesce(
                   p_meta,
                   meta
               ),

           updated_at = now()

     where id = p_warehouse_id;


    if not found then
        raise exception
            'Warehouse % does not exist',
            p_warehouse_id;
    end if;

end;
$$;


revoke all
on function public.update_warehouse(
    uuid,
    text,
    text,
    text,
    boolean,
    jsonb
)
from public;

grant execute
on function public.update_warehouse(
    uuid,
    text,
    text,
    text,
    boolean,
    jsonb
)
to service_role;


-- ============================================================
-- Create Ware
--
-- Ware may be completely independent from ProductVariant.
-- ============================================================

create or replace function public.create_ware(
    p_warehouse_id uuid,
    p_name text,
    p_ware_code text default null,
    p_ware_type text default 'GENERAL',
    p_current_stock bigint default 0,
    p_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_id uuid;
begin

    if not exists (
        select 1
        from public.warehouses wh
        where wh.id = p_warehouse_id
    ) then
        raise exception
            'Warehouse % does not exist',
            p_warehouse_id;
    end if;


    if p_name is null
       or btrim(p_name) = '' then

        raise exception
            'Ware name is required';

    end if;


    if p_ware_type is null
       or btrim(p_ware_type) = '' then

        raise exception
            'Ware type is required';

    end if;


    if p_current_stock < 0 then
        raise exception
            'Initial stock cannot be negative';
    end if;


    insert into public.wares (
        warehouse_id,
        ware_code,
        name,
        ware_type,
        current_stock,
        reserved_stock,
        meta
    )
    values (
        p_warehouse_id,
        nullif(
            btrim(p_ware_code),
            ''
        ),
        btrim(p_name),
        btrim(p_ware_type),
        p_current_stock,
        0,
        coalesce(
            p_meta,
            '{}'::jsonb
        )
    )
    returning id into v_id;


    return v_id;
end;
$$;


revoke all
on function public.create_ware(
    uuid,
    text,
    text,
    text,
    bigint,
    jsonb
)
from public;

grant execute
on function public.create_ware(
    uuid,
    text,
    text,
    text,
    bigint,
    jsonb
)
to service_role;


-- ============================================================
-- Update Ware Metadata
--
-- Stock is intentionally NOT updated here.
-- Stock mutations must use dedicated stock RPCs.
-- ============================================================

create or replace function public.update_ware(
    p_ware_id uuid,
    p_name text default null,
    p_ware_code text default null,
    p_ware_type text default null,
    p_is_active boolean default null,
    p_meta jsonb default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin

    update public.wares
       set name =
               case
                   when p_name is null
                       then name
                   when btrim(p_name) = ''
                       then name
                   else btrim(p_name)
               end,

           ware_code =
               case
                   when p_ware_code is null
                       then ware_code
                   else nullif(
                       btrim(p_ware_code),
                       ''
                   )
               end,

           ware_type =
               case
                   when p_ware_type is null
                       then ware_type
                   when btrim(p_ware_type) = ''
                       then ware_type
                   else btrim(p_ware_type)
               end,

           is_active =
               coalesce(
                   p_is_active,
                   is_active
               ),

           meta =
               coalesce(
                   p_meta,
                   meta
               ),

           updated_at = now()

     where id = p_ware_id;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;

end;
$$;


revoke all
on function public.update_ware(
    uuid,
    text,
    text,
    text,
    boolean,
    jsonb
)
from public;

grant execute
on function public.update_ware(
    uuid,
    text,
    text,
    text,
    boolean,
    jsonb
)
to service_role;


-- ============================================================
-- Adjust Ware Stock
--
-- Positive adjustment:
--   stock receipt / restock / correction
--
-- Negative adjustment:
--   disposal / loss / correction
--
-- This RPC does not affect reserved_stock.
-- ============================================================

create or replace function public.adjust_ware_stock(
    p_ware_id uuid,
    p_adjustment bigint
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_current_stock bigint;
    v_reserved_stock bigint;
    v_new_stock bigint;
begin

    if p_adjustment = 0 then
        raise exception
            'Stock adjustment cannot be zero';
    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_current_stock,
        v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    v_new_stock :=
        v_current_stock
        + p_adjustment;


    if v_new_stock < 0 then
        raise exception
            'Stock cannot become negative';
    end if;


    if v_new_stock < v_reserved_stock then
        raise exception
            'Stock cannot be lower than reserved stock';
    end if;


    update public.wares
       set current_stock = v_new_stock,
           updated_at = now()
     where id = p_ware_id;


    return v_new_stock;
end;
$$;


revoke all
on function public.adjust_ware_stock(uuid, bigint)
from public;

grant execute
on function public.adjust_ware_stock(uuid, bigint)
to service_role;


-- ============================================================
-- Set Ware Stock
--
-- Administrative correction only.
--
-- Normal operational changes should prefer adjust_ware_stock().
-- ============================================================

create or replace function public.set_ware_stock(
    p_ware_id uuid,
    p_current_stock bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_reserved_stock bigint;
begin

    if p_current_stock < 0 then
        raise exception
            'Stock cannot be negative';
    end if;


    select w.reserved_stock
      into v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if p_current_stock < v_reserved_stock then
        raise exception
            'Stock cannot be lower than reserved stock';
    end if;


    update public.wares
       set current_stock =
               p_current_stock,
           updated_at = now()
     where id = p_ware_id;

end;
$$;


revoke all
on function public.set_ware_stock(uuid, bigint)
from public;

grant execute
on function public.set_ware_stock(uuid, bigint)
to service_role;


-- ============================================================
-- Reserve Ware Stock
--
-- Does not reduce current_stock.
--
-- available_stock:
--   current_stock - reserved_stock
-- ============================================================

create or replace function public.reserve_ware_stock(
    p_ware_id uuid,
    p_quantity bigint
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_current_stock bigint;
    v_reserved_stock bigint;
    v_new_reserved bigint;
begin

    if p_quantity <= 0 then
        raise exception
            'Reservation quantity must be positive';
    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_current_stock,
        v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
      and w.is_active = true
    for update;


    if not found then
        raise exception
            'Active Ware % does not exist',
            p_ware_id;
    end if;


    v_new_reserved :=
        v_reserved_stock
        + p_quantity;


    if v_new_reserved > v_current_stock then
        raise exception
            'Insufficient available stock';
    end if;


    update public.wares
       set reserved_stock =
               v_new_reserved,
           updated_at = now()
     where id = p_ware_id;


    return v_new_reserved;
end;
$$;


revoke all
on function public.reserve_ware_stock(uuid, bigint)
from public;

grant execute
on function public.reserve_ware_stock(uuid, bigint)
to service_role;


-- ============================================================
-- Release Reserved Stock
-- ============================================================

create or replace function public.release_ware_reservation(
    p_ware_id uuid,
    p_quantity bigint
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_reserved_stock bigint;
    v_new_reserved bigint;
begin

    if p_quantity <= 0 then
        raise exception
            'Release quantity must be positive';
    end if;


    select w.reserved_stock
      into v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if p_quantity > v_reserved_stock then
        raise exception
            'Release quantity exceeds reserved stock';
    end if;


    v_new_reserved :=
        v_reserved_stock
        - p_quantity;


    update public.wares
       set reserved_stock =
               v_new_reserved,
           updated_at = now()
     where id = p_ware_id;


    return v_new_reserved;
end;
$$;


revoke all
on function public.release_ware_reservation(uuid, bigint)
from public;

grant execute
on function public.release_ware_reservation(uuid, bigint)
to service_role;


-- ============================================================
-- Consume Reserved Stock
--
-- Converts reserved stock into consumed stock.
--
-- Example:
--
-- current_stock  = 10
-- reserved_stock = 3
--
-- consume 2:
--
-- current_stock  = 8
-- reserved_stock = 1
-- ============================================================

create or replace function public.consume_reserved_ware_stock(
    p_ware_id uuid,
    p_quantity bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_current_stock bigint;
    v_reserved_stock bigint;
begin

    if p_quantity <= 0 then
        raise exception
            'Consume quantity must be positive';
    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_current_stock,
        v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if p_quantity > v_reserved_stock then
        raise exception
            'Consume quantity exceeds reserved stock';
    end if;


    update public.wares
       set current_stock =
               current_stock
               - p_quantity,

           reserved_stock =
               reserved_stock
               - p_quantity,

           updated_at = now()

     where id = p_ware_id;

end;
$$;


revoke all
on function public.consume_reserved_ware_stock(uuid, bigint)
from public;

grant execute
on function public.consume_reserved_ware_stock(uuid, bigint)
to service_role;


-- ============================================================
-- Link ProductVariant -> Ware
--
-- Ware may already contain stock.
-- Linking does NOT modify stock.
-- ============================================================

create or replace function public.link_product_variant_ware(
    p_product_variant_id uuid,
    p_ware_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_relation_id uuid;
begin

    if not exists (
        select 1
        from public.product_variants pv
        where pv.id = p_product_variant_id
    ) then
        raise exception
            'ProductVariant % does not exist',
            p_product_variant_id;
    end if;


    if not exists (
        select 1
        from public.wares w
        where w.id = p_ware_id
    ) then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    select pvw.id
      into v_relation_id
    from public.product_variant_wares pvw
    where pvw.product_variant_id =
          p_product_variant_id
      and pvw.ware_id =
          p_ware_id;


    if v_relation_id is not null then
        return v_relation_id;
    end if;


    insert into public.product_variant_wares (
        product_variant_id,
        ware_id
    )
    values (
        p_product_variant_id,
        p_ware_id
    )
    returning id into v_relation_id;


    return v_relation_id;
end;
$$;


revoke all
on function public.link_product_variant_ware(uuid, uuid)
from public;

grant execute
on function public.link_product_variant_ware(uuid, uuid)
to service_role;


-- ============================================================
-- Unlink ProductVariant -> Ware
--
-- Does not delete Ware.
--
-- Prevent unlinking when the Ware has active reserved stock.
-- ============================================================

create or replace function public.unlink_product_variant_ware(
    p_product_variant_id uuid,
    p_ware_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_reserved_stock bigint;
begin

    select w.reserved_stock
      into v_reserved_stock
    from public.wares w
    where w.id = p_ware_id;


    if v_reserved_stock is null then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if v_reserved_stock > 0 then
        raise exception
            'Ware with reserved stock cannot be unlinked';
    end if;


    delete from public.product_variant_wares pvw
    where pvw.product_variant_id =
          p_product_variant_id
      and pvw.ware_id =
          p_ware_id;


    if not found then
        raise exception
            'ProductVariant/Ware relation does not exist';
    end if;

end;
$$;


revoke all
on function public.unlink_product_variant_ware(uuid, uuid)
from public;

grant execute
on function public.unlink_product_variant_ware(uuid, uuid)
to service_role;


-- ============================================================
-- Transfer Ware Stock
--
-- Transfers stock between Ware records.
--
-- This represents an internal stock movement.
--
-- The destination Ware must already exist.
--
-- Reserved stock cannot be moved.
-- ============================================================

create or replace function public.transfer_ware_stock(
    p_source_ware_id uuid,
    p_target_ware_id uuid,
    p_quantity bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_source_stock bigint;
    v_source_reserved bigint;
begin

    if p_source_ware_id =
       p_target_ware_id then

        raise exception
            'Source and target Ware must be different';

    end if;


    if p_quantity <= 0 then
        raise exception
            'Transfer quantity must be positive';
    end if;


    -- Lock in deterministic UUID order to reduce deadlock risk.
    perform 1
    from public.wares w
    where w.id in (
        p_source_ware_id,
        p_target_ware_id
    )
    order by w.id
    for update;


    if (
        select count(*)
        from public.wares w
        where w.id in (
            p_source_ware_id,
            p_target_ware_id
        )
    ) <> 2 then

        raise exception
            'Source or target Ware does not exist';

    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_source_stock,
        v_source_reserved
    from public.wares w
    where w.id = p_source_ware_id;


    if (
        v_source_stock
        - v_source_reserved
    ) < p_quantity then

        raise exception
            'Insufficient transferable stock';

    end if;


    update public.wares
       set current_stock =
               current_stock
               - p_quantity,
           updated_at = now()
     where id = p_source_ware_id;


    update public.wares
       set current_stock =
               current_stock
               + p_quantity,
           updated_at = now()
     where id = p_target_ware_id;

end;
$$;


revoke all
on function public.transfer_ware_stock(uuid, uuid, bigint)
from public;

grant execute
on function public.transfer_ware_stock(uuid, uuid, bigint)
to service_role;


-- ============================================================
-- Restock Returned OrderItem
--
-- Used after:
--   refund / return approval
--   physical inspection
--   actual return to warehouse
--
-- IMPORTANT:
--
-- A refund request itself does NOT automatically call this.
--
-- The administrator/server chooses:
--
--   - restock returned unit
--   - dispose damaged unit
--   - move to non-sale Ware
--
-- p_target_ware_id may be:
--   - original Ware
--   - return Ware
--   - non-sale Ware
--
-- ============================================================

create or replace function public.restock_order_item(
    p_order_item_id uuid,
    p_target_ware_id uuid,
    p_quantity bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_order_quantity integer;
begin

    if p_quantity <= 0 then
        raise exception
            'Restock quantity must be positive';
    end if;


    select oi.quantity
      into v_order_quantity
    from public.order_items oi
    where oi.id = p_order_item_id;


    if not found then
        raise exception
            'OrderItem % does not exist',
            p_order_item_id;
    end if;


    if p_quantity > v_order_quantity then
        raise exception
            'Restock quantity exceeds ordered quantity';
    end if;


    perform 1
    from public.wares w
    where w.id = p_target_ware_id
    for update;


    if not found then
        raise exception
            'Target Ware % does not exist',
            p_target_ware_id;
    end if;


    update public.wares
       set current_stock =
               current_stock
               + p_quantity,
           updated_at = now()
     where id = p_target_ware_id;

end;
$$;


revoke all
on function public.restock_order_item(uuid, uuid, bigint)
from public;

grant execute
on function public.restock_order_item(uuid, uuid, bigint)
to service_role;


-- ============================================================
-- Internal Ware Snapshot
--
-- Admin/server only.
--
-- This function deliberately exposes Ware information,
-- therefore service_role only.
-- ============================================================

create or replace function public.get_ware_snapshot(
    p_warehouse_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id',
                w.id,

                'warehouseId',
                w.warehouse_id,

                'wareCode',
                w.ware_code,

                'name',
                w.name,

                'wareType',
                w.ware_type,

                'currentStock',
                w.current_stock,

                'reservedStock',
                w.reserved_stock,

                'availableStock',
                (
                    w.current_stock
                    - w.reserved_stock
                ),

                'isActive',
                w.is_active,

                'meta',
                w.meta,

                'createdAt',
                w.created_at,

                'updatedAt',
                w.updated_at
            )
            order by
                w.warehouse_id,
                w.name,
                w.id
        ),
        '[]'::jsonb
    )
    from public.wares w
    where (
        p_warehouse_id is null
        or w.warehouse_id = p_warehouse_id
    );
$$;


revoke all
on function public.get_ware_snapshot(uuid)
from public;

grant execute
on function public.get_ware_snapshot(uuid)
to service_role;


commit;