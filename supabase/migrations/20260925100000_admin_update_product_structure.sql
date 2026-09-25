-- ============================================================
-- Mall v2
-- Extend admin_update_product(): structural Product edits
--
-- Replaces admin_update_product(uuid, jsonb, jsonb, jsonb) from
-- 20260925090000_admin_update_product.sql with the SAME signature
-- and return type. Existing patch semantics are unchanged; this
-- adds, in the same single transaction:
--
--   - new ProductOptions        (p_options item without id)
--   - new ProductOptionValues   (values item without id; existed)
--   - new ProductVariants       (p_variants item without id)
--   - Variant option-combination changes
--                               (p_variants item with id + optionValues)
--
-- Policies enforced at the end of the call (full rollback on error):
--   - every Option / Value / Variant id must belong to p_product_id
--   - an ACTIVE Variant must not reference an INACTIVE OptionValue
--     (deactivate the Variant or change its combination first)
--   - ACTIVE Variants of a Product must not share the same option
--     combination
--   - required Options / one value per Option / same-Product values
--     (validate_product_variants + deferred triggers, unchanged)
--   - SKU uniqueness, price >= 0, unique Option name / value
--     (existing constraints, unchanged)
--
-- Not handled: physical deletion of Products / Options / Values /
-- Variants, Ware / Warehouse links.
--
-- Input (only present keys change):
--   p_product  {name?, description?, isActive?}
--   p_options  [{id?, name?, isRequired?, displayOrder?,
--                values?: [{id?, value?, displayOrder?, isActive?} | "<new value>"]}]
--              without id: new Option (name + at least one value)
--   p_variants [{id?, skuCode?, label?, price?, isActive?, meta?,
--                optionValues?: {"<option name>": "<value>"}}]
--              without id: new Variant (price required)
--              optionValues replaces the Variant's full combination;
--              names resolve against the state after p_options.
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
    v_selection record;
    v_option_value_id uuid;
    v_conflict text;
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

        if v_option ? 'name'
           and coalesce(btrim(v_option ->> 'name'), '') = '' then
            raise exception 'ProductOption name is required';
        end if;

        if v_option ? 'values'
           and jsonb_typeof(v_option -> 'values') <> 'array' then
            raise exception 'ProductOption values must be an array';
        end if;

        if coalesce(v_option ->> 'id', '') = '' then

            -- New ProductOption
            if not (v_option ? 'name') then
                raise exception 'ProductOption name is required';
            end if;

            if coalesce(jsonb_array_length(v_option -> 'values'), 0) = 0 then
                raise exception
                    'ProductOption % requires at least one value',
                    v_option ->> 'name';
            end if;

            insert into public.product_options (
                product_id,
                name,
                display_order,
                is_required
            )
            values (
                p_product_id,
                btrim(v_option ->> 'name'),
                coalesce(
                    (v_option ->> 'displayOrder')::integer,
                    (
                        select coalesce(max(po.display_order) + 1, 0)
                        from public.product_options po
                        where po.product_id = p_product_id
                    )
                ),
                coalesce((v_option ->> 'isRequired')::boolean, true)
            )
            returning id into v_option_id;

        else

            v_option_id := (v_option ->> 'id')::uuid;

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
             where po.id = v_option_id
               and po.product_id = p_product_id;

            if not found then
                raise exception
                    'ProductOption % does not belong to Product %',
                    v_option_id,
                    p_product_id;
            end if;

        end if;

        for v_value in
            select e.value
            from jsonb_array_elements(coalesce(v_option -> 'values', '[]'::jsonb)) as e(value)
        loop

            -- A plain string is shorthand for a new value (as in admin_create_product).
            if jsonb_typeof(v_value) = 'string' then
                v_value := jsonb_build_object('value', v_value #>> '{}');
            end if;

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

        if v_variant ? 'price'
           and (v_variant ->> 'price') is null then
            raise exception 'ProductVariant price is required';
        end if;

        if v_variant ? 'optionValues'
           and jsonb_typeof(v_variant -> 'optionValues') <> 'object' then
            raise exception
                'ProductVariant optionValues must be a JSON object';
        end if;

        if coalesce(v_variant ->> 'id', '') = '' then

            -- New ProductVariant
            if not (v_variant ? 'price') then
                raise exception 'ProductVariant price is required';
            end if;

            insert into public.product_variants (
                product_id,
                sku_code,
                label,
                price,
                is_active,
                meta
            )
            values (
                p_product_id,
                nullif(btrim(v_variant ->> 'skuCode'), ''),
                nullif(btrim(v_variant ->> 'label'), ''),
                (v_variant ->> 'price')::numeric,
                coalesce((v_variant ->> 'isActive')::boolean, true),
                coalesce(v_variant -> 'meta', '{}'::jsonb)
            )
            returning id into v_variant_id;

        else

            v_variant_id := (v_variant ->> 'id')::uuid;

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
                   meta = case when v_variant ? 'meta'
                               then coalesce(v_variant -> 'meta', '{}'::jsonb)
                               else pv.meta end,
                   updated_at = now()
             where pv.id = v_variant_id
               and pv.product_id = p_product_id;

            if not found then
                raise exception
                    'ProductVariant % does not belong to Product %',
                    v_variant_id,
                    p_product_id;
            end if;

            if v_variant ? 'optionValues' then
                delete from public.product_variant_values
                where product_variant_id = v_variant_id;
            end if;

        end if;

        -- (Re)build the combination. Names resolve inside this Product.
        for v_selection in
            select s.key as option_name, s.value as option_value
            from jsonb_each_text(
                coalesce(v_variant -> 'optionValues', '{}'::jsonb)
            ) as s
        loop

            select pov.id
              into v_option_value_id
            from public.product_option_values pov
            join public.product_options po
              on po.id = pov.product_option_id
            where po.product_id = p_product_id
              and po.name = btrim(v_selection.option_name)
              and pov.value = btrim(v_selection.option_value);

            if v_option_value_id is null then
                raise exception
                    'ProductOption value %=% does not exist on this Product',
                    v_selection.option_name,
                    v_selection.option_value;
            end if;

            insert into public.product_variant_values (
                product_variant_id,
                product_option_value_id
            )
            values (
                v_variant_id,
                v_option_value_id
            );

        end loop;

    end loop;


    -- --------------------------------------------------------
    -- Product-wide policies (final state of this transaction)
    -- --------------------------------------------------------

    -- Required Options, one value per Option, same-Product values.
    perform public.validate_product_variants(p_product_id);

    -- Active Variants must not use inactive OptionValues.
    select pv.id::text || ' uses ' || pov.value
      into v_conflict
    from public.product_variants pv
    join public.product_variant_values pvv
      on pvv.product_variant_id = pv.id
    join public.product_option_values pov
      on pov.id = pvv.product_option_value_id
    where pv.product_id = p_product_id
      and pv.is_active = true
      and pov.is_active = false
    limit 1;

    if v_conflict is not null then
        raise exception
            'Active ProductVariant uses an inactive ProductOptionValue (%). Deactivate the Variant or change its combination first.',
            v_conflict;
    end if;

    -- Active Variants must not share an option combination.
    select combination
      into v_conflict
    from (
        select
            pv.id,
            coalesce(
                (
                    select string_agg(pvv.product_option_value_id::text, ',' order by pvv.product_option_value_id)
                    from public.product_variant_values pvv
                    where pvv.product_variant_id = pv.id
                ),
                ''
            ) as combination
        from public.product_variants pv
        where pv.product_id = p_product_id
          and pv.is_active = true
    ) active_combinations
    group by combination
    having count(*) > 1
    limit 1;

    if found then
        raise exception
            'Active ProductVariants must not share the same option combination';
    end if;

    return v_product;
end;
$$;


revoke all
on function public.admin_update_product(uuid, jsonb, jsonb, jsonb)
from public, anon, authenticated;

grant execute
on function public.admin_update_product(uuid, jsonb, jsonb, jsonb)
to service_role;
