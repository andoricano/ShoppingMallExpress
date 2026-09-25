SET local check_function_bodies = off;

CREATE TABLE "public"."cart_items" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "cart_id"            uuid                     NOT NULL,
  "product_id"         uuid                     NOT NULL,
  "product_variant_id" uuid                     NOT NULL,
  "quantity"           integer                  NOT NULL DEFAULT 1,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cart_items_cart_variant_unique" UNIQUE (cart_id, product_variant_id),
  CONSTRAINT "cart_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "cart_items_quantity_positive" CHECK ((quantity > 0))
);

ALTER TABLE "public"."cart_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."carts" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "client_id"  uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "carts_client_unique" UNIQUE (client_id),
  CONSTRAINT "carts_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."carts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."client_addresses" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "client_id"      uuid                     NOT NULL,
  "label"          text,
  "recipient_name" text                     NOT NULL,
  "phone"          text                     NOT NULL,
  "zonecode"       text                     NOT NULL,
  "address"        text                     NOT NULL,
  "address_detail" text,
  "is_default"     boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "client_addresses_address_not_blank" CHECK ((btrim(address) <> ''::text)),
  CONSTRAINT "client_addresses_label_not_blank" CHECK (((label IS NULL) OR (btrim(label) <> ''::text))),
  CONSTRAINT "client_addresses_phone_not_blank" CHECK ((btrim(phone) <> ''::text)),
  CONSTRAINT "client_addresses_pkey" PRIMARY KEY (id),
  CONSTRAINT "client_addresses_recipient_name_not_blank" CHECK ((btrim(recipient_name) <> ''::text)),
  CONSTRAINT "client_addresses_zonecode_not_blank" CHECK ((btrim(zonecode) <> ''::text))
);

ALTER TABLE "public"."client_addresses"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_item_ware_allocations" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_item_id" uuid                     NOT NULL,
  "ware_id"       uuid                     NOT NULL,
  "quantity"      bigint                   NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_item_ware_allocations_pair_unique" UNIQUE (order_item_id, ware_id),
  CONSTRAINT "order_item_ware_allocations_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_item_ware_allocations_quantity_positive" CHECK ((quantity > 0))
);

ALTER TABLE "public"."order_item_ware_allocations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_items" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"               uuid                     NOT NULL,
  "product_id"             uuid                     NOT NULL,
  "product_variant_id"     uuid                     NOT NULL,
  "quantity"               integer                  NOT NULL,
  "unit_price"             numeric(14,2)            NOT NULL,
  "line_total"             numeric(14,2)            NOT NULL,
  "product_name_snapshot"  text                     NOT NULL,
  "variant_label_snapshot" text,
  "option_snapshot"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "image_url_snapshot"     text,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_items_line_total_nonnegative" CHECK ((line_total >= (0)::numeric)),
  CONSTRAINT "order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_items_product_name_snapshot_not_blank" CHECK ((btrim(product_name_snapshot) <> ''::text)),
  CONSTRAINT "order_items_quantity_positive" CHECK ((quantity > 0)),
  CONSTRAINT "order_items_unit_price_nonnegative" CHECK ((unit_price >= (0)::numeric))
);

ALTER TABLE "public"."order_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orders" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "client_id"         uuid                     NOT NULL,
  "order_number"      text,
  "status"            text                     NOT NULL DEFAULT 'PENDING'::text,
  "shipping_address"  jsonb,
  "subtotal"          numeric(14,2)            NOT NULL DEFAULT 0,
  "discount_amount"   numeric(14,2)            NOT NULL DEFAULT 0,
  "shipping_amount"   numeric(14,2)            NOT NULL DEFAULT 0,
  "total_amount"      numeric(14,2)            NOT NULL DEFAULT 0,
  "payment_reference" text,
  "ordered_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "orders_discount_amount_nonnegative" CHECK ((discount_amount >= (0)::numeric)),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "orders_shipping_amount_nonnegative" CHECK ((shipping_amount >= (0)::numeric)),
  CONSTRAINT "orders_status_valid" CHECK ((status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'PROCESSING'::text, 'SHIPPED'::text, 'DELIVERED'::text, 'CANCELLED'::text]))),
  CONSTRAINT "orders_subtotal_nonnegative" CHECK ((subtotal >= (0)::numeric)),
  CONSTRAINT "orders_total_amount_nonnegative" CHECK ((total_amount >= (0)::numeric))
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_option_values" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_option_id" uuid                     NOT NULL,
  "value"             text                     NOT NULL,
  "display_order"     integer                  NOT NULL DEFAULT 0,
  "is_active"         boolean                  NOT NULL DEFAULT true,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_option_values_display_order_nonnegative" CHECK ((display_order >= 0)),
  CONSTRAINT "product_option_values_option_value_unique" UNIQUE (product_option_id, VALUE),
  CONSTRAINT "product_option_values_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_option_values_value_not_blank" CHECK ((btrim(value) <> ''::text))
);

ALTER TABLE "public"."product_option_values"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_options" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_id"    uuid                     NOT NULL,
  "name"          text                     NOT NULL,
  "display_order" integer                  NOT NULL DEFAULT 0,
  "is_required"   boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_options_display_order_nonnegative" CHECK ((display_order >= 0)),
  CONSTRAINT "product_options_name_not_blank" CHECK ((btrim(name) <> ''::text)),
  CONSTRAINT "product_options_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_options_product_name_unique" UNIQUE (product_id, name)
);

ALTER TABLE "public"."product_options"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_post_categories" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"          text                     NOT NULL,
  "slug"          text,
  "description"   text,
  "display_order" integer                  NOT NULL DEFAULT 0,
  "is_active"     boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_post_categories_display_order_nonnegative" CHECK ((display_order >= 0)),
  CONSTRAINT "product_post_categories_name_not_blank" CHECK ((btrim(name) <> ''::text)),
  CONSTRAINT "product_post_categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."product_post_categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_post_category_links" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_post_id" uuid                     NOT NULL,
  "category_id"     uuid                     NOT NULL,
  "display_order"   integer                  NOT NULL DEFAULT 0,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_post_category_links_display_order_nonnegative" CHECK ((display_order >= 0)),
  CONSTRAINT "product_post_category_links_pair_unique" UNIQUE (product_post_id, category_id),
  CONSTRAINT "product_post_category_links_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."product_post_category_links"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_post_products" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_post_id" uuid                     NOT NULL,
  "product_id"      uuid                     NOT NULL,
  "display_order"   integer                  NOT NULL DEFAULT 0,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_post_products_display_order_nonnegative" CHECK ((display_order >= 0)),
  CONSTRAINT "product_post_products_pair_unique" UNIQUE (product_post_id, product_id),
  CONSTRAINT "product_post_products_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."product_post_products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_posts" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"         text                     NOT NULL,
  "slug"          text,
  "summary"       text,
  "content"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "thumbnail_url" text,
  "status"        text                     NOT NULL DEFAULT 'DRAFT'::text,
  "published_at"  timestamp with time zone,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_posts_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_posts_title_not_blank" CHECK ((btrim(title) <> ''::text))
);

