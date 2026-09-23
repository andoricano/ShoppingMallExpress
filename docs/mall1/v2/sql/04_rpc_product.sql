-- ============================================================
-- Mall v2
-- 04_rpc_product.sql
--
-- Purpose:
--   Product / ProductPost Consumer read RPCs
--   ProductVariant availability calculation
--   ProductVariant option-combination validation
--
-- Core rules:
--
--   - Ware / Warehouse are INTERNAL ONLY.
--   - Consumer RPC responses never expose:
--       ware_id
--       warehouse_id
--       Ware records
--       Warehouse records
--       internal stock quantities
--
--   - Consumer purchases ProductVariant.
--   - Stock availability is calculated internally from Ware.
--   - A Variant with no active Ware stock is treated as
--     OUT_OF_STOCK by default.
--
--   - Product/Variant administration remains a trusted
--     service_role/server responsibility for now.
--
-- ============================================================

begin;


-- ============================================================
-- Internal Variant Availability
--
-- Returns only Consumer-safe availability information.
--
-- available stock:
--
--   SUM(current_stock - reserved_stock)
--
-- Only active Ware records in active Warehouses participate.
--
-- No Ware relation / no active Ware:
--   OUT_OF_STOCK
--
-- IMPORTANT:
--   Exact stock quantity is intentionally NOT returned.
-- ============================================================

