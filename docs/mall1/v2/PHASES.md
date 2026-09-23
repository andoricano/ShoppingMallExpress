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

## Phase 5 — Shared Types Migration

**Status:** NOT STARTED
**Owner:** Codex

### Primary type candidates

- Product
- ProductOption
- ProductOptionValue
- ProductVariant
- Ware
- Warehouse
- Cart
- CartItem / CartEntry
- Order / OrderItem
- History
- Refund
- Wishlist

### Completion criteria

- [ ] Shared types match the confirmed v2 DB contract.
- [ ] Consumer shared types do not expose Ware, Warehouse, `wareId`, or `warehouseId`.
- [ ] Legacy Inventory/SkuInventory-centered contracts are removed or explicitly deprecated according to the confirmed contract.

## Phase 6 — API Contract Migration

**Status:** NOT STARTED
**Owner:** Codex

### Primary targets

- ProductPost APIs
- Product APIs
- Ware/Admin stock APIs
- Cart APIs
- Order APIs
- History APIs
- Refund APIs
- Admin Overview API

### Required verification

- Classify APIs as retainable, requiring change, or retirement/replacement candidates.
- Update `docs/api/README.md` to match the implemented API contract.
- Verify that Consumer APIs expose Product/ProductVariant availability only and do not expose Ware/Warehouse internals.

### Completion criteria

- [ ] API requests and responses match v2 shared types and the confirmed DB contract.
- [ ] Consumer API contracts do not expose Ware or Warehouse structures.

## Phase 7 — Client / Admin Migration

**Status:** NOT STARTED
**Owner:** Codex

### Consumer scope

- ProductPost lookup
- Product selection
- Option selection
- ProductVariant selection
- Cart
- Order
- Out-of-stock and low-stock display

### Admin scope

- Product management
- ProductOption and ProductOptionValue management
- ProductVariant management
- Ware management
- Warehouse management
- Sales Variant ↔ Ware connection management

### Completion criteria

- [ ] Consumer uses Product/ProductVariant purchase flows only.
- [ ] Admin uses the confirmed internal Ware/Warehouse management flows.
- [ ] Legacy Inventory-centric UI is removed or explicitly deprecated according to the confirmed contract.

## Phase 8 — End-to-End Verification

**Status:** NOT STARTED
**Owner:** Codex + User

### Representative flow

```text
Product creation
→ Option/Value creation
→ Variant creation
→ Ware connection
→ ProductPost connection
→ Client lookup
→ Variant selection
→ Cart
→ Order
→ Ware stock deduction
→ History
→ Refund/Cancel
→ Ware stock and order-history verification
```

### Verify

- [ ] Type check
- [ ] Build
- [ ] Relevant tests
- [ ] Actual Supabase integration

### Completion criteria

- [ ] The core Mall flow works on the confirmed v2 structure.
- [ ] The Consumer flow never exposes Ware or Warehouse internals.

# Working Rules

- `product-schema.md` is the latest Source of Truth for the Mall v2 product, sales, and inventory domain.
- Use actual Dashboard and SQL results to determine Supabase state.
- Do not infer DB structures that are absent from the repository.
- Codex must not implement Client or API changes before the DB contract is finalized.
- Do not start large-scale work in a subsequent phase before the preceding phase is complete.
- Record changed files, test results, and remaining risks at the completion of every phase.
- Do not run migration, commit, or push unless the user explicitly requests it.
- Ware/Warehouse remain internal inventory-domain concepts and must not appear in Consumer contracts.

## Open Verification and Implementation Items

- Complete Phase 2 catalog-level inspection for deployed PK/FK, constraints, indexes, triggers, and RLS policies.
- Complete Phase 4 populated-data, mutation, RLS-ownership, and concurrency verification.
- Migrate repository shared types, API boundaries, and Client/Admin applications in Phases 5–7.
