-- ============================================================
-- Local verification: Consumer RPC access boundary for anon
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/consumer_rpc_anon_access.sql
--
-- Everything runs inside one transaction and is ROLLED BACK.
-- Fixtures are created as postgres, then:
--   1. an authenticated user places an order (positive control)
--   2. anon calls every Consumer RPC
-- Public-read RPCs must return only published/active data.
-- Authenticated-only RPCs must fail with "Authentication required"
-- and leave no side effects. Any violation raises an exception.
-- ============================================================

\set ON_ERROR_STOP on

begin;

-- ------------------------------------------------------------
-- Fixtures
-- ------------------------------------------------------------

create temp table _fx (key text primary key, id uuid) on commit drop;
create temp table _rpc_results (
    fn text,
    expected text,
    outcome text,
    detail text,
    ok boolean
) on commit drop;

grant select on _fx to anon, authenticated;
grant insert, select on _rpc_results to anon, authenticated;

do $$
declare
    v_created jsonb;
    v_product uuid;
    v_variant uuid;
    v_inactive uuid;
    v_ware uuid;
    v_post uuid;
    v_draft uuid;
    v_user uuid := gen_random_uuid();
begin
    v_created := public.admin_create_product(
        '{"name":"__verify active product"}',
        '[{"name":"Size","values":["M"]}]',
        '[{"price":1000,"optionValues":{"Size":"M"}}]'
    );
    v_product := (v_created ->> 'productId')::uuid;
    v_variant := (v_created -> 'variantIds' ->> 0)::uuid;

    v_inactive := (public.admin_create_product(
        '{"name":"__verify inactive product","isActive":false}',
        '[]',
        '[{"price":1000}]'
    ) ->> 'productId')::uuid;

    v_ware := public.create_ware(
        public.create_warehouse('__VERIFY_WH', '__verify warehouse', null, '{}'),
        '__verify ware', '__VERIFY_WARE', 'GENERAL', 10, '{}'
    );
    perform public.link_product_variant_ware(v_variant, v_ware);

    insert into public.product_posts (title, status)
    values ('__verify published post', 'PUBLISHED')
    returning id into v_post;

    insert into public.product_posts (title, status)
    values ('__verify draft post', 'DRAFT')
    returning id into v_draft;

    insert into public.product_post_products (product_post_id, product_id)
    values (v_post, v_product), (v_draft, v_product);

    insert into auth.users (id) values (v_user);

    insert into _fx values
        ('product', v_product), ('variant', v_variant),
        ('inactive_product', v_inactive), ('ware', v_ware),
        ('post', v_post), ('draft_post', v_draft), ('user', v_user);
end;
$$;


-- ------------------------------------------------------------
-- Positive control: authenticated user can cart + order
-- ------------------------------------------------------------

