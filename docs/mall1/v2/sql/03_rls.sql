-- ============================================================
-- Mall v2
-- 03_rls.sql
--
-- Purpose:
--   Enable Row Level Security and define Consumer-facing
--   access boundaries.
--
-- Core rules:
--
--   1. Public catalog data may be read by Consumers only when
--      it is published / active.
--
--   2. Wishlist / Cart / Order / Refund data is scoped to
--      auth.uid().
--
--   3. Warehouse / Ware / ProductVariant-Ware relations are
--      internal-only and are NEVER exposed to Consumers.
--
--   4. Sensitive commerce writes such as:
--         - Order creation
--         - OrderItem creation
--         - Refund mutation
--         - Ware stock mutation
--      are NOT directly allowed through table RLS.
--      They must go through trusted RPC/server boundaries.
--
--   5. No custom Admin role policy is defined here.
--      Server-side service_role access bypasses RLS.
--
-- ============================================================

begin;


-- ============================================================
-- Enable RLS
-- ============================================================

alter table public.product_posts
    enable row level security;

alter table public.product_post_categories
    enable row level security;

alter table public.product_post_category_links
    enable row level security;

alter table public.products
    enable row level security;

alter table public.product_post_products
    enable row level security;

alter table public.product_options
    enable row level security;

alter table public.product_option_values
    enable row level security;

alter table public.product_variants
    enable row level security;

alter table public.product_variant_values
    enable row level security;

alter table public.warehouses
    enable row level security;

alter table public.wares
    enable row level security;

alter table public.product_variant_wares
    enable row level security;

alter table public.wishlist_items
    enable row level security;

alter table public.carts
    enable row level security;

alter table public.cart_items
    enable row level security;

alter table public.orders
    enable row level security;

alter table public.order_items
    enable row level security;

alter table public.refund_requests
    enable row level security;

alter table public.refund_items
    enable row level security;


-- ============================================================
-- ProductPost
--
-- Consumer:
--   Published ProductPosts only.
-- ============================================================

create policy product_posts_public_select
on public.product_posts
for select
to anon, authenticated
using (
    status = 'PUBLISHED'
    and (
        published_at is null
        or published_at <= now()
    )
);


-- ============================================================
-- ProductPost Categories
--
-- Consumer:
--   Active categories only.
-- ============================================================

create policy product_post_categories_public_select
on public.product_post_categories
for select
to anon, authenticated
using (
    is_active = true
);


-- ============================================================
-- ProductPost <-> Category Links
--
-- Only expose links belonging to visible ProductPosts
-- and active Categories.
-- ============================================================

create policy product_post_category_links_public_select
on public.product_post_category_links
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.product_posts pp
        where pp.id = product_post_category_links.product_post_id
          and pp.status = 'PUBLISHED'
          and (
              pp.published_at is null
              or pp.published_at <= now()
          )
    )
    and exists (
        select 1
        from public.product_post_categories c
        where c.id = product_post_category_links.category_id
          and c.is_active = true
    )
);


-- ============================================================
-- Products
--
-- Consumer:
--   Active Products only.
-- ============================================================

create policy products_public_select
on public.products
for select
to anon, authenticated
using (
    is_active = true
);


-- ============================================================
-- ProductPost <-> Product Links
--
-- Only expose relations where:
--   - ProductPost is published
--   - Product is active
-- ============================================================

create policy product_post_products_public_select
on public.product_post_products
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.product_posts pp
        where pp.id = product_post_products.product_post_id
          and pp.status = 'PUBLISHED'
          and (
              pp.published_at is null
              or pp.published_at <= now()
          )
    )
    and exists (
        select 1
        from public.products p
        where p.id = product_post_products.product_id
          and p.is_active = true
    )
);


-- ============================================================
-- Product Options
--
-- ProductOption currently has no is_active field.
-- Visibility therefore follows Product.is_active.
-- ============================================================

create policy product_options_public_select
on public.product_options
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.products p
        where p.id = product_options.product_id
          and p.is_active = true
    )
);


-- ============================================================
-- Product Option Values
--
-- Consumer:
--   Active ProductOptionValues belonging to active Products.
-- ============================================================

create policy product_option_values_public_select
on public.product_option_values
for select
to anon, authenticated
using (
    is_active = true
    and exists (
        select 1
        from public.product_options po
        join public.products p
          on p.id = po.product_id
        where po.id = product_option_values.product_option_id
          and p.is_active = true
    )
);


-- ============================================================
-- Product Variants
--
-- Consumer:
--   Active ProductVariants belonging to active Products.
--
-- IMPORTANT:
--   Ware information is NOT exposed here.
--   Consumer stock availability will later be returned through
--   a safe RPC/API representation.
-- ============================================================

create policy product_variants_public_select
on public.product_variants
for select
to anon, authenticated
using (
    is_active = true
    and exists (
        select 1
        from public.products p
        where p.id = product_variants.product_id
          and p.is_active = true
    )
);


-- ============================================================
-- ProductVariant <-> ProductOptionValue
--
-- Only expose combinations belonging to visible Variants
-- and active OptionValues.
-- ============================================================

create policy product_variant_values_public_select
on public.product_variant_values
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.product_variants pv
        join public.products p
          on p.id = pv.product_id
        where pv.id = product_variant_values.product_variant_id
          and pv.is_active = true
          and p.is_active = true
    )
    and exists (
        select 1
        from public.product_option_values pov
        where pov.id = product_variant_values.product_option_value_id
          and pov.is_active = true
    )
);