ALTER TABLE "public"."product_posts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_variant_values" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_variant_id"      uuid                     NOT NULL,
  "product_option_value_id" uuid                     NOT NULL,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_variant_values_pair_unique" UNIQUE (product_variant_id, product_option_value_id),
  CONSTRAINT "product_variant_values_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."product_variant_values"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_variant_wares" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_variant_id" uuid                     NOT NULL,
  "ware_id"            uuid                     NOT NULL,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_variant_wares_pair_unique" UNIQUE (product_variant_id, ware_id),
  CONSTRAINT "product_variant_wares_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."product_variant_wares"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_variants" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid                     NOT NULL,
  "sku_code"   text,
  "label"      text,
  "price"      numeric(14,2)            NOT NULL,
  "is_active"  boolean                  NOT NULL DEFAULT true,
  "meta"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_variants_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_variants_price_nonnegative" CHECK ((price >= (0)::numeric))
);

ALTER TABLE "public"."product_variants"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."products" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        text                     NOT NULL,
  "description" text,
  "image_urls"  text[]                   NOT NULL DEFAULT ARRAY[]::text[],
  "is_active"   boolean                  NOT NULL DEFAULT true,
  "meta"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "products_name_not_blank" CHECK ((btrim(name) <> ''::text)),
  CONSTRAINT "products_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."refund_items" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "refund_request_id" uuid                     NOT NULL,
  "order_item_id"     uuid                     NOT NULL,
  "quantity"          integer                  NOT NULL,
  "refund_amount"     numeric(14,2)            NOT NULL,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "refund_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "refund_items_quantity_positive" CHECK ((quantity > 0)),
  CONSTRAINT "refund_items_refund_amount_nonnegative" CHECK ((refund_amount >= (0)::numeric)),
  CONSTRAINT "refund_items_request_order_item_unique" UNIQUE (refund_request_id, order_item_id)
);

ALTER TABLE "public"."refund_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."refund_requests" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"         uuid                     NOT NULL,
  "client_id"        uuid                     NOT NULL,
  "status"           text                     NOT NULL DEFAULT 'REQUESTED'::text,
  "reason"           text,
  "requested_amount" numeric(14,2),
  "requested_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "processed_at"     timestamp with time zone,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "refund_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "refund_requests_requested_amount_nonnegative" CHECK (((requested_amount IS NULL) OR (requested_amount >= (0)::numeric)))
);

ALTER TABLE "public"."refund_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_profiles" (
  "id"             uuid                     NOT NULL,
  "name"           text,
  "role"           text                     NOT NULL DEFAULT 'CLIENT'::text,
  "recipient_name" text,
  "phone"          text,
  "is_onboarded"   boolean                  NOT NULL DEFAULT false,
  "department"     text,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_profiles_name_not_blank" CHECK (((name IS NULL) OR (btrim(name) <> ''::text))),
  CONSTRAINT "user_profiles_phone_not_blank" CHECK (((phone IS NULL) OR (btrim(phone) <> ''::text))),
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_profiles_recipient_name_not_blank" CHECK (((recipient_name IS NULL) OR (btrim(recipient_name) <> ''::text))),
  CONSTRAINT "user_profiles_role_valid" CHECK ((role = ANY (ARRAY['CLIENT'::text, 'ADMIN'::text])))
);

ALTER TABLE "public"."user_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."warehouses" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        text                     NOT NULL,
  "code"        text,
  "description" text,
  "is_active"   boolean                  NOT NULL DEFAULT true,
  "meta"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "warehouses_name_not_blank" CHECK ((btrim(name) <> ''::text)),
  CONSTRAINT "warehouses_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."warehouses"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."wares" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "warehouse_id"   uuid                     NOT NULL,
  "ware_code"      text,
  "name"           text                     NOT NULL,
  "ware_type"      text                     NOT NULL DEFAULT 'GENERAL'::text,
  "current_stock"  bigint                   NOT NULL DEFAULT 0,
  "reserved_stock" bigint                   NOT NULL DEFAULT 0,
  "is_active"      boolean                  NOT NULL DEFAULT true,
  "meta"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "wares_current_stock_nonnegative" CHECK ((current_stock >= 0)),
  CONSTRAINT "wares_name_not_blank" CHECK ((btrim(name) <> ''::text)),
  CONSTRAINT "wares_pkey" PRIMARY KEY (id),
  CONSTRAINT "wares_reserved_stock_nonnegative" CHECK ((reserved_stock >= 0)),
  CONSTRAINT "wares_reserved_stock_not_over_current" CHECK ((reserved_stock <= current_stock)),
  CONSTRAINT "wares_ware_type_not_blank" CHECK ((btrim(ware_type) <> ''::text))
);