create or replace function public.get_product_variant_availability(
    p_product_variant_id uuid
)
returns table (
    product_variant_id uuid,
    is_available boolean,
    stock_status text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    with variant_info as (
        select
            pv.id,
            pv.is_active as variant_active,
            p.is_active as product_active
        from public.product_variants pv
        join public.products p
          on p.id = pv.product_id
        where pv.id = p_product_variant_id
    ),
    stock_info as (
        select
            coalesce(
                sum(
                    greatest(
                        w.current_stock - w.reserved_stock,
                        0
                    )
                ),
                0
            ) as available_stock
        from public.product_variant_wares pvw
        join public.wares w
          on w.id = pvw.ware_id
        join public.warehouses wh
          on wh.id = w.warehouse_id
        where pvw.product_variant_id = p_product_variant_id
          and w.is_active = true
          and wh.is_active = true
    )
    select
        vi.id,
        (
            vi.variant_active = true
            and vi.product_active = true
            and si.available_stock > 0
        ) as is_available,
        case
            when vi.variant_active = false
              or vi.product_active = false
                then 'UNAVAILABLE'

            when si.available_stock <= 0
                then 'OUT_OF_STOCK'

            else 'AVAILABLE'
        end as stock_status
    from variant_info vi
    cross join stock_info si;
$$;


revoke all
on function public.get_product_variant_availability(uuid)
from public;

grant execute
on function public.get_product_variant_availability(uuid)
to anon, authenticated, service_role;


-- ============================================================
-- ProductVariant Option Validation
--
-- Internal integrity helper.
--
-- Validates:
--
--   1. Variant belongs to a Product.
--   2. Every selected OptionValue belongs to that same Product.
--   3. Variant cannot select multiple values from the same Option.
--   4. Every required ProductOption has exactly one selected value.
--
-- Intended for:
--   - trusted Product RPCs
--   - triggers
--   - service-side validation
--
-- Not exposed to Consumers.
-- ============================================================

create or replace function public.validate_product_variant_configuration(
    p_product_variant_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_product_id uuid;
    v_invalid_product_count bigint;
    v_duplicate_option_count bigint;
    v_missing_required_count bigint;
begin
    select pv.product_id
      into v_product_id
    from public.product_variants pv
    where pv.id = p_product_variant_id;

    if v_product_id is null then
        raise exception
            'ProductVariant % does not exist',
            p_product_variant_id;
    end if;


    -- --------------------------------------------------------
    -- Selected OptionValues must belong to the Variant Product.
    -- --------------------------------------------------------

    select count(*)
      into v_invalid_product_count
    from public.product_variant_values pvv
    join public.product_option_values pov
      on pov.id = pvv.product_option_value_id
    join public.product_options po
      on po.id = pov.product_option_id
    where pvv.product_variant_id = p_product_variant_id
      and po.product_id <> v_product_id;

    if v_invalid_product_count > 0 then
        raise exception
            'ProductVariant % contains OptionValue from another Product',
            p_product_variant_id;
    end if;


    -- --------------------------------------------------------
    -- Only one OptionValue may be selected per ProductOption.
    -- --------------------------------------------------------

    select count(*)
      into v_duplicate_option_count
    from (
        select
            pov.product_option_id
        from public.product_variant_values pvv
        join public.product_option_values pov
          on pov.id = pvv.product_option_value_id
        where pvv.product_variant_id = p_product_variant_id
        group by pov.product_option_id
        having count(*) > 1
    ) duplicate_options;

    if v_duplicate_option_count > 0 then
        raise exception
            'ProductVariant % selects multiple values from the same ProductOption',
            p_product_variant_id;
    end if;


    -- --------------------------------------------------------
    -- Required Options must have exactly one selected value.
    -- --------------------------------------------------------

    select count(*)
      into v_missing_required_count
    from public.product_options po
    where po.product_id = v_product_id
      and po.is_required = true
      and not exists (
          select 1
          from public.product_variant_values pvv
          join public.product_option_values pov
            on pov.id = pvv.product_option_value_id
          where pvv.product_variant_id = p_product_variant_id
            and pov.product_option_id = po.id
      );

    if v_missing_required_count > 0 then
        raise exception
            'ProductVariant % is missing one or more required ProductOptions',
            p_product_variant_id;
    end if;


    return true;
end;
$$;


revoke all
on function public.validate_product_variant_configuration(uuid)
from public;

grant execute
on function public.validate_product_variant_configuration(uuid)
to service_role;


-- ============================================================
-- Consumer Product Detail
--
-- Returns:
--
--   Product
--   ProductOptions
--   ProductOptionValues
--   ProductVariants
--   Variant OptionValue IDs
--   Consumer-safe availability
--
-- NEVER returns Ware/Warehouse details.
-- ============================================================

create or replace function public.get_product_detail(
    p_product_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_result jsonb;
begin

    select jsonb_build_object(
        'id',
        p.id,

        'name',
        p.name,

        'description',
        p.description,

        'imageUrls',
        to_jsonb(p.image_urls),

        'meta',
        p.meta,

        'options',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id',
                        po.id,

                        'name',
                        po.name,

                        'displayOrder',
                        po.display_order,

                        'isRequired',
                        po.is_required,

                        'values',
                        coalesce(
                            (
                                select jsonb_agg(
                                    jsonb_build_object(
                                        'id',
                                        pov.id,

                                        'value',
                                        pov.value,

                                        'displayOrder',
                                        pov.display_order
                                    )
                                    order by
                                        pov.display_order,
                                        pov.created_at
                                )
                                from public.product_option_values pov
                                where pov.product_option_id = po.id
                                  and pov.is_active = true
                            ),
                            '[]'::jsonb
                        )
                    )
                    order by
                        po.display_order,
                        po.created_at
                )
                from public.product_options po
                where po.product_id = p.id
            ),
            '[]'::jsonb
        ),

        'variants',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id',
                        pv.id,

                        'skuCode',
                        pv.sku_code,

                        'label',
                        pv.label,

                        'price',
                        pv.price,

                        'meta',
                        pv.meta,

                        'optionValueIds',
                        coalesce(
                            (
                                select jsonb_agg(
                                    pvv.product_option_value_id
                                    order by
                                        po2.display_order,
                                        pov2.display_order,
                                        pov2.created_at
                                )
                                from public.product_variant_values pvv
                                join public.product_option_values pov2
                                  on pov2.id =
                                     pvv.product_option_value_id
                                join public.product_options po2
                                  on po2.id =
                                     pov2.product_option_id
                                where pvv.product_variant_id = pv.id
                                  and pov2.is_active = true
                            ),
                            '[]'::jsonb
                        ),

                        'isAvailable',
                        coalesce(
                            availability.is_available,
                            false
                        ),

                        'stockStatus',
                        coalesce(
                            availability.stock_status,
                            'OUT_OF_STOCK'
                        )
                    )
                    order by
                        pv.created_at,
                        pv.id
                )
                from public.product_variants pv
                left join lateral (
                    select
                        a.is_available,
                        a.stock_status
                    from public.get_product_variant_availability(
                        pv.id
                    ) a
                ) availability
                  on true
                where pv.product_id = p.id
                  and pv.is_active = true
            ),
            '[]'::jsonb
        )
    )
    into v_result
    from public.products p
    where p.id = p_product_id
      and p.is_active = true;


    return v_result;
