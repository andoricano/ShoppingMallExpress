-- ============================================================
-- Local verification: admin_update_product() structural edits
--   option / value / variant additions, combination changes,
--   inactive-value policy, duplicate combinations, rollback.
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/admin_update_product_structure.sql
--
-- Runs in one transaction and is ROLLED BACK. Each failing call
-- runs in its own subtransaction (= one PostgREST RPC request)
-- and must leave the whole Product configuration unchanged.
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
    v_other_option uuid;
    v_other_variant uuid;
    v_size uuid;
    v_m uuid;
    v_variant_s uuid;
    v_variant_m uuid;
    v_variant_l uuid;
    v_before text;
    v_after text;
    v_state text;
    v_detail jsonb;

    -- full snapshot of the Product configuration incl. combinations
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
               from public.product_variants where product_id = $1),
            (select string_agg(row(pvv.product_variant_id, pvv.product_option_value_id)::text, ',' order by pvv.product_variant_id, pvv.product_option_value_id)
               from public.product_variant_values pvv
               join public.product_variants pv on pv.id = pvv.product_variant_id
              where pv.product_id = $1)
        ))
    $q$;

    -- "Size/Color" labels of a Variant's current combination
    v_combo_sql constant text := $q$
        select coalesce(string_agg(po.name || '=' || pov.value, ',' order by po.name), '')
          from public.product_variant_values pvv
          join public.product_option_values pov on pov.id = pvv.product_option_value_id
          join public.product_options po on po.id = pov.product_option_id
         where pvv.product_variant_id = $1
    $q$;
    v_combo text;