ALTER TABLE "public"."wares"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."wishlist_items" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "client_id"       uuid                     NOT NULL,
  "product_post_id" uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "wishlist_items_client_post_unique" UNIQUE (client_id, product_post_id),
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."wishlist_items"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.add_cart_item (
  p_product_id         uuid,
  p_product_variant_id uuid,
  p_quantity           integer DEFAULT 1
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.adjust_ware_stock (
  p_ware_id    uuid,
  p_adjustment bigint
)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_current_stock bigint;
    v_reserved_stock bigint;
    v_new_stock bigint;
begin

    if p_adjustment = 0 then
        raise exception
            'Stock adjustment cannot be zero';
    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_current_stock,
        v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    v_new_stock :=
        v_current_stock
        + p_adjustment;


    if v_new_stock < 0 then
        raise exception
            'Stock cannot become negative';
    end if;


    if v_new_stock < v_reserved_stock then
        raise exception
            'Stock cannot be lower than reserved stock';
    end if;


    update public.wares
       set current_stock = v_new_stock,
           updated_at = now()
     where id = p_ware_id;


    return v_new_stock;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_transition_order_status (
  p_order_id    uuid,
  p_next_status text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_current_status text;
    v_next_status text;
begin
    v_next_status := upper(btrim(p_next_status));

    if v_next_status not in (
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED'
    ) then
        raise exception
            'Unsupported target Order status: %',
            p_next_status;
    end if;

    select o.status
      into v_current_status
    from public.orders o
    where o.id = p_order_id
    for update;

    if not found then
        raise exception 'Order not found';
    end if;

    if not (
        (v_current_status = 'PENDING'    and v_next_status = 'PAID')
        or
        (v_current_status = 'PAID'       and v_next_status = 'PROCESSING')
        or
        (v_current_status = 'PROCESSING' and v_next_status = 'SHIPPED')
        or
        (v_current_status = 'SHIPPED'    and v_next_status = 'DELIVERED')
    ) then
        raise exception
            'Invalid Order status transition: % -> %',
            v_current_status,
            v_next_status;
    end if;

    update public.orders
       set status = v_next_status,
           updated_at = now()
     where id = p_order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_transition_refund_status (
  p_refund_request_id uuid,
  p_status            text
)
  RETURNS public.refund_requests
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_refund public.refund_requests;
    v_target_status text;
begin
    if p_refund_request_id is null then
        raise exception 'RefundRequest id is required';
    end if;

    if p_status is null then
        raise exception 'Refund status is required';
    end if;

    v_target_status := upper(btrim(p_status));

    if v_target_status not in (
        'APPROVED',
        'REJECTED'
    ) then
        raise exception
            'Invalid Admin refund status: %. Allowed statuses are APPROVED or REJECTED',
            p_status;
    end if;


    select rr.*
      into v_refund
    from public.refund_requests rr
    where rr.id = p_refund_request_id
    for update;

    if not found then
        raise exception
            'RefundRequest % not found',
            p_refund_request_id;
    end if;


    if v_refund.status <> 'REQUESTED' then
        raise exception
            'RefundRequest % cannot transition from % to %',
            p_refund_request_id,
            v_refund.status,
            v_target_status;
    end if;


    update public.refund_requests
       set status = v_target_status,
           updated_at = now()
     where id = p_refund_request_id
     returning *
      into v_refund;


    return v_refund;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_order (
  p_order_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.clear_previous_default_client_address()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin
    if auth.uid() is not null
       and new.client_id is distinct from auth.uid() then
        raise exception 'Cannot modify another user''s default address';
    end if;

    if new.is_default then
        update public.client_addresses
        set is_default = false
        where client_id = new.client_id
          and id is distinct from new.id
          and is_default = true;
    end if;

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.consume_reserved_ware_stock (
  p_ware_id  uuid,
  p_quantity bigint
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_current_stock bigint;
    v_reserved_stock bigint;
begin

    if p_quantity <= 0 then
        raise exception
            'Consume quantity must be positive';
    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_current_stock,
        v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if p_quantity > v_reserved_stock then
        raise exception
            'Consume quantity exceeds reserved stock';
    end if;


    update public.wares
       set current_stock =
               current_stock
               - p_quantity,

           reserved_stock =
               reserved_stock
               - p_quantity,

           updated_at = now()

     where id = p_ware_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.create_order_from_cart (
  p_shipping_address  jsonb DEFAULT '{}'::jsonb,
  p_payment_reference text  DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_ware (
  p_warehouse_id  uuid,
  p_name          text,
  p_ware_code     text   DEFAULT NULL::text,
  p_ware_type     text   DEFAULT 'GENERAL'::text,
  p_current_stock bigint DEFAULT 0,
  p_meta          jsonb  DEFAULT '{}'::jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_id uuid;
begin

    if not exists (
        select 1
        from public.warehouses wh
        where wh.id = p_warehouse_id
    ) then
        raise exception
            'Warehouse % does not exist',
            p_warehouse_id;
    end if;


    if p_name is null
       or btrim(p_name) = '' then

        raise exception
            'Ware name is required';

    end if;


    if p_ware_type is null
       or btrim(p_ware_type) = '' then

        raise exception
            'Ware type is required';

    end if;


    if p_current_stock < 0 then
        raise exception
            'Initial stock cannot be negative';
    end if;


    insert into public.wares (
        warehouse_id,
        ware_code,
        name,
        ware_type,
        current_stock,
        reserved_stock,
        meta
    )
    values (
        p_warehouse_id,
        nullif(
            btrim(p_ware_code),
            ''
        ),
        btrim(p_name),
        btrim(p_ware_type),
        p_current_stock,
        0,
        coalesce(
            p_meta,
            '{}'::jsonb
        )
    )
    returning id into v_id;


    return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_warehouse (
  p_name        text,
  p_code        text  DEFAULT NULL::text,
  p_description text  DEFAULT NULL::text,
  p_meta        jsonb DEFAULT '{}'::jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_id uuid;
begin
    if p_name is null
       or btrim(p_name) = '' then

        raise exception
            'Warehouse name is required';

    end if;


    insert into public.warehouses (
        name,
        code,
        description,
        meta
    )
    values (
        btrim(p_name),
        nullif(
            btrim(p_code),
            ''
        ),
        p_description,
        coalesce(
            p_meta,
            '{}'::jsonb
        )
    )
    returning id into v_id;


    return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_current_user_profile()
  RETURNS public.user_profiles
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_user_id uuid;
    v_profile public.user_profiles;
begin
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'Authentication required';
    end if;

    insert into public.user_profiles (
        id,
        role
    )
    values (
        v_user_id,
        'CLIENT'
    )
    on conflict (id) do nothing;

    select *
      into v_profile
    from public.user_profiles
    where id = v_user_id;

    return v_profile;
end;
$function$;

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

    if v_result is null then
        perform public.get_or_create_cart();

        return jsonb_build_object(
            'items',
            '[]'::jsonb
        );
    end if;

    return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_cart()
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_order_history (
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_product_detail (
  p_product_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_result jsonb;
begin

    select jsonb_build_object(
        'id',
        p.id,

        'name',
        p.name,

        'description',
        p.description,

        'imageUrls',
        to_jsonb(p.image_urls),

        'meta',
        p.meta,

        'options',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id',
                        po.id,

                        'name',
                        po.name,

                        'displayOrder',
                        po.display_order,

                        'isRequired',
                        po.is_required,

                        'values',
                        coalesce(
                            (
                                select jsonb_agg(
                                    jsonb_build_object(
                                        'id',
                                        pov.id,

                                        'value',
                                        pov.value,

                                        'displayOrder',
                                        pov.display_order
                                    )
                                    order by
                                        pov.display_order,
                                        pov.created_at
                                )
                                from public.product_option_values pov
                                where pov.product_option_id = po.id
                                  and pov.is_active = true
                            ),
                            '[]'::jsonb
                        )
                    )
                    order by
                        po.display_order,
                        po.created_at
                )
                from public.product_options po
                where po.product_id = p.id
            ),
            '[]'::jsonb
        ),

        'variants',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id',
                        pv.id,

                        'skuCode',
                        pv.sku_code,

                        'label',
                        pv.label,

                        'price',
                        pv.price,

                        'meta',
                        pv.meta,

                        'optionValueIds',
                        coalesce(
                            (
                                select jsonb_agg(
                                    pvv.product_option_value_id
                                    order by
                                        po2.display_order,
                                        pov2.display_order,
                                        pov2.created_at
                                )
                                from public.product_variant_values pvv
                                join public.product_option_values pov2
                                  on pov2.id =
                                     pvv.product_option_value_id
                                join public.product_options po2
                                  on po2.id =
                                     pov2.product_option_id
                                where pvv.product_variant_id = pv.id
                                  and pov2.is_active = true
                            ),
                            '[]'::jsonb
                        ),

                        'isAvailable',
                        coalesce(
                            availability.is_available,
                            false
                        ),

                        'stockStatus',
                        coalesce(
                            availability.stock_status,
                            'OUT_OF_STOCK'
                        )
                    )
                    order by
                        pv.created_at,
                        pv.id
                )
                from public.product_variants pv
                left join lateral (
                    select
                        a.is_available,
                        a.stock_status
                    from public.get_product_variant_availability(
                        pv.id
                    ) a
                ) availability
                  on true
                where pv.product_id = p.id
                  and pv.is_active = true
            ),
            '[]'::jsonb
        )
    )
    into v_result
    from public.products p
    where p.id = p_product_id
      and p.is_active = true;


    return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_post_detail (
  p_product_post_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_result jsonb;
begin

    select jsonb_build_object(
        'id',
        pp.id,

        'title',
        pp.title,

        'slug',
        pp.slug,

        'summary',
        pp.summary,

        'content',
        pp.content,

        'thumbnailUrl',
        pp.thumbnail_url,

        'publishedAt',
        pp.published_at,

        'categories',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id',
                        c.id,

                        'name',
                        c.name,

                        'slug',
                        c.slug,

                        'description',
                        c.description
                    )
                    order by
                        pcl.display_order,
                        c.display_order,
                        c.created_at
                )
                from public.product_post_category_links pcl
                join public.product_post_categories c
                  on c.id = pcl.category_id
                where pcl.product_post_id = pp.id
                  and c.is_active = true
            ),
            '[]'::jsonb
        ),

        'products',
        coalesce(
            (
                select jsonb_agg(
                    public.get_product_detail(
                        ppp.product_id
                    )
                    order by
                        ppp.display_order,
                        ppp.created_at
                )
                from public.product_post_products ppp
                join public.products p
                  on p.id = ppp.product_id
                where ppp.product_post_id = pp.id
                  and p.is_active = true
            ),
            '[]'::jsonb
        )
    )
    into v_result
    from public.product_posts pp
    where pp.id = p_product_post_id
      and pp.status = 'PUBLISHED'
      and (
          pp.published_at is null
          or pp.published_at <= now()
      );


    return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_variant_availability (
  p_product_variant_id uuid
)
  RETURNS TABLE (
    product_variant_id uuid,
    is_available       boolean,
    stock_status       text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
    with variant_info as (
        select
            pv.id,
            pv.is_active as variant_active,
            p.is_active as product_active
        from public.product_variants pv
        join public.products p
          on p.id = pv.product_id
        where pv.id = p_product_variant_id
    ),
    stock_info as (
        select
            coalesce(
                sum(
                    greatest(
                        w.current_stock - w.reserved_stock,
                        0
                    )
                ),
                0
            ) as available_stock
        from public.product_variant_wares pvw
        join public.wares w
          on w.id = pvw.ware_id
        join public.warehouses wh
          on wh.id = w.warehouse_id
        where pvw.product_variant_id = p_product_variant_id
          and w.is_active = true
          and wh.is_active = true
    )
    select
        vi.id,
        (
            vi.variant_active = true
            and vi.product_active = true
            and si.available_stock > 0
        ) as is_available,
        case
            when vi.variant_active = false
              or vi.product_active = false
                then 'UNAVAILABLE'

            when si.available_stock <= 0
                then 'OUT_OF_STOCK'

            else 'AVAILABLE'
        end as stock_status
    from variant_info vi
    cross join stock_info si;
$function$;

CREATE OR REPLACE FUNCTION public.get_ware_snapshot (
  p_warehouse_id uuid DEFAULT NULL::uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id',
                w.id,

                'warehouseId',
                w.warehouse_id,

                'wareCode',
                w.ware_code,

                'name',
                w.name,

                'wareType',
                w.ware_type,

                'currentStock',
                w.current_stock,

                'reservedStock',
                w.reserved_stock,

                'availableStock',
                (
                    w.current_stock
                    - w.reserved_stock
                ),

                'isActive',
                w.is_active,

                'meta',
                w.meta,

                'createdAt',
                w.created_at,

                'updatedAt',
                w.updated_at
            )
            order by
                w.warehouse_id,
                w.name,
                w.id
        ),
        '[]'::jsonb
    )
    from public.wares w
    where (
        p_warehouse_id is null
        or w.warehouse_id = p_warehouse_id
    );
