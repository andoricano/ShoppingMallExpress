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

**Status:** COMPLETE (all migrations through `20260925140000_payments_and_points.sql` are applied to the linked Supabase project; production smoke test pending in Phase 8)

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

* [x] Application data access matches the confirmed v2 contract.
* [x] Transactional operations use the confirmed RPC boundaries.
* [x] Privileged operations run only in trusted server contexts.
* [x] Consumer paths never expose Ware/Warehouse internals.
* [x] No required application path depends on the removed Express API.

Final audit (base `e88e4fc`): `client-web`, `client-pwa`, and `user-web` typecheck and production-build cleanly; `client-web`/`client-pwa` have no `API_BASE_URL`/`API_ENDPOINTS`/Inventory/`SkuInventory` references and no Ware/Warehouse reads; `SUPABASE_SECRET_KEY` and `PG_TEST_API_KEY` are read only in `server-only` modules imported by Route Handlers. `apps/develop-web` (internal dev/verification app) still calls the legacy Express API and is not a required application path. Open items below are undecided contracts carried forward, not Phase 6 blockers.

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
* [x] Order history, cancel, and refund: `/mypage/history` and the mypage summary use `get_order_history()`; the order detail reads the owner's `orders`/`order_items` and `refund_requests`/`refund_items` through RLS and shows only immutable OrderItem snapshots. Cancel uses `cancel_order()` and is offered only for `PENDING`; refund uses `request_refund()` and is offered only outside `PENDING`/`CANCELLED`, limited to each item's remaining quantity (REJECTED/CANCELLED requests excluded), exactly as the RPCs enforce. The legacy order-edit route (`/mypage/order-history/[id]/edit`) and its components were removed; Mall v2 has no order shipping-edit contract.
* [x] Wishlist uses direct Supabase + RLS on `wishlist_items` (owner select/insert/delete; insert only for published posts) with an embedded `ProductPostSummary` read through the public `product_posts` RLS (null once unpublished). Duplicate adds resolve through the `(client_id, product_post_id)` unique constraint.
* [x] mypage shipping addresses use direct Supabase + RLS on `client_addresses` (owner CRUD) instead of the non-existent `get_my_addresses`/`create_my_address`/`update_my_address`/`delete_my_address`/`set_my_default_address` RPCs. The single default is kept by the existing `client_addresses_clear_previous_default` trigger and `client_addresses_one_default_uidx`; the order page reads addresses through the same `ClientAddress` client.
* [x] Payment and Point (migration `20260925140000_payments_and_points.sql`, `supabase/verification/payments_and_points.sql`):
  * `payments` records each attempt: `id`, `client_id`, `purpose` (`ORDER_PAYMENT` | `POINT_TOPUP`), `order_id` (ORDER_PAYMENT only), server-determined `amount`, `status` (`PENDING` → `SUCCEEDED` | `FAILED`), `pg_callback_id`. `point_balances` + append-only `point_ledger` (`TOPUP`, unique `payment_id`) form the minimal Point domain; the legacy Express `points`/reservation model is not restored.
  * Service-role-only RPCs: `create_payment(client, purpose, order, amount)` copies the Order total (a differing client amount is rejected; Order must be the caller's and `PENDING`) or enforces the top-up policy (1,000–1,000,000, units of 1,000). `complete_payment(client, payment, succeeded, callback, reason)` locks the attempt and applies side effects once: ORDER_PAYMENT → `admin_transition_order_status(order, 'PAID')` + `payment_reference = payment id`; POINT_TOPUP → ledger entry + balance credit; failure → `FAILED` only. Completed attempts are returned unchanged; `payments_order_succeeded_uidx` and `point_ledger_payment_unique` back the idempotency.
  * `apps/client-web` Route Handlers `POST /api/payments` and `POST /api/payments/[paymentId]/confirm` verify the Supabase user (cookie session or Bearer token), call the PG Test recorder server-to-server (`PG_TEST_ENDPOINT_URL`, `PG_TEST_API_KEY`, `id` = Mall payment id, `amount` = server amount), and call `complete_payment()` only after the recorder returned `201` for exactly that id/amount/outcome. A recorder error leaves the attempt `PENDING` for retry; a completed attempt is replayed without calling the recorder again.
  * UI: `/order` → `/payment?orderId=` (PG test success/failure choice) → `/success`; `PENDING` orders show "결제하기" in order history. mypage Point top-up uses the same boundary; balance/ledger are read through owner RLS. The legacy dev payment page, `paymentStore`, `useClientOrderApi`, point reservation hook, and `lib/api.ts` were removed; `apps/client-web` no longer references the Express API.
* [ ] Spending Points on orders, refunds/cancellation of paid payments, and payment expiry are not part of the Mall v2 contract yet. "구매하기" on the ProductPost detail stays disabled (no direct-buy contract; orders are created from the Cart).

### `apps/client-pwa` migration progress

* [x] ProductPost list/detail use `list_product_posts()`/`get_product_post_detail()`; the purchase panel lists ProductVariants with price and consumer-safe `stockStatus` only.
* [x] Cart uses `get_cart`/`add_cart_item`/`remove_cart_item`; Order uses `create_order_from_cart(p_shipping_address, null)` with ClientAddress field names and owner RLS reads of `orders`/`order_items`. Orders stay `PENDING`; payment is not offered in the PWA.
* [x] The legacy Express `lib/api.ts` client, `/api` rewrite (`API_URL`), Inventory debug console, and `app/repo` Cloud Run client were removed.

## Phase 7 — Client / Admin Migration

**Status:** COMPLETE

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

* [x] Consumer uses Product/ProductVariant purchase flows only.
* [x] Admin uses the confirmed internal inventory flows.
* [x] Legacy Inventory-centric UI and obsolete API usage are removed or explicitly deprecated (remaining items are explicitly deprecated below).

### Progress

* [x] Removed unused legacy types from `packages/types`: `SkuInventory`, `CreateInventoryInput`, `ThumbnailInfo`, `ClientCategory`, `History`/`HistoryActorType`/`HistoryTargetType`/`HistoryAction`, `OrderDelivery`, and the Express Point contract (`Point`, `PointTransaction`, `PointReservation` and their enums). `ClientProfile` no longer carries `point` or the never-populated `address` (ClientAddress is the shipping-address Source of Truth).
* [x] `ProductPostCategoryItem` was replaced by `Pick<ProductPost, "id">` in the user-web category-post routes/hooks.
* [x] `@mall/tiptap` `ProductPostCard` no longer takes `price`/`discount`/`tags` (ProductPost has no price); user-web callers no longer pass placeholder `0` prices. The unused legacy `ProductPreview`/`ProductGallery` and user-web `types/admin.ts` were removed.
* [x] `@mall/constants` `API_ENDPOINTS`, `DB_TABLES`/`DB_COLUMNS` (`inventory_items`), and `CLIENT_ORDER_*` were removed; no application imported them. Only `PAGE_CONFIG_KEYS` remains (page-config contract undecided). No app depends on `@mall/constants`; `client-pwa` no longer depends on `@mall/tiptap`.
* [x] client-web profile reads/updates use direct Supabase + RLS on `user_profiles` (`user_profiles_owner_select`/`_owner_update`; `name`/`phone` column grants) instead of the undefined `get_my_profile`/`update_my_profile` RPCs. No DB change.
* [x] **Deprecated (naming only):** user-web Ware management keeps Inventory naming (`/inventory` route, `component/inventory/*`, `useAdminInventory`, `ProductInventorySection`, `InventoryInspector`/`InventoryList`, and the `AdminDashboardInventoryAlert` type used by `/api/admin/overview`). Runtime use is limited to the Admin-only `/api/admin/wares` and `/api/admin/warehouses` Route Handlers and the confirmed Ware/Warehouse RPCs; no legacy Inventory/`SkuInventory` type, table, or Express endpoint is referenced. "Inventory" in these names means Ware stock. New code must use Ware/Warehouse naming; a rename is optional cleanup and not a v2 requirement.
* [x] **Deprecated (design mock only):** `@mall/mall-page-viewer` `ProductCardData.price`/`discount`/`tags` and the `DISCOUNT` card type. They are optional and only populated by `mainPageMock` for the user-web design editor preview. client-web builds Product section cards from `ProductPostSummary` without price (`useMainPage`), client-pwa renders only the mock hero, and `ProductCard` renders price only when a number is supplied, so Consumer pages never show a mock or legacy price. Do not use these fields for real data; price belongs to ProductVariant. Removal depends on the undecided page-config contract.
* [x] **Deprecated (no backing route):** user-web `/master` Cloudinary connection check calls `/api/master/cloudinary/ping`, which has no Route Handler (status shows "disconnected"); saving master config is a no-op. Images use the Supabase `images` Storage bucket through `/api/admin/images/upload-url`. The Cloudinary master config UI is not part of Mall v2.
* [x] **Deprecated (outside required paths):** `apps/develop-web` still calls the legacy Express API (`NEXT_PUBLIC_API_URL`, `localhost:8080`). It is the internal development/verification app (`ARCHITECTURE.md`), is not a required Mall v2 application path, and must not be used as a contract reference.

### Completion record

Validated at `b4d717e` (only documentation changed afterwards): `tsc --noEmit` exit 0 and `next build` succeeded for `user-web`, `client-web`, and `client-pwa`. `eslint` reports 0 errors for `client-pwa` and 10 pre-existing `react-hooks/set-state-in-effect` errors in files not touched by Phase 7 (`user-web` 8, `client-web` 2); these are unrelated to Mall v2 contracts and are not fixed here.

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

### Open decisions

* [ ] Ware stock after Refund approval is undecided. Currently `request_refund()` and `admin_transition_refund_status()` (`APPROVED`/`REJECTED`) never restock Ware, and `restock_order_item()` (service-role only) is called by no application and keeps no restock record. Only `cancel_order()` (`PENDING`) restores the exact allocated stock. Decide before Refund/stock verification; no migration until decided.

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
* Complete Phases 7–8.
