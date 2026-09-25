# Mall v2 Domain Transition Phases

## Purpose

This document defines the execution order and responsibility boundaries for the Mall v2 product, sales, and inventory domain transition.

[`product-schema.md`](./product-schema.md) is the latest Source of Truth for this domain. This document does not add a new domain design or rules beyond that document. It only records the order in which the confirmed design must be applied.

## Core Domain Boundaries

1. Product is the central entity for a sellable product.
2. ProductPost and Product have an N:N relationship.
3. ProductOption and ProductOptionValue define a Product's selection structure.
4. ProductVariant is the actually sellable unit.
5. Ware is an independent inventory unit and may exist without being a ProductVariant sales target.
6. Warehouse is the inventory space to which a Ware belongs.
7. Ware and Warehouse must never be directly exposed to Consumers.
8. Consumers purchase using Product and ProductVariant.
9. The server/RPC internally connects ProductVariant to Ware to determine inventory availability.
10. Cart identity is Product + ProductVariant.
11. OrderItem uses Product + ProductVariant and an order-time snapshot.
12. Wishlist remains ProductPost-based.
13. History is connected through Order.
14. Refund is connected through Order.
15. Category remains a ProductPost classification structure.

## Responsibility Boundaries

### User + ChatGPT

Responsible for:

- Final domain-contract decisions
- Inspecting the actual Supabase Dashboard state
- Confirming actual tables, PKs, FKs, constraints, unique constraints, indexes, RLS policies, triggers, and RPCs
- Designing SQL DDL
- Designing RPC SQL
- Designing RLS
- Running Supabase SQL Editor commands and validating their results
- Deciding whether migration or rebuild is required

### Codex

Responsible for:

- Repository-internal impact analysis
- Shared type changes
- API controller and route changes
- Client and Admin changes
- API documentation updates
- Builds, type checks, and tests
- Consistency verification between the confirmed DB contract and repository code

Codex must not infer the actual Supabase DB structure or write DB SQL arbitrarily.

## Phase 0 — Design Validation

**Status:** COMPLETE
**Owner:** Codex

### Scope

- Revalidate conflicts between the current repository and the latest `product-schema.md`.
- Identify the impact of the prior Inventory/SkuInventory-centered structure.
- Record that actual Supabase DDL, constraints, RLS, triggers, and RPC SQL cannot be confirmed from the repository alone.

### Completion criteria

- [x] Repository impact scope is identified.
- [x] Legacy Inventory/SkuInventory-centered conflicts are recorded.
- [x] Decisions and actual DB inspection required before implementation are identified.

## Phase 1 — Domain Contract Finalization

**Status:** COMPLETE
**Owner:** User + ChatGPT

### Finalize

- Product contract
- ProductOption contract
- ProductOptionValue contract
- ProductVariant contract
- Ware contract
- Warehouse contract

- ProductVariant option-value combination representation
- ProductVariant price ownership
- ProductVariant skuCode policy
- ProductVariant active/inactive policy

- Whether every sellable ProductVariant requires Ware
- ProductVariant ↔ Ware cardinality
- ProductVariant ↔ Ware connection method

- Ware stock fields and lifecycle
- Warehouse ↔ Ware relationship

- CartItem identity
- OrderItem identity
- OrderItem snapshot

- Ware stock → Consumer availability mapping

### Completion criteria

- [x] Product / Option / Variant contracts are finalized.
- [x] Ware / Warehouse contracts are finalized.
- [x] ProductVariant ↔ Ware boundary is finalized.
- [x] Cart / Order identity rules are finalized.
- [x] Consumer availability rules are finalized.
- [x] All domain decisions required to write the core SQL schema are finalized.

## Phase 2 — Current Supabase Inspection

**Status:** IN PROGRESS
**Owner:** User + ChatGPT

### Inspect in the actual Dashboard

- Tables and columns
- Primary keys and foreign keys
- Unique constraints
- Indexes
- RLS policies
- Triggers
- RPCs/functions

### Completion criteria