begin
    v_created := public.admin_create_product(
        '{"name":"__verify structure product"}',
        '[{"name":"Size","values":["S","M"]}]',
        '[{"price":1000,"skuCode":"__VS-S","optionValues":{"Size":"S"}},
          {"price":1000,"skuCode":"__VS-M","optionValues":{"Size":"M"}}]'
    );
    v_product := (v_created ->> 'productId')::uuid;
    v_variant_s := (v_created -> 'variantIds' ->> 0)::uuid;
    v_variant_m := (v_created -> 'variantIds' ->> 1)::uuid;
    select id into v_size from public.product_options where product_id = v_product and name = 'Size';
    select id into v_m from public.product_option_values where product_option_id = v_size and value = 'M';

    v_created := public.admin_create_product(
        '{"name":"__verify structure other"}',
        '[{"name":"Material","values":["Wool"]}]',
        '[{"price":1,"skuCode":"__VS-OTHER","optionValues":{"Material":"Wool"}}]'
    );
    v_other := (v_created ->> 'productId')::uuid;
    v_other_variant := (v_created -> 'variantIds' ->> 0)::uuid;
    select id into v_other_option from public.product_options where product_id = v_other;

    -- 1. add value + new Variant using it
    perform public.admin_update_product(v_product, '{}',
        jsonb_build_array(jsonb_build_object('id', v_size,
            'values', jsonb_build_array(jsonb_build_object('value', 'L')))),
        '[{"price":1200,"skuCode":"__VS-L","optionValues":{"Size":"L"}}]');
    select id into v_variant_l from public.product_variants where sku_code = '__VS-L';
    execute v_combo_sql into v_combo using v_variant_l;
    insert into _results values ('add: option value + variant', v_combo = 'Size=L', v_combo);

    -- 2. add a required Option and give every Variant a value in the same call
    perform public.admin_update_product(v_product, '{}',
        '[{"name":"Color","isRequired":true,"values":[{"value":"Red"},{"value":"Blue"}]}]',
        jsonb_build_array(
            jsonb_build_object('id', v_variant_s, 'optionValues', jsonb_build_object('Size', 'S', 'Color', 'Red')),
            jsonb_build_object('id', v_variant_m, 'optionValues', jsonb_build_object('Size', 'M', 'Color', 'Red')),
            jsonb_build_object('id', v_variant_l, 'optionValues', jsonb_build_object('Size', 'L', 'Color', 'Blue'))
        ));
    execute v_combo_sql into v_combo using v_variant_s;
    insert into _results values ('add: required option + combinations in one call',
        v_combo = 'Color=Red,Size=S'
        and (select count(*) from public.product_options where product_id = v_product) = 2, v_combo);

    -- 3. change a Variant combination
    perform public.admin_update_product(v_product, '{}', '[]',
        jsonb_build_array(jsonb_build_object('id', v_variant_s,
            'optionValues', jsonb_build_object('Size', 'S', 'Color', 'Blue'))));
    execute v_combo_sql into v_combo using v_variant_s;
    insert into _results values ('change: variant combination', v_combo = 'Color=Blue,Size=S', v_combo);

    -- 4. deactivate value + its Variant together is allowed
    perform public.admin_update_product(v_product, '{}',
        jsonb_build_array(jsonb_build_object('id', v_size,
            'values', jsonb_build_array(jsonb_build_object('id', v_m, 'isActive', false)))),
        jsonb_build_array(jsonb_build_object('id', v_variant_m, 'isActive', false)));
    insert into _results values ('deactivate: value together with its variant',
        not (select is_active from public.product_option_values where id = v_m)
        and not (select is_active from public.product_variants where id = v_variant_m), null);

    -- Consumer contract still works (inactive Variant hidden, no Ware keys)
    v_detail := public.get_product_detail(v_product);
    insert into _results values ('consumer: get_product_detail unchanged contract',
        jsonb_array_length(v_detail -> 'variants') = 2
        and v_detail::text not ilike '%ware%', null);

    execute v_snapshot_sql into v_before using v_product;

    -- 5. rejected changes (each must roll back completely)
    begin
        -- required Option added without giving Variants a value
        perform public.admin_update_product(v_product, '{"name":"__rollback"}',
            '[{"name":"Fit","values":["Slim"]}]', '[]');
        insert into _results values ('reject: new required option not selected', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: new required option not selected', v_before = v_after, sqlerrm);
    end;

    begin
        -- deactivate a value used by an ACTIVE Variant (S uses Blue)
        perform public.admin_update_product(v_product, '{"name":"__rollback"}',
            (select jsonb_build_array(jsonb_build_object('id', po.id,
                'values', jsonb_build_array(jsonb_build_object('id', pov.id, 'isActive', false))))
               from public.product_option_values pov
               join public.product_options po on po.id = pov.product_option_id
              where po.product_id = v_product and pov.value = 'Blue'),
            '[]');
        insert into _results values ('reject: deactivate value used by active variant', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: deactivate value used by active variant', v_before = v_after, sqlerrm);
    end;

    begin
        -- reactivate a Variant whose value is inactive (M)
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            jsonb_build_array(jsonb_build_object('id', v_variant_m, 'isActive', true)));
        insert into _results values ('reject: activate variant with inactive value', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: activate variant with inactive value', v_before = v_after, sqlerrm);
    end;

    begin
        -- two active Variants with the same combination (L -> S+Blue)
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            jsonb_build_array(jsonb_build_object('id', v_variant_l,
                'optionValues', jsonb_build_object('Size', 'S', 'Color', 'Blue'))));
        insert into _results values ('reject: duplicate combination (change)', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: duplicate combination (change)', v_before = v_after, sqlerrm);
    end;

    begin
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            '[{"price":1,"optionValues":{"Size":"L","Color":"Blue"}}]');
        insert into _results values ('reject: duplicate combination (new variant)', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: duplicate combination (new variant)', v_before = v_after, sqlerrm);
    end;

    begin
        -- missing required Option in a new Variant
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            '[{"price":1,"optionValues":{"Size":"L"}}]');
        insert into _results values ('reject: new variant missing required option', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: new variant missing required option', v_before = v_after, sqlerrm);
    end;

    begin
        -- another Product's Option id
        perform public.admin_update_product(v_product, '{"name":"__rollback"}',
            jsonb_build_array(jsonb_build_object('id', v_other_option, 'name', 'hijack')), '[]');
        insert into _results values ('reject: foreign option id', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: foreign option id',
            v_before = v_after and (select name from public.product_options where id = v_other_option) = 'Material', sqlerrm);
    end;

    begin
        -- another Product's Variant id
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            jsonb_build_array(jsonb_build_object('id', v_other_variant, 'price', 5)));
        insert into _results values ('reject: foreign variant id', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: foreign variant id',
            v_before = v_after and (select price from public.product_variants where id = v_other_variant) = 1, sqlerrm);
    end;

    begin
        -- another Product's option value by name
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            '[{"price":1,"optionValues":{"Material":"Wool"}}]');
        insert into _results values ('reject: foreign option value name', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: foreign option value name', v_before = v_after, sqlerrm);
    end;

    begin
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            '[{"price":1,"skuCode":"__VS-OTHER","optionValues":{"Size":"L","Color":"Red"}}]');
        insert into _results values ('reject: duplicate sku (new variant)', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: duplicate sku (new variant)', v_state = '23505' and v_before = v_after, v_state);
    end;

    begin
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            '[{"price":-1,"optionValues":{"Size":"L","Color":"Red"}}]');
        insert into _results values ('reject: negative price (new variant)', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: negative price (new variant)', v_state = '23514' and v_before = v_after, v_state);
    end;

    begin
        perform public.admin_update_product(v_product, '{"name":"__rollback"}', '[]',
            '[{"optionValues":{"Size":"L","Color":"Red"}}]');
        insert into _results values ('reject: new variant without price', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: new variant without price', v_before = v_after, sqlerrm);
    end;

    begin
        perform public.admin_update_product(v_product, '{"name":"__rollback"}',
            '[{"name":"Empty","isRequired":false,"values":[]}]', '[]');
        insert into _results values ('reject: new option without values', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: new option without values', v_before = v_after, sqlerrm);
    end;

    begin
        perform public.admin_update_product(v_product, '{"name":"__rollback"}',
            '[{"name":"Size","values":["XL"]}]', '[]');
        insert into _results values ('reject: duplicate option name', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject: duplicate option name', v_state = '23505' and v_before = v_after, v_state);
    end;

    insert into _results values ('privilege: service_role only',
        has_function_privilege('service_role', 'public.admin_update_product(uuid, jsonb, jsonb, jsonb)', 'execute')
        and not has_function_privilege('anon', 'public.admin_update_product(uuid, jsonb, jsonb, jsonb)', 'execute')
        and not has_function_privilege('authenticated', 'public.admin_update_product(uuid, jsonb, jsonb, jsonb)', 'execute'),
        null);
end;
$$;

-- Deferred integrity triggers must also accept the successful edits.
set constraints all immediate;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'admin_update_product structure check FAILED: %', v_failures;
    end if;

    raise notice 'admin_update_product structure check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