select
    set_config('request.jwt.claim.sub', (select id::text from _fx where key = 'user'), true),
    set_config('request.jwt.claims',
        json_build_object('sub', (select id::text from _fx where key = 'user'), 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

select (public.ensure_current_user_profile()).id is not null as profile_ok;
select public.add_cart_item(
    (select id from _fx where key = 'product'),
    (select id from _fx where key = 'variant'),
    1
) is not null as cart_item_ok;

-- Keep a second item in the cart so anon side effects are observable.
insert into _rpc_results
select 'create_order_from_cart', 'authenticated control', 'ok',
       o::text, o is not null
from public.create_order_from_cart('{}'::jsonb, null) as o;

reset role;

insert into _fx
select 'order', (select detail::uuid from _rpc_results where fn = 'create_order_from_cart');

-- Snapshot row counts / state before anon calls.
create temp table _before on commit drop as
select
    (select count(*) from public.carts)            as carts,
    (select count(*) from public.cart_items)       as cart_items,
    (select count(*) from public.orders)           as orders,
    (select count(*) from public.refund_requests)  as refunds,
    (select count(*) from public.user_profiles)    as profiles,
    (select status from public.orders where id = (select id from _fx where key = 'order')) as order_status,
    (select current_stock from public.wares where id = (select id from _fx where key = 'ware')) as ware_stock;


-- ------------------------------------------------------------
-- anon calls
-- ------------------------------------------------------------

select
    set_config('request.jwt.claim.sub', '', true),
    set_config('request.jwt.claims', '{"role":"anon"}', true)
\g /dev/null
set local role anon;

do $$
declare
    v_product uuid := (select id from _fx where key = 'product');
    v_variant uuid := (select id from _fx where key = 'variant');
    v_inactive uuid := (select id from _fx where key = 'inactive_product');
    v_post uuid := (select id from _fx where key = 'post');
    v_draft uuid := (select id from _fx where key = 'draft_post');
    v_order uuid := (select id from _fx where key = 'order');
    v_json jsonb;
    v_text text;
    v_call record;
begin
    -- ---------- public read ----------
    v_json := public.get_product_detail(v_product);
    insert into _rpc_results values ('get_product_detail', 'public read: active product',
        'ok', left(v_json::text, 60),
        v_json is not null and v_json::text not ilike '%ware%' and v_json::text not ilike '%stock"%');

    v_json := public.get_product_detail(v_inactive);
    insert into _rpc_results values ('get_product_detail', 'public read: inactive hidden',
        'ok', coalesce(v_json::text, 'null'), v_json is null);

    v_json := public.get_product_post_detail(v_post);
    insert into _rpc_results values ('get_product_post_detail', 'public read: published',
        'ok', left(v_json::text, 60), v_json is not null and v_json::text not ilike '%ware%');

    v_json := public.get_product_post_detail(v_draft);
    insert into _rpc_results values ('get_product_post_detail', 'public read: draft hidden',
        'ok', coalesce(v_json::text, 'null'), v_json is null);

    v_text := public.list_product_posts(null, 100, 0)::text;
    insert into _rpc_results values ('list_product_posts', 'public read: published only',
        'ok', left(v_text, 60),
        position(v_post::text in v_text) > 0 and position(v_draft::text in v_text) = 0);

    select row_to_json(a)::text into v_text
    from public.get_product_variant_availability(v_variant) a;
    insert into _rpc_results values ('get_product_variant_availability', 'public read: status only',
        'ok', v_text,
        v_text like '%"stock_status":"AVAILABLE"%' and v_text not ilike '%ware%');

    -- ---------- authenticated-only ----------
    for v_call in
        select * from (values
            ('get_cart',                  'select public.get_cart()'),
            ('get_or_create_cart',        'select public.get_or_create_cart()'),
            ('add_cart_item',             format('select public.add_cart_item(%L, %L, 1)', v_product, v_variant)),
            ('update_cart_item_quantity', format('select public.update_cart_item_quantity(%L, 5)', gen_random_uuid())),
            ('remove_cart_item',          format('select public.remove_cart_item(%L)', gen_random_uuid())),
            ('create_order_from_cart',    'select public.create_order_from_cart(''{}''::jsonb, null)'),
            ('cancel_order',              format('select public.cancel_order(%L)', v_order)),
            ('get_order_history',         'select public.get_order_history(20, 0)'),
            ('request_refund',            format('select public.request_refund(%L, ''[]''::jsonb, null)', v_order)),
            ('ensure_current_user_profile', 'select public.ensure_current_user_profile()')
        ) as t(fn, sql)
    loop
        begin
            execute v_call.sql;
            insert into _rpc_results values (v_call.fn, 'authenticated-only: reject anon',
                'EXECUTED', null, false);
        exception when others then
            insert into _rpc_results values (v_call.fn, 'authenticated-only: reject anon',
                'error', sqlerrm,
                sqlerrm = 'Authentication required' or sqlstate = '42501');
        end;
    end loop;
end;
$$;

reset role;


-- ------------------------------------------------------------
-- Report + assertions
-- ------------------------------------------------------------

select fn, expected, outcome, detail, ok
from _rpc_results
order by expected, fn;

do $$
declare
    v_before record;
    v_failures text[];
begin
    select array_agg(fn || ' (' || expected || ')')
      into v_failures
    from _rpc_results
    where not ok;

    select * into v_before from _before;

    if v_before.carts <> (select count(*) from public.carts)
       or v_before.cart_items <> (select count(*) from public.cart_items)
       or v_before.orders <> (select count(*) from public.orders)
       or v_before.refunds <> (select count(*) from public.refund_requests)
       or v_before.profiles <> (select count(*) from public.user_profiles)
       or v_before.order_status is distinct from
          (select status from public.orders where id = (select id from _fx where key = 'order'))
       or v_before.ware_stock is distinct from
          (select current_stock from public.wares where id = (select id from _fx where key = 'ware')) then
        v_failures := coalesce(v_failures, array[]::text[]) || 'anon calls changed data';
    end if;

    if cardinality(v_failures) > 0 then
        raise exception 'Consumer RPC anon access check FAILED: %', v_failures;
    end if;

    raise notice 'Consumer RPC anon access check PASSED (% checks, no side effects)',
        (select count(*) from _rpc_results);
end;
$$;

rollback;
