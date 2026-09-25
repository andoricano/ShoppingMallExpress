-- ============================================================
-- Local verification: admin_save_product_post()
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/admin_save_product_post.sql
--
-- Runs in one transaction and is ROLLED BACK. Each failing call
-- runs in its own subtransaction, which mirrors one PostgREST RPC
-- request: the whole call must leave no partial ProductPost body
-- or product_post_products change behind.
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
    v_a uuid;
    v_b uuid;
    v_post public.product_posts;
    v_other public.product_posts;
    v_links text;
    v_count bigint;
    v_state text;
    v_message text;

    -- ordered "product_id:display_order" list for a post
    v_links_sql constant text :=
        'select coalesce(string_agg(product_id::text || '':'' || display_order, '','' order by display_order), '''')
           from public.product_post_products where product_post_id = $1';
begin
    v_a := (public.admin_create_product('{"name":"__verify post product A"}', '[]', '[{"price":1}]') ->> 'productId')::uuid;
    v_b := (public.admin_create_product('{"name":"__verify post product B"}', '[]', '[{"price":1}]') ->> 'productId')::uuid;

    -- 1. create with ordered links (duplicate keeps first position)
    v_post := public.admin_save_product_post(
        null,
        '{"title":"__verify post","slug":"__verify-post","status":"PUBLISHED"}',
        array[v_b, v_a, v_b]
    );
    execute v_links_sql into v_links using v_post.id;
    insert into _results values ('create: post + ordered links',
        v_post.status = 'PUBLISHED' and v_post.content = '{}'::jsonb
        and v_links = v_b || ':0,' || v_a || ':1', v_links);

    -- 2. update patch only (links untouched when productIds is null)
    v_post := public.admin_save_product_post(v_post.id, '{"title":"__verify post v2"}', null);
    execute v_links_sql into v_links using v_post.id;
    insert into _results values ('update: patch keeps other columns and links',
        v_post.title = '__verify post v2' and v_post.slug = '__verify-post'
        and v_post.status = 'PUBLISHED' and v_links = v_b || ':0,' || v_a || ':1', v_links);

    -- 3. update replaces links
    v_post := public.admin_save_product_post(v_post.id, '{}', array[v_a]);
    execute v_links_sql into v_links using v_post.id;
    insert into _results values ('update: replace links', v_links = v_a || ':0', v_links);

    -- 4. update clears links
    v_post := public.admin_save_product_post(v_post.id, '{}', array[]::uuid[]);
    execute v_links_sql into v_links using v_post.id;
    insert into _results values ('update: empty productIds clears links', v_links = '', v_links);

    -- restore two links for the rollback checks below
    v_post := public.admin_save_product_post(v_post.id, '{}', array[v_a, v_b]);

    v_other := public.admin_save_product_post(null, '{"title":"__verify other","slug":"__verify-other"}', null);

    -- 5. create with unknown productIds -> nothing created
    begin
        perform public.admin_save_product_post(null, '{"title":"__verify bad create"}', array[v_a, gen_random_uuid()]);
        insert into _results values ('create: unknown productIds rejected', false, 'saved');
    exception when others then
        select count(*) into v_count from public.product_posts where title = '__verify bad create';
        insert into _results values ('create: unknown productIds rejected', v_count = 0, sqlerrm);
    end;

    -- 6. update with unknown productIds -> body and links unchanged
    begin
        perform public.admin_save_product_post(v_post.id, '{"title":"__verify changed"}', array[gen_random_uuid()]);
        insert into _results values ('update: unknown productIds rejected', false, 'saved');
    exception when others then
        execute v_links_sql into v_links using v_post.id;
        insert into _results values ('update: unknown productIds rejected',
            (select title from public.product_posts where id = v_post.id) = '__verify post v2'
            and v_links = v_a || ':0,' || v_b || ':1', sqlerrm);
    end;

    -- 7. create with duplicate slug -> 23505, nothing created
    begin
        perform public.admin_save_product_post(null, '{"title":"__verify dup create","slug":"__verify-post"}', array[v_a]);
        insert into _results values ('create: duplicate slug rejected', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        select count(*) into v_count from public.product_posts where title = '__verify dup create';
        insert into _results values ('create: duplicate slug rejected', v_state = '23505' and v_count = 0, v_state);
    end;

    -- 8. update with duplicate slug + link change -> body and links unchanged
    begin
        perform public.admin_save_product_post(v_other.id, '{"slug":"__verify-post","title":"__verify other v2"}', array[v_b]);
        insert into _results values ('update: duplicate slug rejected', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        execute v_links_sql into v_links using v_other.id;
        insert into _results values ('update: duplicate slug rejected',
            v_state = '23505'
            and (select title from public.product_posts where id = v_other.id) = '__verify other'
            and v_links = '', v_state);
    end;

    -- 9. invalid status / blank title / missing post
    begin
        perform public.admin_save_product_post(null, '{"title":"__verify bad status","status":"HIDDEN"}', null);
        insert into _results values ('invalid status rejected', false, 'saved');
    exception when others then
        insert into _results values ('invalid status rejected',
            not exists (select 1 from public.product_posts where title = '__verify bad status'), sqlerrm);
    end;

    begin
        perform public.admin_save_product_post(v_post.id, '{"title":"  "}', null);
        insert into _results values ('blank title rejected', false, 'saved');
    exception when others then
        insert into _results values ('blank title rejected', true, sqlerrm);
    end;

    begin
        perform public.admin_save_product_post(gen_random_uuid(), '{"title":"x"}', null);
        insert into _results values ('missing post -> P0002', false, 'saved');
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate;
        insert into _results values ('missing post -> P0002', v_state = 'P0002', v_state);
    end;

    -- 10. failure AFTER the post write and link delete rolls everything back.
    --     A temporary trigger makes the link INSERT fail.
    create function pg_temp.__fail_link_insert() returns trigger
    language plpgsql as $f$ begin raise exception '__forced link failure'; end $f$;
    create trigger __verify_fail_link_insert
        before insert on public.product_post_products
        for each row execute function pg_temp.__fail_link_insert();

    begin
        perform public.admin_save_product_post(null, '{"title":"__verify rollback create"}', array[v_a]);
        insert into _results values ('rollback: create when link insert fails', false, 'saved');
    exception when others then
        select count(*) into v_count from public.product_posts where title = '__verify rollback create';
        insert into _results values ('rollback: create when link insert fails', v_count = 0, sqlerrm);
    end;

    begin
        perform public.admin_save_product_post(v_post.id, '{"title":"__verify rollback update"}', array[v_b]);
        insert into _results values ('rollback: update when link insert fails', false, 'saved');
    exception when others then
        execute v_links_sql into v_links using v_post.id;
        insert into _results values ('rollback: update when link insert fails',
            (select title from public.product_posts where id = v_post.id) = '__verify post v2'
            and v_links = v_a || ':0,' || v_b || ':1', sqlerrm);
    end;

    drop trigger __verify_fail_link_insert on public.product_post_products;

    -- 11. privileges
    insert into _results values ('privilege: service_role only',
        has_function_privilege('service_role', 'public.admin_save_product_post(uuid, jsonb, uuid[])', 'execute')
        and not has_function_privilege('anon', 'public.admin_save_product_post(uuid, jsonb, uuid[])', 'execute')
        and not has_function_privilege('authenticated', 'public.admin_save_product_post(uuid, jsonb, uuid[])', 'execute'),
        null);
end;
$$;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'admin_save_product_post check FAILED: %', v_failures;
    end if;

    raise notice 'admin_save_product_post check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