$function$;

CREATE OR REPLACE FUNCTION public.initialize_user_profile()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin
    insert into public.user_profiles (
        id,
        role
    )
    values (
        new.id,
        'CLIENT'
    )
    on conflict (id) do nothing;

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.link_product_variant_ware (
  p_product_variant_id uuid,
  p_ware_id            uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_relation_id uuid;
begin

    if not exists (
        select 1
        from public.product_variants pv
        where pv.id = p_product_variant_id
    ) then
        raise exception
            'ProductVariant % does not exist',
            p_product_variant_id;
    end if;


    if not exists (
        select 1
        from public.wares w
        where w.id = p_ware_id
    ) then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    select pvw.id
      into v_relation_id
    from public.product_variant_wares pvw
    where pvw.product_variant_id =
          p_product_variant_id
      and pvw.ware_id =
          p_ware_id;


    if v_relation_id is not null then
        return v_relation_id;
    end if;


    insert into public.product_variant_wares (
        product_variant_id,
        ware_id
    )
    values (
        p_product_variant_id,
        p_ware_id
    )
    returning id into v_relation_id;


    return v_relation_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_product_posts (
  p_category_id uuid    DEFAULT NULL::uuid,
  p_limit       integer DEFAULT 20,
  p_offset      integer DEFAULT 0
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_limit integer;
    v_offset integer;
    v_result jsonb;
begin

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
                result.id,

                'title',
                result.title,

                'slug',
                result.slug,

                'summary',
                result.summary,

                'thumbnailUrl',
                result.thumbnail_url,

                'publishedAt',
                result.published_at
            )
            order by
                result.published_at desc nulls last,
                result.created_at desc
        ),
        '[]'::jsonb
    )
    into v_result
    from (
        select
            pp.id,
            pp.title,
            pp.slug,
            pp.summary,
            pp.thumbnail_url,
            pp.published_at,
            pp.created_at
        from public.product_posts pp
        where pp.status = 'PUBLISHED'
          and (
              pp.published_at is null
              or pp.published_at <= now()
          )
          and (
              p_category_id is null
              or exists (
                  select 1
                  from public.product_post_category_links pcl
                  join public.product_post_categories c
                    on c.id = pcl.category_id
                  where pcl.product_post_id = pp.id
                    and pcl.category_id = p_category_id
                    and c.is_active = true
              )
          )
        order by
            pp.published_at desc nulls last,
            pp.created_at desc
        limit v_limit
        offset v_offset
    ) result;


    return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_order_item_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin

    raise exception
        'OrderItem snapshots are immutable';

end;
$function$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin (
  p_user_id    uuid,
  p_department text DEFAULT NULL::text
)
  RETURNS public.user_profiles
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_profile public.user_profiles;
begin
    update public.user_profiles
    set
        role = 'ADMIN',
        department = p_department
    where id = p_user_id
      and role = 'CLIENT'
    returning *
    into v_profile;

    if v_profile.id is null then
        raise exception
            'CLIENT profile % does not exist or is already ADMIN',
            p_user_id;
    end if;

    return v_profile;
end;
$function$;

CREATE OR REPLACE FUNCTION public.release_ware_reservation (
  p_ware_id  uuid,
  p_quantity bigint
)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_reserved_stock bigint;
    v_new_reserved bigint;
begin

    if p_quantity <= 0 then
        raise exception
            'Release quantity must be positive';
    end if;


    select w.reserved_stock
      into v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if p_quantity > v_reserved_stock then
        raise exception
            'Release quantity exceeds reserved stock';
    end if;


    v_new_reserved :=
        v_reserved_stock
        - p_quantity;


    update public.wares
       set reserved_stock =
               v_new_reserved,
           updated_at = now()
     where id = p_ware_id;


    return v_new_reserved;
end;
$function$;

