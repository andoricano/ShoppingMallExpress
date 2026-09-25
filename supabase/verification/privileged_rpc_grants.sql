-- ============================================================
-- Local verification: privileged RPC EXECUTE privileges
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/privileged_rpc_grants.sql
--
-- Read-only. Prints the privilege matrix and raises an exception
-- (non-zero exit with ON_ERROR_STOP) if any privileged RPC is
-- executable by PUBLIC/anon/authenticated or not by service_role.
-- ============================================================

\set ON_ERROR_STOP on

with privileged(signature) as (
    values
        ('public.promote_user_to_admin(uuid, text)'),
        ('public.admin_transition_order_status(uuid, text)'),
        ('public.admin_transition_refund_status(uuid, text)'),
        ('public.admin_create_product(jsonb, jsonb, jsonb)'),
        ('public.admin_save_product_post(uuid, jsonb, uuid[])'),
        ('public.admin_update_product(uuid, jsonb, jsonb, jsonb)'),
        ('public.create_warehouse(text, text, text, jsonb)'),
        ('public.update_warehouse(uuid, text, text, text, boolean, jsonb)'),
        ('public.create_ware(uuid, text, text, text, bigint, jsonb)'),
        ('public.update_ware(uuid, text, text, text, boolean, jsonb)'),
        ('public.adjust_ware_stock(uuid, bigint)'),
        ('public.set_ware_stock(uuid, bigint)'),
        ('public.reserve_ware_stock(uuid, bigint)'),
        ('public.release_ware_reservation(uuid, bigint)'),
        ('public.consume_reserved_ware_stock(uuid, bigint)'),
        ('public.transfer_ware_stock(uuid, uuid, bigint)'),
        ('public.restock_order_item(uuid, uuid, bigint)'),
        ('public.get_ware_snapshot(uuid)'),
        ('public.link_product_variant_ware(uuid, uuid)'),
        ('public.unlink_product_variant_ware(uuid, uuid)'),
        ('public.validate_product_variant_configuration(uuid)'),
        ('public.create_payment(uuid, text, uuid, numeric)'),
        ('public.complete_payment(uuid, uuid, boolean, text, text)')
)
select
    signature,
    has_function_privilege('anon', signature, 'execute')          as anon,
    has_function_privilege('authenticated', signature, 'execute') as authenticated,
    has_function_privilege('service_role', signature, 'execute')  as service_role,
    exists (
        select 1
        from pg_proc p
        cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
        where p.oid = signature::regprocedure
          and a.grantee = 0
          and a.privilege_type = 'EXECUTE'
    )                                                              as public
from privileged
order by signature;


-- Consumer RPCs must remain callable (regression guard).
select
    signature,
    has_function_privilege('anon', signature, 'execute')          as anon,
    has_function_privilege('authenticated', signature, 'execute') as authenticated
from (values
    ('public.get_product_detail(uuid)'),
    ('public.get_product_post_detail(uuid)'),
    ('public.list_product_posts(uuid, integer, integer)'),
    ('public.get_product_variant_availability(uuid)'),
    ('public.get_cart()'),
    ('public.add_cart_item(uuid, uuid, integer)'),
    ('public.create_order_from_cart(jsonb, text)'),
    ('public.cancel_order(uuid)'),
    ('public.get_order_history(integer, integer)'),
    ('public.request_refund(uuid, jsonb, text)'),
    ('public.ensure_current_user_profile()')
) as consumer(signature)
order by signature;


do $$
declare
    v_signature text;
    v_failures text[] := array[]::text[];
    v_checked integer := 0;
begin
    foreach v_signature in array array[
        'public.promote_user_to_admin(uuid, text)',
        'public.admin_transition_order_status(uuid, text)',
        'public.admin_transition_refund_status(uuid, text)',
        'public.admin_create_product(jsonb, jsonb, jsonb)',
        'public.admin_save_product_post(uuid, jsonb, uuid[])',
        'public.admin_update_product(uuid, jsonb, jsonb, jsonb)',
        'public.create_warehouse(text, text, text, jsonb)',
        'public.update_warehouse(uuid, text, text, text, boolean, jsonb)',
        'public.create_ware(uuid, text, text, text, bigint, jsonb)',
        'public.update_ware(uuid, text, text, text, boolean, jsonb)',
        'public.adjust_ware_stock(uuid, bigint)',
        'public.set_ware_stock(uuid, bigint)',
        'public.reserve_ware_stock(uuid, bigint)',
        'public.release_ware_reservation(uuid, bigint)',
        'public.consume_reserved_ware_stock(uuid, bigint)',
        'public.transfer_ware_stock(uuid, uuid, bigint)',
        'public.restock_order_item(uuid, uuid, bigint)',
        'public.get_ware_snapshot(uuid)',
        'public.link_product_variant_ware(uuid, uuid)',
        'public.unlink_product_variant_ware(uuid, uuid)',
        'public.validate_product_variant_configuration(uuid)',
        'public.create_payment(uuid, text, uuid, numeric)',
        'public.complete_payment(uuid, uuid, boolean, text, text)'
    ]
    loop
        v_checked := v_checked + 1;

        if has_function_privilege('anon', v_signature, 'execute')
           or has_function_privilege('authenticated', v_signature, 'execute')
           or not has_function_privilege('service_role', v_signature, 'execute') then
            v_failures := v_failures || v_signature;
        end if;
    end loop;

    if cardinality(v_failures) > 0 then
        raise exception 'Privileged RPC grant check FAILED: %', v_failures;
    end if;

    raise notice 'Privileged RPC grant check PASSED (% functions)', v_checked;
end;
$$;
