-- ============================================================
-- Mall v2
-- Admin Product update RPC
--
-- Why:
--   ProductOption / ProductOptionValue / ProductVariant integrity
--   is enforced by DEFERRED constraint triggers at commit
--   (07_triggers.sql). Changing e.g. ProductOption.is_required
--   together with the affected Variants, or several Variants at
--   once, must happen in ONE transaction so the Product is never
--   left half-updated. PostgREST table writes are one transaction
--   per request, so a trusted single-transaction entry point is
--   required (same reasoning as admin_create_product).
--
-- Scope (intentionally small):
--   - Product:            name, description, isActive (patch)
--   - ProductOption:      name, isRequired, displayOrder (patch by id)
--   - ProductOptionValue: value, displayOrder, isActive (patch by id)
--                         new values (no id) are appended
--   - ProductVariant:     skuCode, label, price, isActive (patch by id)
--
--   NOT handled: deleting Products/Options/Values/Variants,
--   creating Options or Variants, Variant option-value changes,
--   Ware / Warehouse links.
--
-- Boundary:
--   service_role only (Admin Route Handler after ADMIN check).
--
-- Input:
--   p_product  {name?, description?, isActive?}
--   p_options  [{id, name?, isRequired?, displayOrder?,
--                values?: [{id?, value?, displayOrder?, isActive?}]}]
--   p_variants [{id, skuCode?, label?, price?, isActive?}]
--   Only present keys change. Every id must belong to p_product_id.
--
-- Output:
--   the updated public.products row
-- ============================================================

