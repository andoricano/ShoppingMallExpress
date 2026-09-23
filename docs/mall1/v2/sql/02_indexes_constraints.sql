-- ============================================================
-- Mall v2
-- 02_indexes_constraints.sql
--
-- Purpose:
--   Add foreign keys, unique constraints, check constraints,
--   and indexes to the tables created by 01_tables.sql.
--
-- Not included here:
--   - RLS
--   - RPC / Functions
--   - Triggers
--
-- Important:
--   Product / ProductVariant / Ware are normally deactivated
--   instead of physically deleted after they have participated
--   in commerce.
-- ============================================================

begin;


-- ============================================================
-- ProductPost Domain
-- ============================================================

alter table public.product_post_categories
    add constraint product_post_categories_name_not_blank
    check (btrim(name) <> '');

alter table public.product_post_categories
    add constraint product_post_categories_display_order_nonnegative
    check (display_order >= 0);


create unique index product_post_categories_slug_uidx
    on public.product_post_categories (slug)
    where slug is not null;


create index product_post_categories_active_order_idx
    on public.product_post_categories (
        is_active,
        display_order
    );


alter table public.product_post_category_links
    add constraint product_post_category_links_product_post_fk
    foreign key (product_post_id)
    references public.product_posts (id)
    on delete cascade;

alter table public.product_post_category_links
    add constraint product_post_category_links_category_fk
    foreign key (category_id)
    references public.product_post_categories (id)
    on delete cascade;

alter table public.product_post_category_links
    add constraint product_post_category_links_display_order_nonnegative
    check (display_order >= 0);

alter table public.product_post_category_links
    add constraint product_post_category_links_pair_unique
    unique (product_post_id, category_id);


create index product_post_category_links_category_idx
    on public.product_post_category_links (category_id);


alter table public.product_posts
    add constraint product_posts_title_not_blank
    check (btrim(title) <> '');


create unique index product_posts_slug_uidx
    on public.product_posts (slug)
    where slug is not null;


create index product_posts_status_published_idx
    on public.product_posts (
        status,
        published_at desc
    );


-- ============================================================
-- Product Domain
-- ============================================================

alter table public.products
    add constraint products_name_not_blank
    check (btrim(name) <> '');


create index products_active_created_idx
    on public.products (
        is_active,
        created_at desc
    );


alter table public.product_post_products
    add constraint product_post_products_product_post_fk
    foreign key (product_post_id)
    references public.product_posts (id)
    on delete cascade;

alter table public.product_post_products
    add constraint product_post_products_product_fk
    foreign key (product_id)
    references public.products (id)
    on delete cascade;

alter table public.product_post_products
    add constraint product_post_products_display_order_nonnegative
    check (display_order >= 0);

alter table public.product_post_products
    add constraint product_post_products_pair_unique
    unique (product_post_id, product_id);


create index product_post_products_product_idx
    on public.product_post_products (product_id);

create index product_post_products_post_order_idx
    on public.product_post_products (
        product_post_id,
        display_order
    );


-- ============================================================
-- Product Option Domain
-- ============================================================

alter table public.product_options
    add constraint product_options_product_fk
    foreign key (product_id)
    references public.products (id)
    on delete cascade;

alter table public.product_options
    add constraint product_options_name_not_blank
    check (btrim(name) <> '');

alter table public.product_options
    add constraint product_options_display_order_nonnegative
    check (display_order >= 0);

alter table public.product_options
    add constraint product_options_product_name_unique
    unique (product_id, name);


create index product_options_product_order_idx
    on public.product_options (
        product_id,
        display_order
    );


alter table public.product_option_values
    add constraint product_option_values_option_fk
    foreign key (product_option_id)
    references public.product_options (id)
    on delete cascade;

alter table public.product_option_values
    add constraint product_option_values_value_not_blank
    check (btrim(value) <> '');

alter table public.product_option_values
    add constraint product_option_values_display_order_nonnegative
    check (display_order >= 0);

alter table public.product_option_values
    add constraint product_option_values_option_value_unique
    unique (product_option_id, value);


create index product_option_values_option_order_idx
    on public.product_option_values (
        product_option_id,
        display_order
    );

create index product_option_values_active_idx
    on public.product_option_values (
        product_option_id,
        is_active
    );


-- ============================================================
-- Product Variant Domain
-- ============================================================

alter table public.product_variants
    add constraint product_variants_product_fk
    foreign key (product_id)
    references public.products (id)
    on delete cascade;

alter table public.product_variants
    add constraint product_variants_price_nonnegative
    check (price >= 0);


create unique index product_variants_sku_code_uidx
    on public.product_variants (sku_code)
    where sku_code is not null;


create index product_variants_product_active_idx
    on public.product_variants (
        product_id,
        is_active
    );

