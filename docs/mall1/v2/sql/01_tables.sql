-- ============================================================
-- Mall v2
-- 01_tables.sql
--
-- Purpose:
--   Create the core Mall v2 tables and primary keys.
--
-- Not included here:
--   - Foreign keys
--   - Unique constraints
--   - Check constraints
--   - Indexes
--   - RLS
--   - RPC / Functions
--   - Triggers
--
-- Those are handled by later SQL files.
-- ============================================================

begin;


-- ============================================================
-- ProductPost Domain
-- ============================================================

create table public.product_posts (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    slug text,

    summary text,
    content jsonb not null default '{}'::jsonb,

    thumbnail_url text,

    status text not null default 'DRAFT',
    published_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table public.product_post_categories (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    slug text,
    description text,

    display_order integer not null default 0,
    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table public.product_post_category_links (
    id uuid primary key default gen_random_uuid(),

    product_post_id uuid not null,
    category_id uuid not null,

    display_order integer not null default 0,

    created_at timestamptz not null default now()
);


-- ============================================================
-- Product Domain
-- ============================================================

create table public.products (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    description text,

    image_urls text[] not null default array[]::text[],

    is_active boolean not null default true,

    meta jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ProductPost : Product = N:N
create table public.product_post_products (
    id uuid primary key default gen_random_uuid(),

    product_post_id uuid not null,
    product_id uuid not null,

    display_order integer not null default 0,

    created_at timestamptz not null default now()
);


-- ============================================================
-- Product Option Domain
-- ============================================================

create table public.product_options (
    id uuid primary key default gen_random_uuid(),

    product_id uuid not null,

    name text not null,

    display_order integer not null default 0,
    is_required boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table public.product_option_values (
    id uuid primary key default gen_random_uuid(),

    product_option_id uuid not null,

    value text not null,

    display_order integer not null default 0,
    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- Product Variant Domain
-- ============================================================

create table public.product_variants (
    id uuid primary key default gen_random_uuid(),

    product_id uuid not null,

    sku_code text,

    label text,

    price numeric(14, 2) not null,

    is_active boolean not null default true,

    meta jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ProductVariant consists of one or more ProductOptionValues.
create table public.product_variant_values (
    id uuid primary key default gen_random_uuid(),

    product_variant_id uuid not null,
    product_option_value_id uuid not null,

    created_at timestamptz not null default now()
);


-- ============================================================
-- Warehouse Domain
--
-- IMPORTANT:
-- Warehouse / Ware are internal-only domain entities.
-- They must never be directly exposed to Consumer APIs/UI.
-- ============================================================

create table public.warehouses (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    code text,

    description text,

    is_active boolean not null default true,

    meta jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- Ware is an independent stock unit.
--
-- A Ware does NOT need to represent a sellable ProductVariant.
--
-- Examples:
--   - sellable product stock
--   - non-sale stock
--   - packaging material
--   - gifts
--   - raw materials
--   - internal supplies
create table public.wares (
    id uuid primary key default gen_random_uuid(),

    warehouse_id uuid not null,

    ware_code text,

    name text not null,

    ware_type text not null default 'GENERAL',

    current_stock bigint not null default 0,
    reserved_stock bigint not null default 0,

    is_active boolean not null default true,

    meta jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ProductVariant <-> Ware relation.
--
-- Ware remains independent.
-- One ProductVariant may later be connected to multiple Ware records,
-- including stock distributed across multiple warehouses.
create table public.product_variant_wares (
    id uuid primary key default gen_random_uuid(),

    product_variant_id uuid not null,
    ware_id uuid not null,

    created_at timestamptz not null default now()
);


-- ============================================================
-- Wishlist Domain
--
-- Wishlist is ProductPost-based.
-- It does NOT directly reference Product/ProductVariant/Ware.
-- ============================================================

create table public.wishlist_items (
    id uuid primary key default gen_random_uuid(),

    client_id uuid not null,
    product_post_id uuid not null,

    created_at timestamptz not null default now()
);


-- ============================================================
-- Cart Domain
--
-- Consumer-facing purchase identity:
--   Product + ProductVariant
--
-- Ware IDs must never be stored in Consumer cart contracts.
-- ============================================================

create table public.carts (
    id uuid primary key default gen_random_uuid(),

    client_id uuid not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table public.cart_items (
    id uuid primary key default gen_random_uuid(),

    cart_id uuid not null,

    product_id uuid not null,
    product_variant_id uuid not null,

    quantity integer not null default 1,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- Order Domain
--
-- Orders reference Product/ProductVariant.
-- Ware remains an internal server/RPC concern.
-- ============================================================

create table public.orders (
    id uuid primary key default gen_random_uuid(),

    client_id uuid not null,

    order_number text,

    status text not null default 'PENDING',

    shipping_address jsonb,

    subtotal numeric(14, 2) not null default 0,
    discount_amount numeric(14, 2) not null default 0,
    shipping_amount numeric(14, 2) not null default 0,
    total_amount numeric(14, 2) not null default 0,

    payment_reference text,

    ordered_at timestamptz not null default now(),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- OrderItem retains immutable order-time snapshots.
--
-- Product/ProductVariant may change later,
-- but historical order presentation must remain stable.
create table public.order_items (
    id uuid primary key default gen_random_uuid(),

    order_id uuid not null,

    product_id uuid not null,
    product_variant_id uuid not null,

    quantity integer not null,

    unit_price numeric(14, 2) not null,
    line_total numeric(14, 2) not null,

    product_name_snapshot text not null,
    variant_label_snapshot text,

    option_snapshot jsonb not null default '{}'::jsonb,

    image_url_snapshot text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- Refund Domain
--
-- Refund is connected through Order.
-- Ware is never exposed to the refund Consumer contract.
-- ============================================================

create table public.refund_requests (
    id uuid primary key default gen_random_uuid(),

    order_id uuid not null,
    client_id uuid not null,

    status text not null default 'REQUESTED',

    reason text,

    requested_amount numeric(14, 2),

    requested_at timestamptz not null default now(),
    processed_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- Allows partial/item-level refunds while keeping Refund rooted in Order.
create table public.refund_items (
    id uuid primary key default gen_random_uuid(),

    refund_request_id uuid not null,
    order_item_id uuid not null,

    quantity integer not null,
    refund_amount numeric(14, 2) not null,

    created_at timestamptz not null default now()
);


-- ============================================================
-- History
--
-- No separate history table is created.
--
-- History is derived from:
--
--   orders
--      ↓
--   order_items
--
-- Product information shown in History should use the immutable
-- OrderItem snapshots rather than current Product data.
-- ============================================================

create table public.order_item_ware_allocations (
    id uuid primary key default gen_random_uuid(),

    order_item_id uuid not null,
    ware_id uuid not null,

    quantity bigint not null,

    created_at timestamptz not null default now()
);

commit;