CREATE OR REPLACE FUNCTION public.remove_cart_item (
  p_cart_item_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.request_refund (
  p_order_id uuid,
  p_items    jsonb,
  p_reason   text  DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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


    if v_order_status in (
        'PENDING',
        'CANCELLED'
    ) then
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
$function$;

CREATE OR REPLACE FUNCTION public.reserve_ware_stock (
  p_ware_id  uuid,
  p_quantity bigint
)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_current_stock bigint;
    v_reserved_stock bigint;
    v_new_reserved bigint;
begin

    if p_quantity <= 0 then
        raise exception
            'Reservation quantity must be positive';
    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_current_stock,
        v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
      and w.is_active = true
    for update;


    if not found then
        raise exception
            'Active Ware % does not exist',
            p_ware_id;
    end if;


    v_new_reserved :=
        v_reserved_stock
        + p_quantity;


    if v_new_reserved > v_current_stock then
        raise exception
            'Insufficient available stock';
    end if;


    update public.wares
       set reserved_stock =
               v_new_reserved,
           updated_at = now()
     where id = p_ware_id;


    return v_new_reserved;
end;
$function$;

CREATE OR REPLACE FUNCTION public.restock_order_item (
  p_order_item_id  uuid,
  p_target_ware_id uuid,
  p_quantity       bigint
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_order_quantity integer;
begin

    if p_quantity <= 0 then
        raise exception
            'Restock quantity must be positive';
    end if;


    select oi.quantity
      into v_order_quantity
    from public.order_items oi
    where oi.id = p_order_item_id;


    if not found then
        raise exception
            'OrderItem % does not exist',
            p_order_item_id;
    end if;


    if p_quantity > v_order_quantity then
        raise exception
            'Restock quantity exceeds ordered quantity';
    end if;


    perform 1
    from public.wares w
    where w.id = p_target_ware_id
    for update;


    if not found then
        raise exception
            'Target Ware % does not exist',
            p_target_ware_id;
    end if;


    update public.wares
       set current_stock =
               current_stock
               + p_quantity,
           updated_at = now()
     where id = p_target_ware_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin
    new.updated_at := now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_ware_stock (
  p_ware_id       uuid,
  p_current_stock bigint
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_reserved_stock bigint;
begin

    if p_current_stock < 0 then
        raise exception
            'Stock cannot be negative';
    end if;


    select w.reserved_stock
      into v_reserved_stock
    from public.wares w
    where w.id = p_ware_id
    for update;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if p_current_stock < v_reserved_stock then
        raise exception
            'Stock cannot be lower than reserved stock';
    end if;


    update public.wares
       set current_stock =
               p_current_stock,
           updated_at = now()
     where id = p_ware_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.transfer_ware_stock (
  p_source_ware_id uuid,
  p_target_ware_id uuid,
  p_quantity       bigint
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_source_stock bigint;
    v_source_reserved bigint;
begin

    if p_source_ware_id =
       p_target_ware_id then

        raise exception
            'Source and target Ware must be different';

    end if;


    if p_quantity <= 0 then
        raise exception
            'Transfer quantity must be positive';
    end if;


    -- Lock in deterministic UUID order to reduce deadlock risk.
    perform 1
    from public.wares w
    where w.id in (
        p_source_ware_id,
        p_target_ware_id
    )
    order by w.id
    for update;


    if (
        select count(*)
        from public.wares w
        where w.id in (
            p_source_ware_id,
            p_target_ware_id
        )
    ) <> 2 then

        raise exception
            'Source or target Ware does not exist';

    end if;


    select
        w.current_stock,
        w.reserved_stock
    into
        v_source_stock,
        v_source_reserved
    from public.wares w
    where w.id = p_source_ware_id;


    if (
        v_source_stock
        - v_source_reserved
    ) < p_quantity then

        raise exception
            'Insufficient transferable stock';

    end if;


    update public.wares
       set current_stock =
               current_stock
               - p_quantity,
           updated_at = now()
     where id = p_source_ware_id;


    update public.wares
       set current_stock =
               current_stock
               + p_quantity,
           updated_at = now()
     where id = p_target_ware_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_validate_option_value()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_variant record;
    v_value_id uuid;
begin

    if tg_op = 'DELETE' then
        v_value_id := old.id;
    else
        v_value_id := new.id;
    end if;


    for v_variant in
        select distinct
            pvv.product_variant_id as id
        from public.product_variant_values pvv
        where pvv.product_option_value_id =
              v_value_id
        order by pvv.product_variant_id
    loop

        perform
            public.validate_variant_if_exists(
                v_variant.id
            );

    end loop;


    return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_validate_product_options()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin

    if tg_op = 'INSERT' then

        perform
            public.validate_product_variants(
                new.product_id
            );


    elsif tg_op = 'UPDATE' then

        perform
            public.validate_product_variants(
                old.product_id
            );

        if new.product_id
           is distinct from old.product_id then

            perform
                public.validate_product_variants(
                    new.product_id
                );

        end if;


    elsif tg_op = 'DELETE' then

        perform
            public.validate_product_variants(
                old.product_id
            );

    end if;


    return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_validate_product_variant()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin

    perform
        public.validate_variant_if_exists(
            new.id
        );

    return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_validate_variant_values()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin

    if tg_op = 'INSERT' then

        perform
            public.validate_variant_if_exists(
                new.product_variant_id
            );


    elsif tg_op = 'UPDATE' then

        perform
            public.validate_variant_if_exists(
                old.product_variant_id
            );

        if new.product_variant_id
           is distinct from old.product_variant_id then

            perform
                public.validate_variant_if_exists(
                    new.product_variant_id
                );

        end if;


    elsif tg_op = 'DELETE' then

        perform
            public.validate_variant_if_exists(
                old.product_variant_id
            );

    end if;


    return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.unlink_product_variant_ware (
  p_product_variant_id uuid,
  p_ware_id            uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_reserved_stock bigint;
begin

    select w.reserved_stock
      into v_reserved_stock
    from public.wares w
    where w.id = p_ware_id;


    if v_reserved_stock is null then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;


    if v_reserved_stock > 0 then
        raise exception
            'Ware with reserved stock cannot be unlinked';
    end if;


    delete from public.product_variant_wares pvw
    where pvw.product_variant_id =
          p_product_variant_id
      and pvw.ware_id =
          p_ware_id;


    if not found then
        raise exception
            'ProductVariant/Ware relation does not exist';
    end if;

end;
$function$;

CREATE OR REPLACE FUNCTION public.update_cart_item_quantity (
  p_cart_item_id uuid,
  p_quantity     integer
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_ware (
  p_ware_id   uuid,
  p_name      text    DEFAULT NULL::text,
  p_ware_code text    DEFAULT NULL::text,
  p_ware_type text    DEFAULT NULL::text,
  p_is_active boolean DEFAULT NULL::boolean,
  p_meta      jsonb   DEFAULT NULL::jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin

    update public.wares
       set name =
               case
                   when p_name is null
                       then name
                   when btrim(p_name) = ''
                       then name
                   else btrim(p_name)
               end,

           ware_code =
               case
                   when p_ware_code is null
                       then ware_code
                   else nullif(
                       btrim(p_ware_code),
                       ''
                   )
               end,

           ware_type =
               case
                   when p_ware_type is null
                       then ware_type
                   when btrim(p_ware_type) = ''
                       then ware_type
                   else btrim(p_ware_type)
               end,

           is_active =
               coalesce(
                   p_is_active,
                   is_active
               ),

           meta =
               coalesce(
                   p_meta,
                   meta
               ),

           updated_at = now()

     where id = p_ware_id;


    if not found then
        raise exception
            'Ware % does not exist',
            p_ware_id;
    end if;

end;
$function$;

CREATE OR REPLACE FUNCTION public.update_warehouse (
  p_warehouse_id uuid,
  p_name         text    DEFAULT NULL::text,
  p_code         text    DEFAULT NULL::text,
  p_description  text    DEFAULT NULL::text,
  p_is_active    boolean DEFAULT NULL::boolean,
  p_meta         jsonb   DEFAULT NULL::jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin

    update public.warehouses
       set name =
               case
                   when p_name is null
                       then name
                   when btrim(p_name) = ''
                       then name
                   else btrim(p_name)
               end,

           code =
               case
                   when p_code is null
                       then code
                   else nullif(
                       btrim(p_code),
                       ''
                   )
               end,

           description =
               coalesce(
                   p_description,
                   description
               ),

           is_active =
               coalesce(
                   p_is_active,
                   is_active
               ),

           meta =
               coalesce(
                   p_meta,
                   meta
               ),

           updated_at = now()

     where id = p_warehouse_id;


    if not found then
        raise exception
            'Warehouse % does not exist',
            p_warehouse_id;
    end if;

end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_product_variant_configuration (
  p_product_variant_id uuid
)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_product_id uuid;
    v_invalid_product_count bigint;
    v_duplicate_option_count bigint;
    v_missing_required_count bigint;
begin
    select pv.product_id
      into v_product_id
    from public.product_variants pv
    where pv.id = p_product_variant_id;

    if v_product_id is null then
        raise exception
            'ProductVariant % does not exist',
            p_product_variant_id;
    end if;


    -- --------------------------------------------------------
    -- Selected OptionValues must belong to the Variant Product.
    -- --------------------------------------------------------

    select count(*)
      into v_invalid_product_count
    from public.product_variant_values pvv
    join public.product_option_values pov
      on pov.id = pvv.product_option_value_id
    join public.product_options po
      on po.id = pov.product_option_id
    where pvv.product_variant_id = p_product_variant_id
      and po.product_id <> v_product_id;

    if v_invalid_product_count > 0 then
        raise exception
            'ProductVariant % contains OptionValue from another Product',
            p_product_variant_id;
    end if;


    -- --------------------------------------------------------
    -- Only one OptionValue may be selected per ProductOption.
    -- --------------------------------------------------------

    select count(*)
      into v_duplicate_option_count
    from (
        select
            pov.product_option_id
        from public.product_variant_values pvv
        join public.product_option_values pov
          on pov.id = pvv.product_option_value_id
        where pvv.product_variant_id = p_product_variant_id
        group by pov.product_option_id
        having count(*) > 1
    ) duplicate_options;

    if v_duplicate_option_count > 0 then
        raise exception
            'ProductVariant % selects multiple values from the same ProductOption',
            p_product_variant_id;
    end if;


    -- --------------------------------------------------------
    -- Required Options must have exactly one selected value.
    -- --------------------------------------------------------

    select count(*)
      into v_missing_required_count
    from public.product_options po
    where po.product_id = v_product_id
      and po.is_required = true
      and not exists (
          select 1
          from public.product_variant_values pvv
          join public.product_option_values pov
            on pov.id = pvv.product_option_value_id
          where pvv.product_variant_id = p_product_variant_id
            and pov.product_option_id = po.id
      );

    if v_missing_required_count > 0 then
        raise exception
            'ProductVariant % is missing one or more required ProductOptions',
            p_product_variant_id;
    end if;


    return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_product_variants (
  p_product_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
    v_variant record;
begin

    if p_product_id is null then
        return;
    end if;


    for v_variant in
        select pv.id
        from public.product_variants pv
        where pv.product_id = p_product_id
        order by pv.id
    loop

        perform
            public.validate_product_variant_configuration(
                v_variant.id
            );

    end loop;

end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_variant_if_exists (
  p_product_variant_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
begin

    if p_product_variant_id is null then
        return;
    end if;


    if exists (
        select 1
        from public.product_variants pv
        where pv.id = p_product_variant_id
    ) then

        perform
            public.validate_product_variant_configuration(
                p_product_variant_id
            );

    end if;

end;
$function$;

ALTER TABLE "public"."carts"
  ADD CONSTRAINT "carts_client_fk" FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_items"
  ADD CONSTRAINT "cart_items_cart_fk" FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_item_ware_allocations"
  ADD CONSTRAINT "order_item_ware_allocations_order_item_fk" FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_client_fk" FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_order_fk" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_option_values"
  ADD CONSTRAINT "product_option_values_option_fk" FOREIGN KEY (product_option_id) REFERENCES public.product_options(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_post_category_links"
  ADD CONSTRAINT "product_post_category_links_category_fk" FOREIGN KEY (category_id) REFERENCES public.product_post_categories(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_post_category_links"
  ADD CONSTRAINT "product_post_category_links_product_post_fk" FOREIGN KEY (product_post_id) REFERENCES public.product_posts(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_post_products"
  ADD CONSTRAINT "product_post_products_product_post_fk" FOREIGN KEY (product_post_id) REFERENCES public.product_posts(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_variant_values"
  ADD CONSTRAINT "product_variant_values_option_value_fk" FOREIGN KEY (product_option_value_id) REFERENCES public.product_option_values(id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_items"
  ADD CONSTRAINT "cart_items_variant_fk" FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_variant_fk" FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id) ON DELETE RESTRICT;

ALTER TABLE "public"."product_variant_values"
  ADD CONSTRAINT "product_variant_values_variant_fk" FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_variant_wares"
  ADD CONSTRAINT "product_variant_wares_variant_fk" FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_items"
  ADD CONSTRAINT "cart_items_product_fk" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_product_fk" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE "public"."product_options"
  ADD CONSTRAINT "product_options_product_fk" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_post_products"
  ADD CONSTRAINT "product_post_products_product_fk" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_variants"
  ADD CONSTRAINT "product_variants_product_fk" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."refund_items"
  ADD CONSTRAINT "refund_items_order_item_fk" FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."refund_requests"
  ADD CONSTRAINT "refund_requests_client_fk" FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE "public"."refund_requests"
  ADD CONSTRAINT "refund_requests_order_fk" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."refund_items"
  ADD CONSTRAINT "refund_items_refund_request_fk" FOREIGN KEY (refund_request_id) REFERENCES public.refund_requests(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_profiles"
  ADD CONSTRAINT "user_profiles_auth_user_fk" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."client_addresses"
  ADD CONSTRAINT "client_addresses_client_profile_fk" FOREIGN KEY (client_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_item_ware_allocations"
  ADD CONSTRAINT "order_item_ware_allocations_ware_fk" FOREIGN KEY (ware_id) REFERENCES public.wares(id) ON DELETE RESTRICT;

ALTER TABLE "public"."product_variant_wares"
  ADD CONSTRAINT "product_variant_wares_ware_fk" FOREIGN KEY (ware_id) REFERENCES public.wares(id) ON DELETE CASCADE;

ALTER TABLE "public"."wares"
  ADD CONSTRAINT "wares_warehouse_fk" FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;

ALTER TABLE "public"."wishlist_items"
  ADD CONSTRAINT "wishlist_items_client_fk" FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."wishlist_items"
  ADD CONSTRAINT "wishlist_items_product_post_fk" FOREIGN KEY (product_post_id) REFERENCES public.product_posts(id) ON DELETE CASCADE;

CREATE INDEX cart_items_product_idx ON public.cart_items USING btree (product_id);

CREATE INDEX cart_items_variant_idx ON public.cart_items USING btree (product_variant_id);

CREATE INDEX client_addresses_client_created_idx ON public.client_addresses USING btree (client_id, created_at DESC);

CREATE UNIQUE INDEX client_addresses_one_default_uidx ON public.client_addresses USING btree (client_id)
  WHERE (is_default = true);

CREATE INDEX order_item_ware_allocations_ware_idx ON public.order_item_ware_allocations USING btree (ware_id);

CREATE INDEX order_items_order_idx ON public.order_items USING btree (order_id);

CREATE INDEX order_items_product_idx ON public.order_items USING btree (product_id);

CREATE INDEX order_items_variant_idx ON public.order_items USING btree (product_variant_id);

CREATE INDEX orders_client_ordered_idx ON public.orders USING btree (client_id, ordered_at DESC);

CREATE INDEX orders_client_status_idx ON public.orders USING btree (client_id, status);

CREATE UNIQUE INDEX orders_order_number_uidx ON public.orders USING btree (order_number)
  WHERE (order_number IS NOT NULL);

CREATE INDEX orders_status_ordered_idx ON public.orders USING btree (status, ordered_at DESC);

CREATE INDEX product_option_values_active_idx ON public.product_option_values USING btree (product_option_id, is_active);

CREATE INDEX product_option_values_option_order_idx ON public.product_option_values USING btree (product_option_id, display_order);

CREATE INDEX product_options_product_order_idx ON public.product_options USING btree (product_id, display_order);

CREATE INDEX product_post_categories_active_order_idx ON public.product_post_categories USING btree (is_active, display_order);

CREATE UNIQUE INDEX product_post_categories_slug_uidx ON public.product_post_categories USING btree (slug)
  WHERE (slug IS NOT NULL);

CREATE INDEX product_post_category_links_category_idx ON public.product_post_category_links USING btree (category_id);

CREATE INDEX product_post_products_post_order_idx ON public.product_post_products USING btree (product_post_id, display_order);

CREATE INDEX product_post_products_product_idx ON public.product_post_products USING btree (product_id);

CREATE UNIQUE INDEX product_posts_slug_uidx ON public.product_posts USING btree (slug)
  WHERE (slug IS NOT NULL);

CREATE INDEX product_posts_status_published_idx ON public.product_posts USING btree (status, published_at DESC);

CREATE INDEX product_variant_values_option_value_idx ON public.product_variant_values USING btree (product_option_value_id);

CREATE INDEX product_variant_wares_ware_idx ON public.product_variant_wares USING btree (ware_id);

CREATE INDEX product_variants_product_active_idx ON public.product_variants USING btree (product_id, is_active);

CREATE INDEX product_variants_product_created_idx ON public.product_variants USING btree (product_id, created_at);

CREATE UNIQUE INDEX product_variants_sku_code_uidx ON public.product_variants USING btree (sku_code)
  WHERE (sku_code IS NOT NULL);

CREATE INDEX products_active_created_idx ON public.products USING btree (is_active, created_at DESC);

CREATE INDEX refund_items_order_item_idx ON public.refund_items USING btree (order_item_id);

CREATE INDEX refund_requests_client_requested_idx ON public.refund_requests USING btree (client_id, requested_at DESC);

CREATE INDEX refund_requests_order_idx ON public.refund_requests USING btree (order_id);

CREATE INDEX refund_requests_status_idx ON public.refund_requests USING btree (status);

CREATE INDEX warehouses_active_idx ON public.warehouses USING btree (is_active);

CREATE UNIQUE INDEX warehouses_code_uidx ON public.warehouses USING btree (code)
  WHERE (code IS NOT NULL);

CREATE INDEX wares_type_idx ON public.wares USING btree (ware_type);

CREATE INDEX wares_warehouse_active_idx ON public.wares USING btree (warehouse_id, is_active);

CREATE UNIQUE INDEX wares_warehouse_code_uidx ON public.wares USING btree (warehouse_id, ware_code)
  WHERE (ware_code IS NOT NULL);

CREATE INDEX wishlist_items_client_created_idx ON public.wishlist_items USING btree (client_id, created_at DESC);

CREATE INDEX wishlist_items_product_post_idx ON public.wishlist_items USING btree (product_post_id);

CREATE TRIGGER auth_users_initialize_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_profile();

CREATE TRIGGER cart_items_set_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER carts_set_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER client_addresses_clear_previous_default
  BEFORE INSERT OR UPDATE OF client_id, is_default ON public.client_addresses
  FOR EACH ROW
  WHEN ((new.is_default = true))
  EXECUTE FUNCTION public.clear_previous_default_client_address();

CREATE TRIGGER client_addresses_set_updated_at
  BEFORE UPDATE ON public.client_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER order_items_prevent_update
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_order_item_update();

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER product_option_values_set_updated_at
  BEFORE UPDATE ON public.product_option_values
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE CONSTRAINT TRIGGER product_option_values_validate
  AFTER INSERT OR DELETE OR UPDATE ON public.product_option_values DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_validate_option_value();

CREATE TRIGGER product_options_set_updated_at
  BEFORE UPDATE ON public.product_options
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE CONSTRAINT TRIGGER product_options_validate
  AFTER INSERT OR DELETE OR UPDATE ON public.product_options DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_validate_product_options();

CREATE TRIGGER product_post_categories_set_updated_at
  BEFORE UPDATE ON public.product_post_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER product_posts_set_updated_at
  BEFORE UPDATE ON public.product_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE CONSTRAINT TRIGGER product_variant_values_validate
  AFTER INSERT OR DELETE OR UPDATE ON public.product_variant_values DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_validate_variant_values();

CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE CONSTRAINT TRIGGER product_variants_validate
  AFTER INSERT OR UPDATE ON public.product_variants DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_validate_product_variant();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER refund_requests_set_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER warehouses_set_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER wares_set_updated_at
  BEFORE UPDATE ON public.wares
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "cart_items_owner_delete" ON "public"."cart_items"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.client_id = auth.uid())))));

CREATE POLICY "cart_items_owner_insert" ON "public"."cart_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.client_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = cart_items.product_id) AND (p.is_active = true)))) AND (EXISTS ( SELECT 1
   FROM public.product_variants pv
  WHERE ((pv.id = cart_items.product_variant_id) AND (pv.product_id = cart_items.product_id) AND (pv.is_active = true))))));

CREATE POLICY "cart_items_owner_select" ON "public"."cart_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.client_id = auth.uid())))));

CREATE POLICY "cart_items_owner_update" ON "public"."cart_items"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.client_id = auth.uid())))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.carts c
  WHERE ((c.id = cart_items.cart_id) AND (c.client_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = cart_items.product_id) AND (p.is_active = true)))) AND (EXISTS ( SELECT 1
   FROM public.product_variants pv
  WHERE ((pv.id = cart_items.product_variant_id) AND (pv.product_id = cart_items.product_id) AND (pv.is_active = true))))));

CREATE POLICY "carts_owner_delete" ON "public"."carts"
  FOR DELETE
  TO "authenticated"
  USING ((client_id = auth.uid()));

CREATE POLICY "carts_owner_insert" ON "public"."carts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((client_id = auth.uid()));

CREATE POLICY "carts_owner_select" ON "public"."carts"
  FOR SELECT
  TO "authenticated"
  USING ((client_id = auth.uid()));

CREATE POLICY "carts_owner_update" ON "public"."carts"
  FOR UPDATE
  TO "authenticated"
  USING ((client_id = auth.uid()))
  WITH CHECK ((client_id = auth.uid()));

CREATE POLICY "client_addresses_owner_delete" ON "public"."client_addresses"
  FOR DELETE
  TO "authenticated"
  USING (((client_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'CLIENT'::text))))));

