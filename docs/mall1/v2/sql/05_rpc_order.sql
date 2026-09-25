-- ============================================================
-- Mall v2
-- 05_rpc_order.sql
--
-- Purpose:
--   Cart RPCs
--   Order creation
--   Order-time snapshots
--   Atomic Ware stock deduction
--   Order cancellation / stock restoration
--   Order history
--   Refund request creation
--
-- Core rules:
--
--   - Consumer operates on Product / ProductVariant.
--   - Ware / Warehouse are INTERNAL ONLY.
--   - ware_id / warehouse_id are NEVER returned.
--   - ProductVariant prices are read from the DB.
--   - Consumer-supplied prices are never trusted.
--   - Order creation and stock deduction occur atomically.
--   - Order cancellation restores the exact Ware allocations
--     recorded at order creation.
--   - Refund approval does NOT automatically restock Ware.
--     Physical return/restock is a Warehouse-domain operation.
--
-- ============================================================

begin;


-- ============================================================
-- Get or Create Cart
-- ============================================================

create or replace function public.get_or_create_cart()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client_id uuid;
    v_cart_id uuid;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;

    select c.id
      into v_cart_id
    from public.carts c
    where c.client_id = v_client_id;

    if v_cart_id is null then
        insert into public.carts (
            client_id
        )
        values (
            v_client_id
        )
        returning id into v_cart_id;
    end if;

    return v_cart_id;
end;
$$;


revoke all
on function public.get_or_create_cart()
from public;

grant execute
on function public.get_or_create_cart()
to authenticated, service_role;


-- ============================================================
-- Add ProductVariant to Cart
-- ============================================================