create index product_variants_product_created_idx
    on public.product_variants (
        product_id,
        created_at
    );


alter table public.product_variant_values
    add constraint product_variant_values_variant_fk
    foreign key (product_variant_id)
    references public.product_variants (id)
    on delete cascade;

alter table public.product_variant_values
    add constraint product_variant_values_option_value_fk
    foreign key (product_option_value_id)
    references public.product_option_values (id)
    on delete cascade;

alter table public.product_variant_values
    add constraint product_variant_values_pair_unique
    unique (
        product_variant_id,
        product_option_value_id
    );


create index product_variant_values_option_value_idx
    on public.product_variant_values (
        product_option_value_id
    );


-- NOTE:
-- The following rules cannot be fully guaranteed by a simple FK/UNIQUE
-- constraint with the current normalized table structure:
--
--   1. ProductVariant and ProductOptionValue must belong to the same Product.
--   2. A ProductVariant must not select multiple values from the same
--      ProductOption.
--
-- These invariants must be validated through the Product RPC layer
-- and may additionally be protected by a trigger in 07_triggers.sql.


-- ============================================================
-- Warehouse Domain
-- ============================================================

alter table public.warehouses
    add constraint warehouses_name_not_blank
    check (btrim(name) <> '');


create unique index warehouses_code_uidx
    on public.warehouses (code)
    where code is not null;


create index warehouses_active_idx
    on public.warehouses (is_active);


alter table public.wares
    add constraint wares_warehouse_fk
    foreign key (warehouse_id)
    references public.warehouses (id)
    on delete restrict;

alter table public.wares
    add constraint wares_name_not_blank
    check (btrim(name) <> '');

alter table public.wares
    add constraint wares_ware_type_not_blank
    check (btrim(ware_type) <> '');

alter table public.wares
    add constraint wares_current_stock_nonnegative
    check (current_stock >= 0);

alter table public.wares
    add constraint wares_reserved_stock_nonnegative
    check (reserved_stock >= 0);

alter table public.wares
    add constraint wares_reserved_stock_not_over_current
    check (reserved_stock <= current_stock);


create unique index wares_warehouse_code_uidx
    on public.wares (
        warehouse_id,
        ware_code
    )
    where ware_code is not null;


create index wares_warehouse_active_idx
    on public.wares (
        warehouse_id,
        is_active
    );

create index wares_type_idx
    on public.wares (ware_type);


-- ============================================================
-- ProductVariant <-> Ware
-- ============================================================

alter table public.product_variant_wares
    add constraint product_variant_wares_variant_fk
    foreign key (product_variant_id)
    references public.product_variants (id)
    on delete cascade;

alter table public.product_variant_wares
    add constraint product_variant_wares_ware_fk
    foreign key (ware_id)
    references public.wares (id)
    on delete cascade;

alter table public.product_variant_wares
    add constraint product_variant_wares_pair_unique
    unique (
        product_variant_id,
        ware_id
    );


create index product_variant_wares_ware_idx
    on public.product_variant_wares (ware_id);


-- ============================================================
-- Wishlist Domain
-- ============================================================

alter table public.wishlist_items
    add constraint wishlist_items_client_fk
    foreign key (client_id)
    references auth.users (id)
    on delete cascade;

alter table public.wishlist_items
    add constraint wishlist_items_product_post_fk
    foreign key (product_post_id)
    references public.product_posts (id)
    on delete cascade;

alter table public.wishlist_items
    add constraint wishlist_items_client_post_unique
    unique (
        client_id,
        product_post_id
    );


create index wishlist_items_client_created_idx
    on public.wishlist_items (
        client_id,
        created_at desc
    );

create index wishlist_items_product_post_idx
    on public.wishlist_items (
        product_post_id
    );


-- ============================================================
-- Cart Domain
-- ============================================================

alter table public.carts
    add constraint carts_client_fk
    foreign key (client_id)
    references auth.users (id)
    on delete cascade;

alter table public.carts
    add constraint carts_client_unique
    unique (client_id);


alter table public.cart_items
    add constraint cart_items_cart_fk
    foreign key (cart_id)
    references public.carts (id)
    on delete cascade;

alter table public.cart_items
    add constraint cart_items_product_fk
    foreign key (product_id)
    references public.products (id)
    on delete restrict;

alter table public.cart_items
    add constraint cart_items_variant_fk
    foreign key (product_variant_id)
    references public.product_variants (id)
    on delete restrict;

alter table public.cart_items
    add constraint cart_items_quantity_positive
    check (quantity > 0);

alter table public.cart_items
    add constraint cart_items_cart_variant_unique
    unique (
        cart_id,
        product_variant_id
    );


create index cart_items_product_idx
    on public.cart_items (product_id);

create index cart_items_variant_idx
    on public.cart_items (product_variant_id);