- [x] Finalized v2 table names were verified against the new Supabase project.
- [x] Finalized public and service RPC names were verified against the new Supabase project.
- [x] Legacy and unexpected relation names were identified.
- [ ] Actual PK/FK, unique constraint, index, trigger, and RLS policy catalog state is recorded without inference.

The configured read-only Supabase REST connection does not expose
`information_schema` or `pg_catalog`. Consequently, actual column metadata,
PK/FK/check/unique constraints, indexes, RLS policy definitions, triggers, and
exact RPC signatures still require a read-only catalog query through an
appropriately authorized SQL connection or Dashboard view. Phase 2 remains in
progress until that comparison is recorded.

## Phase 3 — Schema v2 SQL Design

**Status:** COMPLETE
**Owner:** User + ChatGPT

### Scope

- v2 tables and relations for the confirmed Product, ProductOption, ProductOptionValue, ProductVariant, Ware, Warehouse, Cart, OrderItem, and supporting domains
- Constraints, unique constraints, indexes, RLS, triggers, and RPCs required by the finalized contract
- Consumer contract boundary that hides Ware and Warehouse

### Constraint

Codex does not generate SQL for this phase unless explicitly requested. SQL is designed from the confirmed actual Supabase state.

### Completion criteria

- [x] The finalized v2 SQL set is recorded under `docs/mall1/v2/sql/`.


## Phase 4 — Supabase Apply and DB Verification

**Status:** COMPLETE
**Owner:** User + ChatGPT

### Verified deployment and read-only checks

The finalized v2 schema, RPC, and RLS SQL set has been applied to the new Supabase project. The following checks were actually executed with read-only access:

- [x] Finalized v2 tables exist, including `product_variant_wares` and `order_item_ware_allocations`.
- [x] Finalized Product, Cart, Order, Refund, and Warehouse RPC names exist.
- [x] Trusted server access can read internal Warehouse/Ware relations.
- [x] The active Default Warehouse seed row exists.
- [x] Anon access returned no rows from the non-empty `warehouses` table.
- [x] Anon access returned no rows from `wares`, `product_variant_wares`, and `order_item_ware_allocations`.
- [x] Anon Product/ProductPost reads and the public ProductPost-list RPC respond successfully with the current empty catalog.
- [x] Legacy/extra relation names were recorded for later migration or cleanup decisions.

### Runtime verification results

- [x] Product creation
- [x] ProductOption creation
- [x] ProductOptionValue creation
- [x] ProductVariant creation
- [x] ProductVariant option-value combination validation
- [x] Ware creation
- [x] ProductVariant ↔ Ware connection
- [x] Ware creation without ProductVariant linkage
- [x] Ware stock increase
- [x] Ware stock decrease
- [x] ProductVariant availability returns `AVAILABLE`
- [x] Zero available stock returns `OUT_OF_STOCK`
- [x] Consumer-facing populated Product/ProductPost results do not expose Ware/Warehouse internals
- [x] Cart creation and Product + ProductVariant item flow
- [x] Order creation from Cart
- [x] OrderItem immutable snapshot creation
- [x] Ware stock deduction after successful Order creation
- [x] `order_item_ware_allocations` records the internal allocation
- [x] Order cancellation restores the exact allocated Ware stock
- [x] Order History is derived from Order / OrderItem snapshots
- [x] Trusted Admin Order lifecycle transition is applied and verified
- [x] Refund request creation
- [x] Refund request does not automatically restock Ware
- [x] Concurrent stock deduction does not oversell
- [x] Authenticated user-owned Cart access is scoped correctly by RLS
- [x] Authenticated user-owned Order access is scoped correctly by RLS
- [x] Authenticated user-owned Wishlist access is scoped correctly by RLS
- [x] Authenticated user-owned Refund access is scoped correctly by RLS

### Runtime verification result

The actual Supabase project exposes the service-role-only
`admin_transition_order_status(uuid, text)` RPC for the forward lifecycle
`PENDING → PAID → PROCESSING → SHIPPED → DELIVERED`; Consumer cancellation
remains the existing `PENDING → CANCELLED` path because it restores allocated
Ware stock. The actual lifecycle, invalid-transition rejection, delivered
Refund creation, immutable refund amount, no automatic Ware restock, and
Refund RLS ownership boundary were verified with temporary data and two
authenticated users. All temporary rows and users were removed after the run.