CREATE POLICY "client_addresses_owner_insert" ON "public"."client_addresses"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((client_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'CLIENT'::text))))));

CREATE POLICY "client_addresses_owner_select" ON "public"."client_addresses"
  FOR SELECT
  TO "authenticated"
  USING (((client_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'CLIENT'::text))))));

CREATE POLICY "client_addresses_owner_update" ON "public"."client_addresses"
  FOR UPDATE
  TO "authenticated"
  USING (((client_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'CLIENT'::text))))))
  WITH CHECK (((client_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'CLIENT'::text))))));

CREATE POLICY "order_items_owner_select" ON "public"."order_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.client_id = auth.uid())))));

CREATE POLICY "orders_owner_select" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING ((client_id = auth.uid()));

CREATE POLICY "product_option_values_public_select" ON "public"."product_option_values"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM (public.product_options po
     JOIN public.products p ON ((p.id = po.product_id)))
  WHERE ((po.id = product_option_values.product_option_id) AND (p.is_active = true))))));

CREATE POLICY "product_options_public_select" ON "public"."product_options"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_options.product_id) AND (p.is_active = true)))));

CREATE POLICY "product_post_categories_public_select" ON "public"."product_post_categories"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((is_active = true));

CREATE POLICY "product_post_category_links_public_select" ON "public"."product_post_category_links"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM public.product_posts pp
  WHERE ((pp.id = product_post_category_links.product_post_id) AND (pp.status = 'PUBLISHED'::text) AND ((pp.published_at IS NULL) OR (pp.published_at <= now()))))) AND
    (EXISTS ( SELECT 1
   FROM public.product_post_categories c
  WHERE ((c.id = product_post_category_links.category_id) AND (c.is_active = true))))));