create or replace function public.add_cart_item(
    p_product_id uuid,
    p_product_variant_id uuid,
    p_quantity integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_cart_id uuid;
    v_cart_item_id uuid;
begin
    if p_quantity <= 0 then
        raise exception 'Quantity must be greater than zero';
    end if;

    if not exists (
        select 1
        from public.product_variants pv
        join public.products p
          on p.id = pv.product_id
        where pv.id = p_product_variant_id
          and pv.product_id = p_product_id
          and pv.is_active = true
          and p.is_active = true
    ) then
        raise exception 'Product or ProductVariant is not available';
    end if;

    v_cart_id := public.get_or_create_cart();

    insert into public.cart_items (
        cart_id,
        product_id,
        product_variant_id,
        quantity
    )
    values (
        v_cart_id,
        p_product_id,
        p_product_variant_id,
        p_quantity
    )
    on conflict (
        cart_id,
        product_variant_id
    )
    do update
       set quantity =
               public.cart_items.quantity
               + excluded.quantity,
           updated_at = now()
    returning id into v_cart_item_id;

    return v_cart_item_id;
end;
$$;


revoke all
on function public.add_cart_item(uuid, uuid, integer)
from public;

grant execute
on function public.add_cart_item(uuid, uuid, integer)
to authenticated, service_role;


-- ============================================================
-- Update Cart Quantity
-- ============================================================

create or replace function public.update_cart_item_quantity(
    p_cart_item_id uuid,
    p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client_id uuid;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;

    if p_quantity <= 0 then
        raise exception 'Quantity must be greater than zero';
    end if;

    update public.cart_items ci
       set quantity = p_quantity,
           updated_at = now()
    from public.carts c
    where ci.id = p_cart_item_id
      and c.id = ci.cart_id
      and c.client_id = v_client_id;

    if not found then
        raise exception 'CartItem not found';
    end if;
end;
$$;


revoke all
on function public.update_cart_item_quantity(uuid, integer)
from public;

grant execute
on function public.update_cart_item_quantity(uuid, integer)
to authenticated, service_role;


-- ============================================================
-- Remove Cart Item
-- ============================================================

create or replace function public.remove_cart_item(
    p_cart_item_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client_id uuid;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;

    delete from public.cart_items ci
    using public.carts c
    where ci.id = p_cart_item_id
      and c.id = ci.cart_id
      and c.client_id = v_client_id;

    if not found then
        raise exception 'CartItem not found';
    end if;
end;
$$;


revoke all
on function public.remove_cart_item(uuid)
from public;

grant execute
on function public.remove_cart_item(uuid)
to authenticated, service_role;


-- ============================================================
-- Get Cart
--
-- Consumer-safe response.
-- No Ware information is exposed.
-- ============================================================

create or replace function public.get_cart()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
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

    -- No cart row yet: return an empty cart without writing
    -- (STABLE; add_cart_item() creates the cart on first add).
    if v_result is null then
        return jsonb_build_object(
            'items',
            '[]'::jsonb
        );
    end if;

    return v_result;
end;
$$;


revoke all
on function public.get_cart()
from public;

grant execute
on function public.get_cart()
to authenticated, service_role;


-- ============================================================
-- Create Order From Cart
--
-- Atomic transaction:
--
--   Cart
--     -> verify Product / ProductVariant
--     -> read current Variant price
--     -> create OrderItem snapshot
--     -> lock internal Ware rows
--     -> deduct stock
--     -> record internal Ware allocation
--     -> clear Cart
--
-- Any failure rolls the entire function call back.
-- ============================================================

create or replace function public.create_order_from_cart(
    p_shipping_address jsonb default '{}'::jsonb,
    p_payment_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client_id uuid;
    v_cart_id uuid;

    v_order_id uuid;
    v_order_item_id uuid;

    v_order_number text;

    v_subtotal numeric(14, 2) := 0;
    v_line_total numeric(14, 2);

    v_product_name text;
    v_image_url text;

    v_variant_label text;
    v_unit_price numeric(14, 2);

    v_option_snapshot jsonb;

    v_remaining bigint;
    v_available bigint;
    v_take bigint;

    v_cart_item record;
    v_ware record;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;


    -- --------------------------------------------------------
    -- Lock Cart
    -- --------------------------------------------------------

    select c.id
      into v_cart_id
    from public.carts c
    where c.client_id = v_client_id
    for update;

    if v_cart_id is null then
        raise exception 'Cart does not exist';
    end if;


    if not exists (
        select 1
        from public.cart_items ci
        where ci.cart_id = v_cart_id
    ) then
        raise exception 'Cart is empty';
    end if;


    -- --------------------------------------------------------
    -- Create Order
    -- --------------------------------------------------------

    v_order_number :=
        'ORD-'
        || to_char(
            clock_timestamp(),
            'YYYYMMDDHH24MISS'
        )
        || '-'
        || upper(
            substr(
                replace(
                    gen_random_uuid()::text,
                    '-',
                    ''
                ),
                1,
                8
            )
        );


    insert into public.orders (
        client_id,
        order_number,
        status,
        shipping_address,
        subtotal,
        discount_amount,
        shipping_amount,
        total_amount,
        payment_reference
    )
    values (
        v_client_id,
        v_order_number,
        'PENDING',
        coalesce(
            p_shipping_address,
            '{}'::jsonb
        ),
        0,
        0,
        0,
        0,
        p_payment_reference
    )
    returning id into v_order_id;


    -- --------------------------------------------------------
    -- Process Cart Items
    -- --------------------------------------------------------

    for v_cart_item in
        select
            ci.id,
            ci.product_id,
            ci.product_variant_id,
            ci.quantity
        from public.cart_items ci
        where ci.cart_id = v_cart_id
        order by ci.created_at, ci.id
    loop

        -- ----------------------------------------------------
        -- Resolve trusted Product / Variant data.
        -- Consumer prices are never accepted.
        -- ----------------------------------------------------

        select
            p.name,
            p.image_urls[1],
            pv.label,
            pv.price
        into
            v_product_name,
            v_image_url,
            v_variant_label,
            v_unit_price
        from public.product_variants pv
        join public.products p
          on p.id = pv.product_id
        where pv.id =
              v_cart_item.product_variant_id
          and pv.product_id =
              v_cart_item.product_id
          and pv.is_active = true
          and p.is_active = true;

        if not found then
            raise exception
                'ProductVariant % is not available',
                v_cart_item.product_variant_id;
        end if;


        -- ----------------------------------------------------
        -- Snapshot selected options.
        -- ----------------------------------------------------

        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'optionId',
                    po.id,

                    'optionName',
                    po.name,

                    'valueId',
                    pov.id,

                    'value',
                    pov.value
                )
                order by
                    po.display_order,
                    pov.display_order
            ),
            '[]'::jsonb
        )
        into v_option_snapshot
        from public.product_variant_values pvv
        join public.product_option_values pov
          on pov.id = pvv.product_option_value_id
        join public.product_options po
          on po.id = pov.product_option_id
        where pvv.product_variant_id =
              v_cart_item.product_variant_id;


        v_line_total :=
            v_unit_price
            * v_cart_item.quantity;


        -- ----------------------------------------------------
        -- Create immutable OrderItem snapshot.
        -- ----------------------------------------------------

        insert into public.order_items (
            order_id,
            product_id,
            product_variant_id,
            quantity,
            unit_price,
            line_total,
            product_name_snapshot,
            variant_label_snapshot,
            option_snapshot,
            image_url_snapshot
        )
        values (
            v_order_id,
            v_cart_item.product_id,
            v_cart_item.product_variant_id,
            v_cart_item.quantity,
            v_unit_price,
            v_line_total,
            v_product_name,
            v_variant_label,
            v_option_snapshot,
            v_image_url
        )
        returning id into v_order_item_id;


        -- ----------------------------------------------------
        -- Internal Ware allocation.
        --
        -- Ware rows are locked before stock mutation.
        -- Allocation may span multiple Ware records.
        -- ----------------------------------------------------

        v_remaining :=
            v_cart_item.quantity;


        for v_ware in
            select
                w.id,
                w.current_stock,
                w.reserved_stock
            from public.product_variant_wares pvw
            join public.wares w
              on w.id = pvw.ware_id
            join public.warehouses wh
              on wh.id = w.warehouse_id
            where pvw.product_variant_id =
                  v_cart_item.product_variant_id
              and w.is_active = true
              and wh.is_active = true
              and (
                  w.current_stock
                  - w.reserved_stock
              ) > 0
            order by w.id
            for update of w
        loop

            exit when v_remaining <= 0;

            v_available :=
                greatest(
                    v_ware.current_stock
                    - v_ware.reserved_stock,
                    0
                );

            v_take :=
                least(
                    v_remaining,
                    v_available
                );


            if v_take > 0 then

                update public.wares
                   set current_stock =
                           current_stock
                           - v_take,
                       updated_at = now()
                 where id = v_ware.id;


                insert into
                    public.order_item_ware_allocations (
                        order_item_id,
                        ware_id,
                        quantity
                    )
                values (
                    v_order_item_id,
                    v_ware.id,
                    v_take
                );


                v_remaining :=
                    v_remaining
                    - v_take;

            end if;

        end loop;


        if v_remaining > 0 then
            raise exception
                'Insufficient stock for ProductVariant %',
                v_cart_item.product_variant_id;
        end if;


        v_subtotal :=
            v_subtotal
            + v_line_total;

    end loop;


    -- --------------------------------------------------------
    -- Finalize Order totals.
    --
    -- Discount/shipping remain zero until those policies are
    -- introduced explicitly.
    -- --------------------------------------------------------

    update public.orders
       set subtotal = v_subtotal,
           total_amount = v_subtotal,
           updated_at = now()
     where id = v_order_id;


    -- --------------------------------------------------------
    -- Clear successful Cart.
    -- --------------------------------------------------------

    delete from public.cart_items
    where cart_id = v_cart_id;


    return v_order_id;
end;
$$;


revoke all
on function public.create_order_from_cart(jsonb, text)
from public;

grant execute
on function public.create_order_from_cart(jsonb, text)
to authenticated, service_role;


-- ============================================================
-- Cancel Order
--
-- Initial Mall v2 rule:
--
--   Only PENDING orders may be cancelled directly by Consumer.
--
-- Restores the exact Ware quantities recorded by
-- order_item_ware_allocations.
-- ============================================================

create or replace function public.cancel_order(
    p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client_id uuid;
    v_status text;
    v_allocation record;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;


    select o.status
      into v_status
    from public.orders o
    where o.id = p_order_id
      and o.client_id = v_client_id
    for update;

    if v_status is null then
        raise exception 'Order not found';
    end if;


    if v_status <> 'PENDING' then
        raise exception
            'Only PENDING orders may be cancelled';
    end if;


    -- --------------------------------------------------------
    -- Restore internal Ware stock.
    -- --------------------------------------------------------

    for v_allocation in
        select
            oiwa.ware_id,
            sum(oiwa.quantity)::bigint as quantity
        from public.order_item_ware_allocations oiwa
        join public.order_items oi
          on oi.id = oiwa.order_item_id
        where oi.order_id = p_order_id
        group by oiwa.ware_id
        order by oiwa.ware_id
    loop

        perform 1
        from public.wares w
        where w.id = v_allocation.ware_id
        for update;


        update public.wares
           set current_stock =
                   current_stock
                   + v_allocation.quantity,
               updated_at = now()
         where id = v_allocation.ware_id;

    end loop;


    update public.orders
       set status = 'CANCELLED',
           updated_at = now()
     where id = p_order_id;
end;
$$;


revoke all
on function public.cancel_order(uuid)
from public;

grant execute
on function public.cancel_order(uuid)
to authenticated, service_role;


-- ============================================================
-- Trusted Order Lifecycle Transition
--
-- Consumer cancellation remains the only PENDING -> CANCELLED
-- path because it restores the exact Ware allocations.
--
-- This service-role-only RPC advances the paid/fulfillment path:
--
--   PENDING -> PAID -> PROCESSING -> SHIPPED -> DELIVERED
-- ============================================================

create or replace function public.admin_transition_order_status(
    p_order_id uuid,
    p_next_status text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_current_status text;
begin
    if p_next_status not in (
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED'
    ) then
        raise exception
            'Unsupported target order status %',
            p_next_status;
    end if;


    select o.status
      into v_current_status
    from public.orders o
    where o.id = p_order_id
    for update;

    if v_current_status is null then
        raise exception 'Order not found';
    end if;


    if not (
        (v_current_status = 'PENDING' and p_next_status = 'PAID')
        or (v_current_status = 'PAID' and p_next_status = 'PROCESSING')
        or (v_current_status = 'PROCESSING' and p_next_status = 'SHIPPED')
        or (v_current_status = 'SHIPPED' and p_next_status = 'DELIVERED')
    ) then
        raise exception
            'Invalid order status transition from % to %',
            v_current_status,
            p_next_status;
    end if;


    update public.orders
       set status = p_next_status,
           updated_at = now()
     where id = p_order_id;
end;
$$;


revoke all
on function public.admin_transition_order_status(uuid, text)
from public;

grant execute
on function public.admin_transition_order_status(uuid, text)
to service_role;


-- ============================================================
-- Order History
--
-- History is derived from Order + OrderItem snapshots.
--
-- No separate History table.
-- No Ware information.
-- ============================================================

create or replace function public.get_order_history(
    p_limit integer default 20,
    p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client_id uuid;
    v_limit integer;
    v_offset integer;
    v_result jsonb;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;


    v_limit :=
        greatest(
            1,
            least(
                coalesce(p_limit, 20),
                100
            )
        );

    v_offset :=
        greatest(
            coalesce(p_offset, 0),
            0
        );


    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id',
                o.id,

                'orderNumber',
                o.order_number,

                'status',
                o.status,

                'shippingAddress',
                o.shipping_address,

                'subtotal',
                o.subtotal,

                'discountAmount',
                o.discount_amount,

                'shippingAmount',
                o.shipping_amount,

                'totalAmount',
                o.total_amount,

                'orderedAt',
                o.ordered_at,

                'items',
                coalesce(
                    (
                        select jsonb_agg(
                            jsonb_build_object(
                                'id',
                                oi.id,

                                'productId',
                                oi.product_id,

                                'productVariantId',
                                oi.product_variant_id,

                                'productName',
                                oi.product_name_snapshot,

                                'variantLabel',
                                oi.variant_label_snapshot,

                                'options',
                                oi.option_snapshot,

                                'imageUrl',
                                oi.image_url_snapshot,

                                'unitPrice',
                                oi.unit_price,

                                'quantity',
                                oi.quantity,

                                'lineTotal',
                                oi.line_total
                            )
                            order by oi.created_at
                        )
                        from public.order_items oi
                        where oi.order_id = o.id
                    ),
                    '[]'::jsonb
                )
            )
            order by o.ordered_at desc
        ),
        '[]'::jsonb
    )
    into v_result
    from (
        select o1.*
        from public.orders o1
        where o1.client_id = v_client_id
        order by o1.ordered_at desc
        limit v_limit
        offset v_offset
    ) o;


    return v_result;
end;
$$;


revoke all
on function public.get_order_history(integer, integer)
from public;

grant execute
on function public.get_order_history(integer, integer)
to authenticated, service_role;


-- ============================================================
-- Create Refund Request
--
-- p_items format:
--
-- [
--   {
--     "orderItemId": "uuid",
--     "quantity": 1
--   }
-- ]
--
-- Rules:
--
--   - Order must belong to auth.uid().
--   - Only DELIVERED orders can be refunded.
--   - Requested quantity cannot exceed ordered quantity.
--   - Previously active refund requests count toward the limit.
--   - Refund amount comes from immutable OrderItem unit_price.
--
-- No Ware restock occurs here.
-- ============================================================

create or replace function public.request_refund(
    p_order_id uuid,
    p_items jsonb,
    p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_client_id uuid;
    v_order_status text;

    v_refund_request_id uuid;

    v_item jsonb;
    v_order_item_id uuid;

    v_quantity integer;
    v_order_quantity integer;
    v_previous_quantity bigint;

    v_unit_price numeric(14, 2);
    v_refund_amount numeric(14, 2);
    v_total_refund numeric(14, 2) := 0;
begin
    v_client_id := auth.uid();

    if v_client_id is null then
        raise exception 'Authentication required';
    end if;


    if p_items is null
       or jsonb_typeof(p_items) <> 'array'
       or jsonb_array_length(p_items) = 0 then

        raise exception
            'Refund items are required';

    end if;


    select o.status
      into v_order_status
    from public.orders o
    where o.id = p_order_id
      and o.client_id = v_client_id;

    if v_order_status is null then
        raise exception 'Order not found';
    end if;


    if v_order_status <> 'DELIVERED' then
        raise exception
            'Order cannot be refunded in status %',
            v_order_status;
    end if;


    insert into public.refund_requests (
        order_id,
        client_id,
        status,
        reason,
        requested_amount
    )
    values (
        p_order_id,
        v_client_id,
        'REQUESTED',
        p_reason,
        0
    )
    returning id into v_refund_request_id;


    for v_item in
        select value
        from jsonb_array_elements(p_items)
    loop

        v_order_item_id :=
            nullif(
                v_item ->> 'orderItemId',
                ''
            )::uuid;

        v_quantity :=
            (v_item ->> 'quantity')::integer;


        if v_order_item_id is null
           or v_quantity is null
           or v_quantity <= 0 then

            raise exception
                'Invalid refund item';

        end if;


        select
            oi.quantity,
            oi.unit_price
        into
            v_order_quantity,
            v_unit_price
        from public.order_items oi
        where oi.id = v_order_item_id
          and oi.order_id = p_order_id;

        if not found then
            raise exception
                'OrderItem % does not belong to Order',
                v_order_item_id;
        end if;


        select coalesce(
            sum(ri.quantity),
            0
        )
        into v_previous_quantity
        from public.refund_items ri
        join public.refund_requests rr
          on rr.id = ri.refund_request_id
        where ri.order_item_id = v_order_item_id
          and rr.status not in (
              'REJECTED',
              'CANCELLED'
          );


        if (
            v_previous_quantity
            + v_quantity
        ) > v_order_quantity then

            raise exception
                'Refund quantity exceeds ordered quantity';

        end if;


        v_refund_amount :=
            v_unit_price
            * v_quantity;


        insert into public.refund_items (
            refund_request_id,
            order_item_id,
            quantity,
            refund_amount
        )
        values (
            v_refund_request_id,
            v_order_item_id,
            v_quantity,
            v_refund_amount
        );


        v_total_refund :=
            v_total_refund
            + v_refund_amount;

    end loop;


    update public.refund_requests
       set requested_amount =
               v_total_refund,
           updated_at = now()
     where id = v_refund_request_id;


    return v_refund_request_id;
end;
$$;


revoke all
on function public.request_refund(uuid, jsonb, text)
from public;

grant execute
on function public.request_refund(uuid, jsonb, text)
to authenticated, service_role;


commit;