### Verification method

Prefer verification through the actual Mall v2 RPC/application boundaries rather than direct ad-hoc table mutation.

Use:

* Consumer-safe RPCs for Product / ProductPost / Cart / Order / History / Refund verification
* trusted server/service-role access for Warehouse/Ware administration and internal assertions
* direct SQL/catalog inspection only when needed for constraints, triggers, RLS policies, or concurrency verification

Do not expose secret values during verification.

### Completion criteria

- [x] Core DB constraints and relations behave according to the finalized SQL contract.
- [x] Core Product / Cart / Order / Warehouse RPC behavior is verified with populated data.
- [x] Stock deduction, allocation, cancellation restoration, and refund handling behavior is verified.
- [x] Consumer-facing populated results do not reveal Ware or Warehouse internals.
- [x] RLS ownership and internal-only boundaries are verified with populated test data.
- [x] No unresolved mismatch remains between the repository SQL Source of Truth and the actual Supabase project.

## Phase 5 — Auth and Shared Contract Foundation

**Status:** COMPLETE

**Owner:** Codex + User

### Auth

* Google OAuth through Supabase Auth
* Next.js auth callback/session handling
* authenticated/unauthenticated application state
* server/client Supabase boundaries
* authenticated user identity compatible with existing RLS

Google Cloud and Supabase provider configuration may be performed manually by the User.

### Shared Types

Primary domains:

* Product / ProductPost
* ProductOption / ProductOptionValue
* ProductVariant
* Ware / Warehouse
* Cart / CartItem
* Order / OrderItem
* History
* Refund
* Wishlist

### Completion criteria

* [x] Google login/logout/session flow works in the verified production flow against the actual Supabase project.
* [x] Authenticated user identity works with existing RLS boundaries.
* [x] Shared types match the confirmed v2 DB/RPC contract.
* [x] Consumer types do not expose Ware/Warehouse internals.
* [x] Legacy Inventory/SkuInventory contracts are removed or explicitly deprecated.

## Phase 6 — Supabase Access Migration

**Status:** IN PROGRESS

Owner: Codex + Claude

### Scope

Classify and migrate application data access to:

* Direct Supabase + RLS
* Supabase RPC
* Next Route Handlers where server-only execution is required

Cover:

* Product / ProductPost
* Cart
* Order
* History
* Refund
* Wishlist
* Admin Product/Variant
* Ware/Warehouse management
* Admin order operations

Remove or retire legacy API assumptions that no longer apply after removal of `apps/api`.

### Completion criteria

* [ ] Application data access matches the confirmed v2 contract.
* [ ] Transactional operations use the confirmed RPC boundaries.
* [ ] Privileged operations run only in trusted server contexts.
* [ ] Consumer paths never expose Ware/Warehouse internals.
* [ ] No required application path depends on the removed Express API.

### `apps/user-web` migration progress

