-- ============================================================
-- Local verification: admin_update_product()
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/admin_update_product.sql
--
-- Runs in one transaction and is ROLLED BACK. Each failing call
-- runs in its own subtransaction (= one PostgREST RPC request) and
-- must leave the Product, Options, Values and Variants unchanged.
-- ============================================================

\set ON_ERROR_STOP on

begin;

create temp table _results (
    scenario text,
    ok boolean,
    detail text
) on commit drop;

do $$
declare
    v_created jsonb;
    v_product uuid;
    v_other uuid;
    v_other_variant uuid;
    v_size uuid;
    v_gift uuid;
    v_s uuid;
    v_m uuid;
    v_variant_s uuid;
    v_variant_m uuid;
    v_before text;
    v_after text;
    v_state text;

    -- full snapshot of the Product configuration
    v_snapshot_sql constant text := $q$
        select md5(concat_ws('|',
            (select row(name, description, is_active)::text from public.products where id = $1),
            (select string_agg(row(id, name, is_required, display_order)::text, ',' order by id)
               from public.product_options where product_id = $1),
            (select string_agg(row(pov.id, pov.value, pov.display_order, pov.is_active)::text, ',' order by pov.id)
               from public.product_option_values pov
               join public.product_options po on po.id = pov.product_option_id
              where po.product_id = $1),
            (select string_agg(row(id, sku_code, label, price, is_active)::text, ',' order by id)
               from public.product_variants where product_id = $1)
        ))
    $q$;
