-- ============================================================
-- Mall v2
-- Restrict privileged SECURITY DEFINER RPCs to service_role
--
-- Problem:
--   The production baseline (20260924093151_remote_schema.sql)
--   grants EXECUTE on the functions below to anon and
--   authenticated. Earlier SQL only ran `revoke all ... from
--   public`, which does not remove the explicit anon /
--   authenticated grants that Supabase default privileges add to
--   new public functions. The functions are SECURITY DEFINER and
--   do not check the caller, so any browser client could promote
--   itself to ADMIN, transition refunds, or mutate Ware /
--   Warehouse stock.
--
-- Contract (docs/mall1/v2/sql/05, 06, 09, 04):
--   These RPCs are trusted server operations and are executed
--   only through the Admin Route Handlers with service_role.
--
-- Consumer-facing RPCs (cart / order / refund request / product
-- read / profile bootstrap) are intentionally NOT changed here.
-- ============================================================

do $$
declare
    v_function regprocedure;
begin
    foreach v_function in array array[
        -- User / Admin
        'public.promote_user_to_admin(uuid, text)',

        -- Admin Order / Refund lifecycle
        'public.admin_transition_order_status(uuid, text)',
        'public.admin_transition_refund_status(uuid, text)',

        -- Warehouse
        'public.create_warehouse(text, text, text, jsonb)',
        'public.update_warehouse(uuid, text, text, text, boolean, jsonb)',

        -- Ware
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

        -- ProductVariant <-> Ware
        'public.link_product_variant_ware(uuid, uuid)',
        'public.unlink_product_variant_ware(uuid, uuid)',

        -- Service-side ProductVariant validation
        'public.validate_product_variant_configuration(uuid)'
    ]::regprocedure[]
    loop
        execute format(
            'revoke all on function %s from public, anon, authenticated',
            v_function
        );

        execute format(
            'grant execute on function %s to service_role',
            v_function
        );
    end loop;
end;
$$;