CREATE POLICY "product_post_products_public_select" ON "public"."product_post_products"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM public.product_posts pp
  WHERE ((pp.id = product_post_products.product_post_id) AND (pp.status = 'PUBLISHED'::text) AND ((pp.published_at IS NULL) OR (pp.published_at <= now()))))) AND (EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_post_products.product_id) AND (p.is_active = true))))));

CREATE POLICY "product_posts_public_select" ON "public"."product_posts"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((status = 'PUBLISHED'::text) AND ((published_at IS NULL) OR (published_at <= now()))));

CREATE POLICY "product_variant_values_public_select" ON "public"."product_variant_values"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM (public.product_variants pv
     JOIN public.products p ON ((p.id = pv.product_id)))
  WHERE ((pv.id = product_variant_values.product_variant_id) AND (pv.is_active = true) AND (p.is_active = true)))) AND (EXISTS ( SELECT 1
   FROM public.product_option_values pov
  WHERE ((pov.id = product_variant_values.product_option_value_id) AND (pov.is_active = true))))));

CREATE POLICY "product_variants_public_select" ON "public"."product_variants"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.is_active = true))))));

CREATE POLICY "products_public_select" ON "public"."products"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((is_active = true));

CREATE POLICY "refund_items_owner_select" ON "public"."refund_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.refund_requests rr
  WHERE ((rr.id = refund_items.refund_request_id) AND (rr.client_id = auth.uid())))));