-- NOTE:
-- product_id is intentionally retained in CartItem because the domain
-- contract identifies the purchase as Product + ProductVariant.
--
-- RPC validation must verify that:
--
--   product_variant.product_id = cart_item.product_id


-- ============================================================
-- Order Domain
-- ============================================================

alter table public.orders
    add constraint orders_client_fk
    foreign key (client_id)
    references auth.users (id)
    on delete restrict;

alter table public.orders
    add constraint orders_subtotal_nonnegative
    check (subtotal >= 0);

alter table public.orders
    add constraint orders_discount_amount_nonnegative
    check (discount_amount >= 0);

alter table public.orders
    add constraint orders_shipping_amount_nonnegative
    check (shipping_amount >= 0);

alter table public.orders
    add constraint orders_total_amount_nonnegative
    check (total_amount >= 0);


alter table public.orders
    add constraint orders_status_valid
    check (
        status in (
            'PENDING',
            'PAID',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
        )
    );


create unique index orders_order_number_uidx
    on public.orders (order_number)
    where order_number is not null;


create index orders_client_ordered_idx
    on public.orders (
        client_id,
        ordered_at desc
    );

create index orders_client_status_idx
    on public.orders (
        client_id,
        status
    );

create index orders_status_ordered_idx
    on public.orders (
        status,
        ordered_at desc
    );


alter table public.order_items
    add constraint order_items_order_fk
    foreign key (order_id)
    references public.orders (id)
    on delete cascade;

alter table public.order_items
    add constraint order_items_product_fk
    foreign key (product_id)
    references public.products (id)
    on delete restrict;

alter table public.order_items
    add constraint order_items_variant_fk
    foreign key (product_variant_id)
    references public.product_variants (id)
    on delete restrict;

alter table public.order_items
    add constraint order_items_quantity_positive
    check (quantity > 0);

alter table public.order_items
    add constraint order_items_unit_price_nonnegative
    check (unit_price >= 0);

alter table public.order_items
    add constraint order_items_line_total_nonnegative
    check (line_total >= 0);

alter table public.order_items
    add constraint order_items_product_name_snapshot_not_blank
    check (btrim(product_name_snapshot) <> '');


create index order_items_order_idx
    on public.order_items (order_id);

create index order_items_product_idx
    on public.order_items (product_id);

create index order_items_variant_idx
    on public.order_items (product_variant_id);


-- NOTE:
-- OrderItem snapshots are immutable historical information.
-- Product/ProductVariant references are retained for identity and
-- operational linkage, but historical display must use snapshot values.


-- ============================================================
-- Refund Domain
-- ============================================================

alter table public.refund_requests
    add constraint refund_requests_order_fk
    foreign key (order_id)
    references public.orders (id)
    on delete restrict;

alter table public.refund_requests
    add constraint refund_requests_client_fk
    foreign key (client_id)
    references auth.users (id)
    on delete restrict;

alter table public.refund_requests
    add constraint refund_requests_requested_amount_nonnegative
    check (
        requested_amount is null
        or requested_amount >= 0
    );


create index refund_requests_order_idx
    on public.refund_requests (order_id);

create index refund_requests_client_requested_idx
    on public.refund_requests (
        client_id,
        requested_at desc
    );

create index refund_requests_status_idx
    on public.refund_requests (status);


alter table public.refund_items
    add constraint refund_items_refund_request_fk
    foreign key (refund_request_id)
    references public.refund_requests (id)
    on delete cascade;

alter table public.refund_items
    add constraint refund_items_order_item_fk
    foreign key (order_item_id)
    references public.order_items (id)
    on delete restrict;

alter table public.refund_items
    add constraint refund_items_quantity_positive
    check (quantity > 0);

alter table public.refund_items
    add constraint refund_items_refund_amount_nonnegative
    check (refund_amount >= 0);

alter table public.refund_items
    add constraint refund_items_request_order_item_unique
    unique (
        refund_request_id,
        order_item_id
    );


create index refund_items_order_item_idx
    on public.refund_items (order_item_id);

alter table public.order_item_ware_allocations
    add constraint order_item_ware_allocations_order_item_fk
    foreign key (order_item_id)
    references public.order_items (id)
    on delete cascade;

alter table public.order_item_ware_allocations
    add constraint order_item_ware_allocations_ware_fk
    foreign key (ware_id)
    references public.wares (id)
    on delete restrict;

alter table public.order_item_ware_allocations
    add constraint order_item_ware_allocations_quantity_positive
    check (quantity > 0);

alter table public.order_item_ware_allocations
    add constraint order_item_ware_allocations_pair_unique
    unique (order_item_id, ware_id);

create index order_item_ware_allocations_ware_idx
    on public.order_item_ware_allocations (ware_id);

commit;