* [x] Admin Route Handlers authenticate the request and verify `user_profiles.role = 'ADMIN'` before service-role access.
* [x] Ware/Warehouse reads and Ware metadata/stock mutations use the server-only boundary and confirmed warehouse RPCs.
* [x] Admin Order reads and lifecycle transitions use the server-only boundary and `admin_transition_order_status()`.
* [x] Admin Refund reads and `APPROVED`/`REJECTED` transitions use the server-only boundary and `admin_transition_refund_status()`.
* [x] Admin User reads and CLIENT-to-ADMIN promotion use the server-only boundary and `promote_user_to_admin()`.
* [ ] Product/ProductPost/Option/Variant management is migrated from legacy Express and Inventory assumptions.
  * [x] Product + ProductOption/Value + ProductVariant creation uses the service-role-only `admin_create_product(jsonb, jsonb, jsonb)` RPC (migration `20260925060000_admin_create_product.sql`) through `POST /api/admin/products`; one transaction satisfies the deferred variant-integrity triggers. Variant ↔ Ware links stay on `link_product_variant_ware()`.
  * [x] ProductPost drafts link only persisted Products; ProductPost routes reject unknown `productIds`.
  * [x] Product basic info, ProductOption/Value (rename, required flag, value active flag, appended values) and ProductVariant SKU/label/price/active updates run in one transaction through the service-role-only `admin_update_product(uuid, jsonb, jsonb, jsonb)` RPC (migration `20260925090000_admin_update_product.sql`) via `GET/PATCH /api/admin/products/[productId]`; invalid changes roll back (`supabase/verification/admin_update_product.sql`).
  * [x] ProductPost add/edit screens can search and link existing persisted Products (`GET /api/admin/products`); links are saved through `admin_save_product_post()`.
  * [x] Adding ProductOptions/ProductOptionValues/ProductVariants to an existing Product and changing a Variant's option combination use the same `admin_update_product()` transaction (migration `20260925100000_admin_update_product_structure.sql`). Active Variants may not use inactive OptionValues or share an option combination; foreign ids and integrity violations roll back (`supabase/verification/admin_update_product_structure.sql`).
  * [ ] Product/Option/Value/Variant physical deletion policy (cart/order references, historical snapshots) is not decided; deactivation is the supported path.
  * [x] ProductPost create/update and ordered `product_post_products` replacement run in one transaction through the service-role-only `admin_save_product_post(uuid, jsonb, uuid[])` RPC (migration `20260925080000_admin_save_product_post.sql`); unknown `productIds`, duplicate slugs, invalid status, and link failures leave no partial save (`supabase/verification/admin_save_product_post.sql`).
* [x] All remaining user-web routes are migrated from legacy Express endpoint constants.
  * [x] Admin Overview aggregates v2 `orders`, `refund_requests`, active `wares` (available = current − reserved), `product_posts`, and `user_profiles` through the admin-only `GET /api/admin/overview` Route Handler. No DB change was required.
  * [x] Main page config (`/api/page-config`) has no confirmed v2 table/RPC contract; the Admin design editor now works on a local `mainPageMock` copy with saving disabled. A persisted page-config contract remains undecided.
  * [x] ProductPost thumbnail upload uses `POST /api/admin/images/upload-url`: the Admin-only Route Handler issues a service-role signed upload URL for the public `images` bucket (migration `20260925110000_images_storage_bucket.sql`: JPEG/PNG/WebP, 5 MiB, no anon/authenticated write policy), and the public URL is saved to `product_posts.thumbnail_url`.
  * [x] ProductPost body (editor) images: before `admin_save_product_post`, pending `blob:` image sources still referenced by the content are uploaded through the same route (`purpose: "content"`, `product-posts/content/`) and replaced with public URLs. Already-uploaded URLs are kept; a failed upload or an unresolved `blob:` source aborts the save.
  * [x] Product images: the Admin Product create/edit modals add, remove, and reorder images. Pending files upload through the same route (`purpose: "product"`, `products/images/`); persisted URLs are not re-uploaded, and a failed upload aborts the save. `admin_create_product` keeps its `imageUrls` contract; `admin_update_product` accepts `p_product.imageUrls` as an ordered replacement of absolute http(s) URLs in the same transaction (migration `20260925120000_admin_update_product_image_urls.sql`, `supabase/verification/admin_update_product_image_urls.sql`).
  * [ ] Uploaded image deletion/orphan cleanup is not implemented.
  * [ ] `/api/master/cloudinary/ping` is called by a hard-coded path but has no Route Handler in `apps/user-web`.

### `apps/client-web` migration progress