-- ============================================================
-- Warehouse Domain
--
-- INTERNAL ONLY.
--
-- No Consumer policies are created for:
--
--   warehouses
--   wares
--   product_variant_wares
--
-- With RLS enabled and no anon/authenticated policy,
-- Consumer access is denied.
--
-- service_role / trusted backend may operate internally.
-- ============================================================


-- ============================================================
-- Wishlist
--
-- Wishlist belongs to the authenticated user and references
-- ProductPost.
-- ============================================================

create policy wishlist_items_owner_select
on public.wishlist_items
for select
to authenticated
using (
    client_id = auth.uid()
);


create policy wishlist_items_owner_insert
on public.wishlist_items
for insert
to authenticated
with check (
    client_id = auth.uid()
    and exists (
        select 1
        from public.product_posts pp
        where pp.id = wishlist_items.product_post_id
          and pp.status = 'PUBLISHED'
          and (
              pp.published_at is null
              or pp.published_at <= now()
          )
    )
);


create policy wishlist_items_owner_delete
on public.wishlist_items
for delete
to authenticated
using (
    client_id = auth.uid()
);


-- No UPDATE policy is required.
-- Wishlist identity is client + ProductPost.
-- A change should be represented as delete + insert.


-- ============================================================
-- Cart
--
-- Each authenticated user owns their Cart.
-- ============================================================

create policy carts_owner_select
on public.carts
for select
to authenticated
using (
    client_id = auth.uid()
);


create policy carts_owner_insert
on public.carts
for insert
to authenticated
with check (
    client_id = auth.uid()
);


create policy carts_owner_update
on public.carts
for update
to authenticated
using (
    client_id = auth.uid()
)
with check (
    client_id = auth.uid()
);


create policy carts_owner_delete
on public.carts
for delete
to authenticated
using (
    client_id = auth.uid()
);


-- ============================================================
-- Cart Items
--
-- Ownership is inherited through Cart.
--
-- Product / ProductVariant relationship correctness is further
-- validated by the product/order RPC layer.
-- ============================================================

create policy cart_items_owner_select
on public.cart_items
for select
to authenticated
using (
    exists (
        select 1
        from public.carts c
        where c.id = cart_items.cart_id
          and c.client_id = auth.uid()
    )
);


create policy cart_items_owner_insert
on public.cart_items
for insert
to authenticated
with check (
    exists (
        select 1
        from public.carts c
        where c.id = cart_items.cart_id
          and c.client_id = auth.uid()
    )
    and exists (
        select 1
        from public.products p
        where p.id = cart_items.product_id
          and p.is_active = true
    )
    and exists (
        select 1
        from public.product_variants pv
        where pv.id = cart_items.product_variant_id
          and pv.product_id = cart_items.product_id
          and pv.is_active = true
    )
);


create policy cart_items_owner_update
on public.cart_items
for update
to authenticated
using (
    exists (
        select 1
        from public.carts c
        where c.id = cart_items.cart_id
          and c.client_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.carts c
        where c.id = cart_items.cart_id
          and c.client_id = auth.uid()
    )
    and exists (
        select 1
        from public.products p
        where p.id = cart_items.product_id
          and p.is_active = true
    )
    and exists (
        select 1
        from public.product_variants pv
        where pv.id = cart_items.product_variant_id
          and pv.product_id = cart_items.product_id
          and pv.is_active = true
    )
);


create policy cart_items_owner_delete
on public.cart_items
for delete
to authenticated
using (
    exists (
        select 1
        from public.carts c
        where c.id = cart_items.cart_id
          and c.client_id = auth.uid()
    )
);


-- ============================================================
-- Orders
--
-- Consumer:
--   Own orders may be read.
--
-- Direct INSERT / UPDATE / DELETE is intentionally NOT allowed.
--
-- Order creation / cancellation / mutation must use trusted
-- RPC/server logic because stock, price, snapshots, and totals
-- must be validated atomically.
-- ============================================================

create policy orders_owner_select
on public.orders
for select
to authenticated
using (
    client_id = auth.uid()
);


-- ============================================================
-- Order Items
--
-- Consumer may read OrderItems belonging to their own Orders.
--
-- No direct writes.
-- ============================================================

create policy order_items_owner_select
on public.order_items
for select
to authenticated
using (
    exists (
        select 1
        from public.orders o
        where o.id = order_items.order_id
          and o.client_id = auth.uid()
    )
);


-- ============================================================
-- Refund Requests
--
-- Consumer may read their own refund requests.
--
-- Direct write access is intentionally not granted here.
-- Refund creation/processing will use trusted RPC/server logic.
-- ============================================================

create policy refund_requests_owner_select
on public.refund_requests
for select
to authenticated
using (
    client_id = auth.uid()
);


-- ============================================================
-- Refund Items
--
-- Consumer may read refund items belonging to their own
-- refund requests.
--
-- No direct writes.
-- ============================================================

create policy refund_items_owner_select
on public.refund_items
for select
to authenticated
using (
    exists (
        select 1
        from public.refund_requests rr
        where rr.id = refund_items.refund_request_id
          and rr.client_id = auth.uid()
    )
);
-- Consumer policy는 만들지 않는다.

alter table public.order_item_ware_allocations
    enable row level security;

commit;