CREATE POLICY "refund_requests_owner_select" ON "public"."refund_requests"
  FOR SELECT
  TO "authenticated"
  USING ((client_id = auth.uid()));

CREATE POLICY "user_profiles_owner_select" ON "public"."user_profiles"
  FOR SELECT
  TO "authenticated"
  USING ((id = auth.uid()));

CREATE POLICY "user_profiles_owner_update" ON "public"."user_profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "wishlist_items_owner_delete" ON "public"."wishlist_items"
  FOR DELETE
  TO "authenticated"
  USING ((client_id = auth.uid()));

CREATE POLICY "wishlist_items_owner_insert" ON "public"."wishlist_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((client_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.product_posts pp
  WHERE ((pp.id = wishlist_items.product_post_id) AND (pp.status = 'PUBLISHED'::text) AND ((pp.published_at IS NULL) OR (pp.published_at <= now())))))));

CREATE POLICY "wishlist_items_owner_select" ON "public"."wishlist_items"
  FOR SELECT
  TO "authenticated"
  USING ((client_id = auth.uid()));

REVOKE ALL ON FUNCTION "public"."add_cart_item"(uuid, uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."add_cart_item"(uuid, uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."adjust_ware_stock"(uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."adjust_ware_stock"(uuid, bigint) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."admin_transition_order_status"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."admin_transition_order_status"(uuid, text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."admin_transition_refund_status"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."admin_transition_refund_status"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."cancel_order"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."cancel_order"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."clear_previous_default_client_address"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."clear_previous_default_client_address"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."consume_reserved_ware_stock"(uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."consume_reserved_ware_stock"(uuid, bigint) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_order_from_cart"(jsonb, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_order_from_cart"(jsonb, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_ware"(uuid, text, text, text, bigint, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_ware"(uuid, text, text, text, bigint, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."create_warehouse"(text, text, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."create_warehouse"(text, text, text, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."ensure_current_user_profile"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."ensure_current_user_profile"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_cart"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_cart"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_or_create_cart"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_or_create_cart"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_order_history"(integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_order_history"(integer, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_product_detail"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_product_detail"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_product_post_detail"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_product_post_detail"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_product_variant_availability"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_product_variant_availability"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_ware_snapshot"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_ware_snapshot"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."initialize_user_profile"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."initialize_user_profile"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."link_product_variant_ware"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."link_product_variant_ware"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."list_product_posts"(uuid, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."list_product_posts"(uuid, integer, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."prevent_order_item_update"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."prevent_order_item_update"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."promote_user_to_admin"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."promote_user_to_admin"(uuid, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."release_ware_reservation"(uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."release_ware_reservation"(uuid, bigint) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."remove_cart_item"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."remove_cart_item"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."request_refund"(uuid, jsonb, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."request_refund"(uuid, jsonb, text) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."reserve_ware_stock"(uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."reserve_ware_stock"(uuid, bigint) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."restock_order_item"(uuid, uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."restock_order_item"(uuid, uuid, bigint) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_ware_stock"(uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_ware_stock"(uuid, bigint) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."transfer_ware_stock"(uuid, uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."transfer_ware_stock"(uuid, uuid, bigint) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."trigger_validate_option_value"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."trigger_validate_option_value"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."trigger_validate_product_options"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."trigger_validate_product_options"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."trigger_validate_product_variant"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."trigger_validate_product_variant"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."trigger_validate_variant_values"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."trigger_validate_variant_values"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."unlink_product_variant_ware"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."unlink_product_variant_ware"(uuid, uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_cart_item_quantity"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_cart_item_quantity"(uuid, integer) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_ware"(uuid, text, text, text, boolean, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_ware"(uuid, text, text, text, boolean, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_warehouse"(uuid, text, text, text, boolean, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_warehouse"(uuid, text, text, text, boolean, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."validate_product_variant_configuration"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."validate_product_variant_configuration"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."validate_product_variants"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."validate_product_variants"(uuid) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."validate_variant_if_exists"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."validate_variant_if_exists"(uuid) TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."carts" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."client_addresses" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_item_ware_allocations" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_option_values" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_options" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_post_categories" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_post_category_links" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_post_products" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_posts" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_variant_values" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_variant_wares" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_variants" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."refund_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."refund_requests" TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ("is_onboarded") ON TABLE "public"."user_profiles" FROM "authenticated";

GRANT UPDATE ("is_onboarded") ON TABLE "public"."user_profiles" TO "authenticated";

REVOKE ALL ("name") ON TABLE "public"."user_profiles" FROM "authenticated";

GRANT UPDATE ("name") ON TABLE "public"."user_profiles" TO "authenticated";

REVOKE ALL ("phone") ON TABLE "public"."user_profiles" FROM "authenticated";

GRANT UPDATE ("phone") ON TABLE "public"."user_profiles" TO "authenticated";

REVOKE ALL ("recipient_name") ON TABLE "public"."user_profiles" FROM "authenticated";

GRANT UPDATE ("recipient_name") ON TABLE "public"."user_profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."user_profiles" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."user_profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_profiles" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouses" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."wares" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."wishlist_items" TO "anon", "authenticated", "postgres", "service_role";