end;
$$;


revoke all
on function public.get_product_detail(uuid)
from public;

grant execute
on function public.get_product_detail(uuid)
to anon, authenticated, service_role;


-- ============================================================
-- Consumer ProductPost Detail
--
-- ProductPost is the Consumer-facing content unit.
--
-- ProductPost -> Product = N:N
--
-- Products are returned in ProductPost display order.
--
-- Each Product is expanded through get_product_detail().
--
-- Ware/Warehouse remain completely hidden.
-- ============================================================

create or replace function public.get_product_post_detail(
    p_product_post_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_result jsonb;
begin

    select jsonb_build_object(
        'id',
        pp.id,

        'title',
        pp.title,

        'slug',
        pp.slug,

        'summary',
        pp.summary,

        'content',
        pp.content,

        'thumbnailUrl',
        pp.thumbnail_url,

        'publishedAt',
        pp.published_at,

        'categories',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id',
                        c.id,

                        'name',
                        c.name,

                        'slug',
                        c.slug,

                        'description',
                        c.description
                    )
                    order by
                        pcl.display_order,
                        c.display_order,
                        c.created_at
                )
                from public.product_post_category_links pcl
                join public.product_post_categories c
                  on c.id = pcl.category_id
                where pcl.product_post_id = pp.id
                  and c.is_active = true
            ),
            '[]'::jsonb
        ),

        'products',
        coalesce(
            (
                select jsonb_agg(
                    public.get_product_detail(
                        ppp.product_id
                    )
                    order by
                        ppp.display_order,
                        ppp.created_at
                )
                from public.product_post_products ppp
                join public.products p
                  on p.id = ppp.product_id
                where ppp.product_post_id = pp.id
                  and p.is_active = true
            ),
            '[]'::jsonb
        )
    )
    into v_result
    from public.product_posts pp
    where pp.id = p_product_post_id
      and pp.status = 'PUBLISHED'
      and (
          pp.published_at is null
          or pp.published_at <= now()
      );


    return v_result;
end;
$$;


revoke all
on function public.get_product_post_detail(uuid)
from public;

grant execute
on function public.get_product_post_detail(uuid)
to anon, authenticated, service_role;


-- ============================================================
-- Consumer ProductPost List
--
-- Lightweight ProductPost listing for:
--   - home
--   - category
--   - product listing
--
-- Does NOT expand complete Product detail.
--
-- Pagination:
--   limit  : 1 ~ 100
--   offset : >= 0
-- ============================================================

create or replace function public.list_product_posts(
    p_category_id uuid default null,
    p_limit integer default 20,
    p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_limit integer;
    v_offset integer;
    v_result jsonb;
begin

    v_limit :=
        greatest(
            1,
            least(
                coalesce(p_limit, 20),
                100
            )
        );

    v_offset :=
        greatest(
            coalesce(p_offset, 0),
            0
        );


    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id',
                result.id,

                'title',
                result.title,

                'slug',
                result.slug,

                'summary',
                result.summary,

                'thumbnailUrl',
                result.thumbnail_url,

                'publishedAt',
                result.published_at
            )
            order by
                result.published_at desc nulls last,
                result.created_at desc
        ),
        '[]'::jsonb
    )
    into v_result
    from (
        select
            pp.id,
            pp.title,
            pp.slug,
            pp.summary,
            pp.thumbnail_url,
            pp.published_at,
            pp.created_at
        from public.product_posts pp
        where pp.status = 'PUBLISHED'
          and (
              pp.published_at is null
              or pp.published_at <= now()
          )
          and (
              p_category_id is null
              or exists (
                  select 1
                  from public.product_post_category_links pcl
                  join public.product_post_categories c
                    on c.id = pcl.category_id
                  where pcl.product_post_id = pp.id
                    and pcl.category_id = p_category_id
                    and c.is_active = true
              )
          )
        order by
            pp.published_at desc nulls last,
            pp.created_at desc
        limit v_limit
        offset v_offset
    ) result;


    return v_result;
end;
$$;


revoke all
on function public.list_product_posts(
    uuid,
    integer,
    integer
)
from public;

grant execute
on function public.list_product_posts(
    uuid,
    integer,
    integer
)
to anon, authenticated, service_role;


commit;