create or replace function public.admin_update_product(
    p_product_id uuid,
    p_product jsonb default '{}'::jsonb,
    p_options jsonb default '[]'::jsonb,
    p_variants jsonb default '[]'::jsonb
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_product public.products;
    v_option jsonb;
    v_option_id uuid;
    v_value jsonb;
    v_value_id uuid;
    v_variant jsonb;
    v_variant_id uuid;
begin

    p_product := coalesce(p_product, '{}'::jsonb);
    p_options := coalesce(p_options, '[]'::jsonb);
    p_variants := coalesce(p_variants, '[]'::jsonb);

    if jsonb_typeof(p_product) <> 'object'
       or jsonb_typeof(p_options) <> 'array'
       or jsonb_typeof(p_variants) <> 'array' then
        raise exception
            'Product payload must be an object; options and variants must be arrays';
    end if;

    if p_product ? 'name'
       and coalesce(btrim(p_product ->> 'name'), '') = '' then
        raise exception 'Product name is required';
    end if;


    -- --------------------------------------------------------
    -- Product
    -- --------------------------------------------------------

    update public.products p
       set name = case when p_product ? 'name'
                       then btrim(p_product ->> 'name') else p.name end,
           description = case when p_product ? 'description'
                              then nullif(btrim(p_product ->> 'description'), '')
                              else p.description end,
           is_active = case when p_product ? 'isActive'
                            then (p_product ->> 'isActive')::boolean
                            else p.is_active end,
           updated_at = now()
     where p.id = p_product_id
    returning p.* into v_product;

    if v_product.id is null then
        raise exception
            'Product % not found',
            p_product_id
            using errcode = 'P0002';
    end if;


    -- --------------------------------------------------------
    -- ProductOptions / ProductOptionValues
    -- --------------------------------------------------------

    for v_option in
        select e.value from jsonb_array_elements(p_options) as e(value)
    loop

        v_option_id := (v_option ->> 'id')::uuid;

        if not exists (
            select 1
            from public.product_options po
            where po.id = v_option_id
              and po.product_id = p_product_id
        ) then
            raise exception
                'ProductOption % does not belong to Product %',
                v_option_id,
                p_product_id;
        end if;

        if v_option ? 'name'
           and coalesce(btrim(v_option ->> 'name'), '') = '' then
            raise exception 'ProductOption name is required';
        end if;

        update public.product_options po
           set name = case when v_option ? 'name'
                           then btrim(v_option ->> 'name') else po.name end,
               is_required = case when v_option ? 'isRequired'
                                  then (v_option ->> 'isRequired')::boolean
                                  else po.is_required end,
               display_order = case when v_option ? 'displayOrder'
                                    then (v_option ->> 'displayOrder')::integer
                                    else po.display_order end,
               updated_at = now()
         where po.id = v_option_id;

        if v_option ? 'values'
           and jsonb_typeof(v_option -> 'values') <> 'array' then
            raise exception 'ProductOption values must be an array';
        end if;

        for v_value in
            select e.value
            from jsonb_array_elements(coalesce(v_option -> 'values', '[]'::jsonb)) as e(value)
        loop

            if v_value ? 'value'
               and coalesce(btrim(v_value ->> 'value'), '') = '' then
                raise exception 'ProductOptionValue value is required';
            end if;

            if coalesce(v_value ->> 'id', '') = '' then

                if not (v_value ? 'value') then
                    raise exception 'ProductOptionValue value is required';
                end if;

                insert into public.product_option_values (
                    product_option_id,
                    value,
                    display_order,
                    is_active
                )
                values (
                    v_option_id,
                    btrim(v_value ->> 'value'),
                    coalesce(
                        (v_value ->> 'displayOrder')::integer,
                        (
                            select coalesce(max(pov.display_order) + 1, 0)
                            from public.product_option_values pov
                            where pov.product_option_id = v_option_id
                        )
                    ),
                    coalesce((v_value ->> 'isActive')::boolean, true)
                );

            else

                v_value_id := (v_value ->> 'id')::uuid;

                update public.product_option_values pov
                   set value = case when v_value ? 'value'
                                    then btrim(v_value ->> 'value') else pov.value end,
                       display_order = case when v_value ? 'displayOrder'
                                            then (v_value ->> 'displayOrder')::integer
                                            else pov.display_order end,
                       is_active = case when v_value ? 'isActive'
                                        then (v_value ->> 'isActive')::boolean
                                        else pov.is_active end,
                       updated_at = now()
                 where pov.id = v_value_id
                   and pov.product_option_id = v_option_id;

                if not found then
                    raise exception
                        'ProductOptionValue % does not belong to ProductOption %',
                        v_value_id,
                        v_option_id;
                end if;

            end if;

        end loop;

    end loop;


    -- --------------------------------------------------------
    -- ProductVariants
    -- --------------------------------------------------------

    for v_variant in
        select e.value from jsonb_array_elements(p_variants) as e(value)
    loop

        v_variant_id := (v_variant ->> 'id')::uuid;

        if v_variant ? 'price'
           and (v_variant ->> 'price') is null then
            raise exception 'ProductVariant price is required';
        end if;

        update public.product_variants pv
           set sku_code = case when v_variant ? 'skuCode'
                               then nullif(btrim(v_variant ->> 'skuCode'), '')
                               else pv.sku_code end,
               label = case when v_variant ? 'label'
                            then nullif(btrim(v_variant ->> 'label'), '')
                            else pv.label end,
               price = case when v_variant ? 'price'
                            then (v_variant ->> 'price')::numeric
                            else pv.price end,
               is_active = case when v_variant ? 'isActive'
                                then (v_variant ->> 'isActive')::boolean
                                else pv.is_active end,
               updated_at = now()
         where pv.id = v_variant_id
           and pv.product_id = p_product_id;

        if not found then
            raise exception
                'ProductVariant % does not belong to Product %',
                v_variant_id,
                p_product_id;
        end if;

    end loop;


    -- Fail fast with a clear message. The deferred constraint
    -- triggers repeat these checks at commit.
    perform public.validate_product_variants(p_product_id);

    return v_product;
end;
$$;


revoke all
on function public.admin_update_product(uuid, jsonb, jsonb, jsonb)
from public, anon, authenticated;

grant execute
on function public.admin_update_product(uuid, jsonb, jsonb, jsonb)
to service_role;
