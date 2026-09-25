-- ============================================================
-- Mall v2
-- Admin Product creation RPC
--
-- Why:
--   ProductOption / ProductOptionValue / ProductVariant /
--   product_variant_values integrity is enforced by DEFERRED
--   constraint triggers (07_triggers.sql) at transaction commit.
--   A Product with required Options can therefore only be
--   created when the Product, its Options, OptionValues,
--   Variants and Variant OptionValue selections are written in
--   ONE transaction. PostgREST table writes are one transaction
--   per request, so a trusted single-transaction entry point is
--   required.
--
-- Boundary:
--   - service_role only (Admin Route Handler after ADMIN check).
--   - Price is owned by ProductVariant.
--   - Ware / Warehouse are NOT handled here. Variant <-> Ware
--     links keep using link_product_variant_ware().
--
-- Input:
--   p_product  {name, description?, imageUrls?, isActive?, meta?}
--   p_options  [{name, isRequired?, values: [text, ...]}]
--              display_order = array position
--   p_variants [{price, skuCode?, label?, isActive?, meta?,
--                optionValues?: {"<option name>": "<value>"}}]
--
-- Output:
--   {"productId": uuid, "variantIds": [uuid, ...]}
--   variantIds follow the p_variants input order.
-- ============================================================

create or replace function public.admin_create_product(
    p_product jsonb,
    p_options jsonb default '[]'::jsonb,
    p_variants jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_product_id uuid;
    v_option jsonb;
    v_option_index integer;
    v_option_id uuid;
    v_value jsonb;
    v_value_index integer;
    v_variant jsonb;
    v_variant_id uuid;
    v_variant_ids uuid[] := array[]::uuid[];
    v_selection record;
    v_option_value_id uuid;
begin

    if p_product is null or jsonb_typeof(p_product) <> 'object' then
        raise exception 'Product payload must be a JSON object';
    end if;

    if coalesce(btrim(p_product ->> 'name'), '') = '' then
        raise exception 'Product name is required';
    end if;

    p_options := coalesce(p_options, '[]'::jsonb);
    p_variants := coalesce(p_variants, '[]'::jsonb);

    if jsonb_typeof(p_options) <> 'array' then
        raise exception 'Product options must be a JSON array';
    end if;

    if jsonb_typeof(p_variants) <> 'array'
       or jsonb_array_length(p_variants) = 0 then
        raise exception 'At least one ProductVariant is required';
    end if;


    -- --------------------------------------------------------
    -- Product
    -- --------------------------------------------------------

    insert into public.products (
        name,
        description,
        image_urls,
        is_active,
        meta
    )
    values (
        btrim(p_product ->> 'name'),
        nullif(btrim(p_product ->> 'description'), ''),
        coalesce(
            array(
                select jsonb_array_elements_text(
                    coalesce(p_product -> 'imageUrls', '[]'::jsonb)
                )
            ),
            array[]::text[]
        ),
        coalesce((p_product ->> 'isActive')::boolean, true),
        coalesce(p_product -> 'meta', '{}'::jsonb)
    )
    returning id into v_product_id;


    -- --------------------------------------------------------
    -- ProductOptions / ProductOptionValues
    -- --------------------------------------------------------

    for v_option, v_option_index in
        select e.value, e.ordinality - 1
        from jsonb_array_elements(p_options) with ordinality as e(value, ordinality)
    loop

        if jsonb_typeof(v_option -> 'values') is distinct from 'array'
           or jsonb_array_length(v_option -> 'values') = 0 then
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
            v_product_id,
            btrim(v_option ->> 'name'),
            v_option_index,
            coalesce((v_option ->> 'isRequired')::boolean, true)
        )
        returning id into v_option_id;

        for v_value, v_value_index in
            select e.value, e.ordinality - 1
            from jsonb_array_elements(v_option -> 'values') with ordinality as e(value, ordinality)
        loop
            insert into public.product_option_values (
                product_option_id,
                value,
                display_order
            )
            values (
                v_option_id,
                btrim(v_value #>> '{}'),
                v_value_index
            );
        end loop;

    end loop;


    -- --------------------------------------------------------
    -- ProductVariants / product_variant_values
    -- --------------------------------------------------------

    for v_variant in
        select e.value
        from jsonb_array_elements(p_variants) with ordinality as e(value, ordinality)
        order by e.ordinality
    loop

        if v_variant ->> 'price' is null then
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
            v_product_id,
            nullif(btrim(v_variant ->> 'skuCode'), ''),
            nullif(btrim(v_variant ->> 'label'), ''),
            (v_variant ->> 'price')::numeric,
            coalesce((v_variant ->> 'isActive')::boolean, true),
            coalesce(v_variant -> 'meta', '{}'::jsonb)
        )
        returning id into v_variant_id;

        if v_variant ? 'optionValues'
           and jsonb_typeof(v_variant -> 'optionValues') <> 'object' then
            raise exception
                'ProductVariant optionValues must be a JSON object';
        end if;

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
            where po.product_id = v_product_id
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

        -- Fail fast with a clear message. The deferred constraint
        -- triggers repeat this check at commit.
        perform public.validate_product_variant_configuration(v_variant_id);

        v_variant_ids := v_variant_ids || v_variant_id;

    end loop;


    return jsonb_build_object(
        'productId', v_product_id,
        'variantIds', to_jsonb(v_variant_ids)
    );
end;
$$;


revoke all
on function public.admin_create_product(jsonb, jsonb, jsonb)
from public, anon, authenticated;

grant execute
on function public.admin_create_product(jsonb, jsonb, jsonb)
to service_role;
