-- ============================================================
-- Local verification: admin_update_product() imageUrls
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/admin_update_product_image_urls.sql
--
-- Runs in one transaction and is ROLLED BACK. Each failing call
-- runs in its own subtransaction (= one PostgREST RPC request) and
-- must leave the Product (including image_urls) unchanged.
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
    v_product uuid;
    v_before text;
    v_after text;
    v_urls text[];
    v_bad jsonb;
    v_snapshot_sql constant text := $q$
        select row(name, description, is_active, image_urls)::text
        from public.products where id = $1
    $q$;
begin
    v_product := (public.admin_create_product(
        '{"name":"__verify image urls","imageUrls":["https://img.test/a.png"]}',
        '[]',
        '[{"price":1000,"skuCode":"__VERIFY-IMG"}]'
    ) ->> 'productId')::uuid;

    -- 1. imageUrls absent -> image_urls unchanged
    perform public.admin_update_product(v_product, '{"name":"__verify renamed"}', '[]', '[]');
    select image_urls into v_urls from public.products where id = v_product;
    insert into _results values ('absent imageUrls keeps image_urls',
        v_urls = array['https://img.test/a.png'], v_urls::text);

    -- 2. replace with ordered list (add + reorder)
    perform public.admin_update_product(v_product,
        '{"imageUrls":["https://img.test/c.png","https://img.test/a.png","http://img.test/b.webp"]}',
        '[]', '[]');
    select image_urls into v_urls from public.products where id = v_product;
    insert into _results values ('ordered replacement',
        v_urls = array['https://img.test/c.png','https://img.test/a.png','http://img.test/b.webp'],
        v_urls::text);

    -- 3. remove one
    perform public.admin_update_product(v_product,
        '{"imageUrls":["https://img.test/a.png"]}', '[]', '[]');
    select image_urls into v_urls from public.products where id = v_product;
    insert into _results values ('removal', v_urls = array['https://img.test/a.png'], v_urls::text);

    -- 4. empty list clears
    perform public.admin_update_product(v_product, '{"imageUrls":[]}', '[]', '[]');
    select image_urls into v_urls from public.products where id = v_product;
    insert into _results values ('empty list clears', cardinality(v_urls) = 0, v_urls::text);

    perform public.admin_update_product(v_product,
        '{"imageUrls":["https://img.test/keep.png"]}', '[]', '[]');

    -- 5. invalid values roll back together with the other product changes
    for v_bad in
        select value from jsonb_array_elements(
            '[
              {"name":"__must rollback","imageUrls":"https://img.test/x.png"},
              {"name":"__must rollback","imageUrls":["https://img.test/ok.png","blob:http://localhost/tmp"]},
              {"name":"__must rollback","imageUrls":["https://img.test/ok.png",""]},
              {"name":"__must rollback","imageUrls":["https://img.test/ok.png",1]},
              {"name":"__must rollback","imageUrls":["https://img.test/ok.png",null]},
              {"name":"__must rollback","imageUrls":["/relative.png"]},
              {"name":"__must rollback","imageUrls":["https://img.test/has space.png"]}
            ]'::jsonb)
    loop
        execute v_snapshot_sql into v_before using v_product;

        begin
            perform public.admin_update_product(v_product, v_bad, '[]', '[]');
            insert into _results values ('reject ' || (v_bad -> 'imageUrls')::text, false, 'saved');
        exception when others then
            execute v_snapshot_sql into v_after using v_product;
            insert into _results values ('reject ' || (v_bad -> 'imageUrls')::text,
                v_before = v_after, sqlerrm);
        end;
    end loop;

    -- 6. invalid imageUrls also rolls back option/variant writes in the same call
    execute v_snapshot_sql into v_before using v_product;

    begin
        perform public.admin_update_product(v_product,
            '{"imageUrls":["blob:http://localhost/tmp"]}',
            '[{"name":"__Must Rollback","values":["X"]}]',
            '[]');
        insert into _results values ('reject rolls back option writes', false, 'saved');
    exception when others then
        execute v_snapshot_sql into v_after using v_product;
        insert into _results values ('reject rolls back option writes',
            v_before = v_after
            and not exists (
                select 1 from public.product_options
                where product_id = v_product and name = '__Must Rollback'
            ),
            sqlerrm);
    end;
end;
$$;

set constraints all immediate;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'admin_update_product imageUrls check FAILED: %', v_failures;
    end if;

    raise notice 'admin_update_product imageUrls check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