begin
    v_created := public.admin_create_product(
        '{"name":"__verify update product","description":"before"}',
        '[{"name":"Size","values":["S","M"]},{"name":"Gift","isRequired":false,"values":["Wrap"]}]',
        '[{"price":1000,"skuCode":"__VERIFY-S","optionValues":{"Size":"S"}},
          {"price":1000,"skuCode":"__VERIFY-M","optionValues":{"Size":"M"}}]'
    );
    v_product := (v_created ->> 'productId')::uuid;
    v_variant_s := (v_created -> 'variantIds' ->> 0)::uuid;
    v_variant_m := (v_created -> 'variantIds' ->> 1)::uuid;

    select id into v_size from public.product_options where product_id = v_product and name = 'Size';
    select id into v_gift from public.product_options where product_id = v_product and name = 'Gift';
    select id into v_s from public.product_option_values where product_option_id = v_size and value = 'S';
    select id into v_m from public.product_option_values where product_option_id = v_size and value = 'M';

    v_created := public.admin_create_product(
        '{"name":"__verify other product"}', '[]', '[{"price":1,"skuCode":"__VERIFY-OTHER"}]'
    );
    v_other := (v_created ->> 'productId')::uuid;
    v_other_variant := (v_created -> 'variantIds' ->> 0)::uuid;

    -- 1. Product basic info patch
    perform public.admin_update_product(v_product, '{"name":"__verify updated","isActive":false}', '[]', '[]');
    insert into _results values ('product: patch name/isActive keeps description',
        (select name = '__verify updated' and not is_active and description = 'before'
           from public.products where id = v_product), null);

    -- 2. Option / OptionValue edit + new value
    perform public.admin_update_product(v_product, '{}',
        jsonb_build_array(jsonb_build_object(
            'id', v_size, 'name', 'Size(EU)', 'displayOrder', 1,
            'values', jsonb_build_array(
                jsonb_build_object('id', v_s, 'value', 'Small', 'displayOrder', 1),
                jsonb_build_object('value', 'L')
            ))),
        '[]');
    insert into _results values ('option: rename/reorder, value rename/append',
        (select name = 'Size(EU)' and display_order = 1 from public.product_options where id = v_size)
        and (select value = 'Small' and display_order = 1 from public.product_option_values where id = v_s)
        and exists (select 1 from public.product_option_values
                     where product_option_id = v_size and value = 'L' and display_order = 2),
        null);

    -- 3. Variant sku / price / active / label
    --    (value M is deactivated together with the Variant that uses it)
    perform public.admin_update_product(v_product, '{}',
        jsonb_build_array(jsonb_build_object('id', v_size,
            'values', jsonb_build_array(jsonb_build_object('id', v_m, 'isActive', false)))),
        jsonb_build_array(
            jsonb_build_object('id', v_variant_s, 'skuCode', '__VERIFY-S2', 'price', 1500, 'label', 'Small'),
            jsonb_build_object('id', v_variant_m, 'isActive', false, 'skuCode', '')
        ));
    insert into _results values ('variant: sku/price/label/isActive (+ value deactivation)',
        (select sku_code = '__VERIFY-S2' and price = 1500 and label = 'Small' and is_active
           from public.product_variants where id = v_variant_s)
        and (select sku_code is null and not is_active
           from public.product_variants where id = v_variant_m)
        and (select not is_active from public.product_option_values where id = v_m),
        null);

    execute v_snapshot_sql into v_before using v_product;

    -- 4. required Option that Variants do not select -> rollback
    begin
        perform public.admin_update_product(v_product, '{"name":"__verify must rollback"}',
            jsonb_build_array(jsonb_build_object('id', v_gift, 'isRequired', true)), '[]');
        insert into _results values ('rollback: required option breaks variants', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('rollback: required option breaks variants', v_before = v_after, sqlerrm);
    end;

    -- 5. Option of another Product -> rollback
    begin
        perform public.admin_update_product(v_other, '{"name":"__verify must rollback"}',
            jsonb_build_array(jsonb_build_object('id', v_size, 'name', 'hijack')), '[]');
        insert into _results values ('rollback: foreign option id', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('rollback: foreign option id',
            v_before = v_after
            and (select name from public.products where id = v_other) = '__verify other product', sqlerrm);
    end;

    -- 6. earlier changes in the same call roll back when a later Variant is foreign
    begin
        perform public.admin_update_product(v_product, '{"name":"__verify must rollback"}',
            jsonb_build_array(jsonb_build_object('id', v_size, 'name', 'Size(changed)')),
            jsonb_build_array(
                jsonb_build_object('id', v_variant_s, 'price', 9999),
                jsonb_build_object('id', v_other_variant, 'price', 1)
            ));
        insert into _results values ('rollback: foreign variant id after other writes', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('rollback: foreign variant id after other writes',
            v_before = v_after
            and (select price from public.product_variants where id = v_other_variant) = 1, sqlerrm);
    end;

    -- 7. duplicate SKU -> 23505
    begin
        perform public.admin_update_product(v_product, '{"name":"__verify must rollback"}', '[]',
            jsonb_build_array(jsonb_build_object('id', v_variant_s, 'skuCode', '__VERIFY-OTHER')));
        insert into _results values ('rollback: duplicate sku', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('rollback: duplicate sku', v_state = '23505' and v_before = v_after, v_state);
    end;

    -- 8. negative price -> 23514
    begin
        perform public.admin_update_product(v_product, '{}', '[]',
            jsonb_build_array(jsonb_build_object('id', v_variant_s, 'price', -1)));
        insert into _results values ('rollback: negative price', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('rollback: negative price', v_state = '23514' and v_before = v_after, v_state);
    end;

    -- 9. duplicate option value -> 23505
    begin
        perform public.admin_update_product(v_product, '{}',
            jsonb_build_array(jsonb_build_object('id', v_size,
                'values', jsonb_build_array(jsonb_build_object('id', v_m, 'value', 'Small')))), '[]');
        insert into _results values ('rollback: duplicate option value', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('rollback: duplicate option value', v_state = '23505' and v_before = v_after, v_state);
    end;

    -- 10. blank name / missing product
    begin
        perform public.admin_update_product(v_product, '{"name":"  "}', '[]', '[]');
        insert into _results values ('blank product name rejected', false, 'saved');
    exception when others then
        insert into _results values ('blank product name rejected', true, sqlerrm);
    end;

    begin
        perform public.admin_update_product(gen_random_uuid(), '{"name":"x"}', '[]', '[]');
        insert into _results values ('missing product -> P0002', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        insert into _results values ('missing product -> P0002', v_state = 'P0002', v_state);
    end;

    -- 11. privileges
    insert into _results values ('privilege: service_role only',
        has_function_privilege('service_role', 'public.admin_update_product(uuid, jsonb, jsonb, jsonb)', 'execute')
        and not has_function_privilege('anon', 'public.admin_update_product(uuid, jsonb, jsonb, jsonb)', 'execute')
        and not has_function_privilege('authenticated', 'public.admin_update_product(uuid, jsonb, jsonb, jsonb)', 'execute'),
        null);
end;
$$;

-- Deferred integrity triggers must also accept the successful updates.
set constraints all immediate;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'admin_update_product check FAILED: %', v_failures;
    end if;

    raise notice 'admin_update_product check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