* [x] ProductPost list (home, `/products`, category page posts) uses the public `list_product_posts()` RPC (`p_category_id` for categories) through the browser anon client; cards use `ProductPostSummary` (`thumbnailUrl`, `title`, `summary`) and no longer read the legacy `thumbnail` price/discount/tags object.
* [x] ProductPost detail → Product → Option/Variant uses `get_product_post_detail()` (`ProductPostDetail` with `ProductDetail[]`). The purchase panel resolves the Variant from ProductOptionValue selection and shows only Variant price and consumer-safe `stockStatus`/`isAvailable`; no stock quantity or Ware/Warehouse data is read or typed.
* [x] ProductPost categories (`useProductPostCategoryStore`) are read as flat v2 `ProductPostCategory` rows through direct Supabase + RLS (`product_post_categories_public_select`: active only). `/category/[id]` resolves the category by slug or id (legacy header links still resolve by name) and then lists posts with `list_product_posts(p_category_id)`. Cached legacy category shapes are discarded by the store's persist version.
* [x] Cart uses the authenticated cart RPCs (`get_cart`, `add_cart_item`, `update_cart_item_quantity`, `remove_cart_item`); items are Product + ProductVariant with consumer-safe fields only. The ProductPost detail cart action sends the selected `productVariantId` and quantity; unauthenticated users are asked to log in (no guest cart). `get_cart()` no longer writes inside its STABLE body (migration `20260925130000_get_cart_read_only.sql`), which had failed for users without a cart.
* [x] Cart → Order: `/order` orders the whole server Cart through `create_order_from_cart(p_shipping_address, null)`. The shipping snapshot uses the ClientAddress field names (`recipientName`, `phone`, `zonecode`, `address`, `addressDetail`); saved addresses are read through the `client_addresses` owner RLS policy. Empty cart, insufficient stock, and inactive Variant errors are shown per item without stock quantities; the Cart is reloaded after success or failure. `/success?orderId=` reads the owner's `orders`/`order_items` through RLS and shows only immutable OrderItem snapshots. The legacy `cartStore`, point-based order panels, and the order `usePayment` wrapper were removed.
* [ ] Wishlist, History/Cancel, Refund, and Point/Payment still call the removed Express API (`/payment` and `useClientOrderApi` are no longer reachable from the order flow). "구매하기" on the ProductPost detail stays disabled (no direct-buy contract; orders are created from the Cart). The detail page's cart action still uses the legacy `useCart.addCart(productId, quantity)`, and "구매하기" stays disabled until the v2 Order flow is connected.

## Phase 7 — Client / Admin Migration

**Status:** NOT STARTED

Owner: Codex + Claude

### Consumer

* authentication state
* ProductPost/Product lookup
* Option and ProductVariant selection
* Cart
* Order
* History
* Refund/cancel
* stock availability display

### Admin

* Product management
* ProductOption / ProductOptionValue
* ProductVariant
* Ware / Warehouse
* Variant ↔ Ware connections
* order management

### Completion criteria

* [ ] Consumer uses Product/ProductVariant purchase flows only.
* [ ] Admin uses the confirmed internal inventory flows.
* [ ] Legacy Inventory-centric UI and obsolete API usage are removed or explicitly deprecated.

## Phase 8 — End-to-End Verification

**Status:** NOT STARTED

Owner: Codex + Claude + User

### Representative flow

```text
Google Login
→ Product creation
→ Option/Value creation
→ Variant creation
→ Ware connection
→ ProductPost connection
→ Consumer lookup
→ Variant selection
→ Cart
→ Order
→ Ware stock deduction
→ History
→ Refund/Cancel
→ stock/order verification
```

### Verify

* [ ] targeted typecheck/tests
* [ ] production-relevant builds
* [ ] actual Supabase integration
* [ ] authentication and RLS
* [ ] Git push and Vercel deployment
* [ ] deployed Google Auth flow
* [ ] deployed core Mall flow

### Completion criteria

* [ ] Core Mall v2 flow works against the actual Supabase project.
* [ ] Auth and user-owned RLS work correctly.
* [ ] Consumer paths never expose Ware/Warehouse internals.
* [ ] Vercel deployment operates with the intended production architecture.

# Working Rules

* `product-schema.md` and confirmed SQL are the Mall v2 domain Source of Truth.
* Use actual Supabase results for database behavior; do not infer unknown DB state.
* Ware/Warehouse are internal and must never appear in Consumer contracts.
* Complete phases in order unless a dependency requires a small prerequisite change.
* Follow `AGENTS.md` for scope, validation, Git, push, and deployment behavior.
* Record changed areas, validation results, and remaining related issues when completing a phase.

## Remaining Work

* Finish any still-required catalog-level Supabase inspection.
* Complete Phases 6–8.
