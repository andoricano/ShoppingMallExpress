-- ============================================================
-- Mall v2
-- Fix get_cart(): no write inside a STABLE function
--
-- get_cart() is STABLE, so PostgREST executes it in a read-only
-- transaction. For a user without a cart it called
-- get_or_create_cart(), whose INSERT failed with
-- "cannot execute INSERT in a read-only transaction" — every user
-- who had never added an item could not load the cart.
--
-- Same signature, return type, volatility, security and grants.
-- A user without a cart now gets {"items": []} without a cart row
-- being created; add_cart_item() still creates the cart on first
-- add through get_or_create_cart(), as before.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_cart()
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_client_id uuid;
    v_result jsonb;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;

    select jsonb_build_object(
        'id',
        c.id,

        'items',
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id',
                    ci.id,

                    'productId',
                    p.id,

                    'productName',
                    p.name,

                    'productVariantId',
                    pv.id,

                    'variantLabel',
                    pv.label,

                    'price',
                    pv.price,

                    'quantity',
                    ci.quantity,

                    'imageUrl',
                    p.image_urls[1],

                    'isAvailable',
                    coalesce(a.is_available, false),

                    'stockStatus',
                    coalesce(
                        a.stock_status,
                        'OUT_OF_STOCK'
                    )
                )
                order by ci.created_at
            ) filter (
                where ci.id is not null
            ),
            '[]'::jsonb
        )
    )
    into v_result
    from public.carts c
    left join public.cart_items ci
      on ci.cart_id = c.id
    left join public.products p
      on p.id = ci.product_id
    left join public.product_variants pv
      on pv.id = ci.product_variant_id
    left join lateral (
        select
            av.is_available,
            av.stock_status
        from public.get_product_variant_availability(
            pv.id
        ) av
    ) a
      on pv.id is not null
    where c.client_id = v_client_id
    group by c.id;

    -- No cart row yet: return an empty cart without writing.
    if v_result is null then
        return jsonb_build_object(
            'items',
            '[]'::jsonb
        );
    end if;

    return v_result;
end;
$function$;
