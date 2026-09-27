# Mall V4 — Phases

Status: planned 2026-09-27. **Nothing here is implemented.** The decisions this plan rests on are in `docs/mall1/v4/DECISIONS.md` (V4-D01 to V4-D26); anything not decided there is an open item (`DECISIONS.md` section 4) and is not decided by a phase.

Evidence level of the findings below: `code-level verification only` (code and git history were read; the apps were not run and no production screen was observed). Findings that need a production read are marked in Phase 1.

Work order for every phase: analysis, plan, implementation, test. A unit that is implemented and verified is committed at once; nothing is pushed, deployed, migrated, cut over, or scheduled without a separate approval (V4-D04).

---

## 1. Goal

v3 built the backend and the domain (payment, order, allocation, cancel, fulfillment, refund, reversal, restock, reconcile). **V4 turns it into a product that can be operated**: usable UI/UX, a working CMS, Product / Variant / Ware operations that do not need the database, a complete consumer flow, and the order operations after checkout, with the data-protection gate that makes the production release safe.

V4 stays in **PG Test mode** (V4-D20): it does not move real money.

## 2. Phase list

| # | Phase | V4 class | Change against the first roadmap |
|---|---|---|---|
| 1 | Production Usability & Regression Recovery | MUST | as planned, plus the decisions V4-D10 to V4-D16 |
| 1.5 | Data Protection Gate | MUST (gate) | new; the safety gate of V4-D25 as an explicit gate before Phase 2 |
| 2 | Production Release of v3 + Phase 1 | MUST | unchanged; runs after Phase 1 and Phase 1.5 (V4-D03) |
| 3 | Payment: PG Test mode retained | MUST (a constraint, no new build) | **reclassified**: was "Payment Productionization (MUST for real money)"; real PG work moved to V5 (V4-D20) |
| 4 | Fulfillment & Operations Console | MUST | **scope narrowed** by V4-D21 to V4-D24 |
| 5 | Reliability, Security & Audit | MUST | **narrowed**: no paid backup / PITR requirement (V4-D25) |
| 6 | Storefront Discovery & Performance | SHOULD | unchanged |
| 7 | Customer Communication & Support | **moved to V5** | **moved** (V4-D26) |
| 8 | Pricing, Shipping Fee & Promotions | LATER (V5 candidate) | unchanged |
| 9 | Multi-Warehouse & Inventory Intelligence | LATER (V5 candidate) | unchanged |
| 10 | V4 Acceptance & Release Hardening | MUST | criteria adjusted to PG Test mode |

Dependencies: `1 -> 1.5 -> 2 -> {3, 4, 5} -> 10`; `6` starts after 2; 7, 8, 9 are not V4 work. The Phase 1.5 gate is also repeated before every later migration (Phase 4, Phase 5, Phase 6 schema changes).

---

## 3. Phases

### Phase 1 — Production Usability & Regression Recovery (MUST)

**Purpose**: remove the regressions, placeholders, dev traces and operations-unfriendly screens found in the v3 review, so the product can actually be used. All of the following is V4 MUST.

**Scope** (implemented as small, separately verified and committed units, in this order: baseline and Playwright; Admin shell; cleanup; page-config; consumer recovery; catalog authoring; Post Variant selection; E2E completion and gate):

- **A. user-web Admin UX**: common shell (desktop sidebar, mobile drawer, header, breadcrumb, root and back navigation), no dead-end page, titles and terms unified (the "상품 게시물" vs "게시물" naming, the hard-coded "상품 판매글 추가" title used on the list and edit pages, the users page without a header), the fixed authentication box merged into the shell, loading / empty / error states, dev UI removed (console, debug, mock, placeholder, the `addMockProduct` button), the `/master` Cloudinary screen removed with its dashboard entry (V4-D13), every form that does not save removed.
- **B. Consumer regression** — client-web: product list and detail, cart, checkout, order flow, history and detail, cancel and refund entry points; the disabled-only "구매하기" and "주문 기능은 준비 중입니다." removed (V4-D14); everything cut by the v3 flag restored unless it was an approved v3 decision (Point menu hidden, no selected-item orders, no buy-now). client-pwa: ProductPost body rendering (currently missing), product detail, cart, the client-web hand-off, order lookup, Hero and main page, wrong routes and links, empty screens, placeholders. The dead `useOrderClient` stub and the `console.log` calls are removed.
- **C. Page / CMS**: page-config persistence restored as one JSONB document (V4-D10), Admin load and save, client-web and client-pwa renderers connected to `@mall/mall-page-viewer` (the existing editor and viewer are reused), `mainPageMock` removed from the production paths, menus linked to the real Category routes (the mock uses slugs, the routes take ids), Hero images in Supabase Storage. A read-only production check of an existing page-config table or data and of the old contract (the legacy `site_configs(key, value)`, absent from the 2026-09-24 schema dump) belongs here.
- **D. Product / Option / Variant / Ware operations** (the Option model is kept, V4-D16): Option combination generation (cartesian), a Variant matrix with SKU, price and initial stock per Variant, Ware batch creation and linking, the raw JSON metadata textarea replaced by a key-value editor (Color and Size are Options, not metadata), a Product -> Option -> Variant inventory tree. Wares are linked to the leaf Variant; they do not form a tree.
- **E. ProductPost Variant selection** (V4-D11): `product_post_variants`, an explicit Variant selection with a tri-state tree selector (Product selects all its Variants, a parent selects its leaves, a partial selection is indeterminate), only leaf Variant ids stored, existing Posts backfilled with the Variants they expose now, later Variants not exposed automatically.
- **F. Production cleanup**: a repository search for `준비 중`, `TODO`, `FIXME`, `placeholder`, `mock`, `coming soon`, `not implemented`, `temporary`, `disabled`, `임시`, dev buttons, `console.log`, empty JSX / `null` fallbacks; whatever reaches a production surface is fixed in this phase, the rest is justified in writing.
- **G. Browser E2E (Playwright, V4-D12)**: Admin navigation; Product CRUD; ProductPost CRUD and detail; page-config save then render; Option / Variant generation; Ware batch creation; the metadata editor; Post tri-state selection; PWA ProductPost detail; cart to client-web hand-off; client-web checkout and order; the existing v3 domain regression.

**Schema impact**: `site_configs` (JSONB) and its RPCs; `product_post_variants` and a backfill; optionally a batch RPC for Variant + Ware creation. No change to the Option tables, Order, Payment, allocation, reversal, or stock columns.
**UI impact**: all of user-web (shell and pages), client-web (purchase area, home, header), client-pwa (detail, Hero, main page), new editors.
**Backend impact**: three or so new RPCs; `admin_save_product_post` extended; `get_product_post_detail` and `list_product_posts` filtered by the selected Variants with **the same return shape** (they are called by the v2 production apps).
**Migration risk**: additive only. The backfill must keep every current exposure identical. New RPCs follow the existing grants pattern (`REVOKE ALL FROM PUBLIC`, narrow grants); the page-config write is Admin-only. OrderItem snapshots already exist (`product_name_snapshot`, `variant_label_snapshot`, `option_snapshot`, `image_url_snapshot`), so editing Options and Variants does not rewrite past Orders.
**Completion**: every item of A to G done; the search of F is clean or justified; the existing v3 suites and the rehearsal stay green after every unit.
**Automated validation**: `pnpm supabase db reset`; the existing SQL / HTTP suites and the cutover rehearsal; new SQL verification (page-config, Post Variant selection and backfill, batch creation atomicity); unit tests of the tri-state and combination logic; Playwright (G).
**Real production validation**: read-only smoke first, then write smoke one scenario at a time (`CUTOVER.md` section 7 pattern), including the page-config data check of C.
**Next**: Phase 1.5.

### Phase 1.5 — Data Protection Gate (MUST, a gate)

**Purpose**: the condition under which a production migration or cutover may start, on the basis of V4-D25 (no paid backup plan).
**Scope**: immediately before any important migration or cutover, run `supabase/cutover/v3_backup_and_verify.sh`: a fresh `pg_dump`, a restore into a local scratch database, a comparison of the row counts of every `public` and `auth` table and of the orders / payments / stock fingerprints. **A restore error, a count mismatch or a fingerprint mismatch stops the work.** The fingerprints are extended when a phase adds tables that carry business data (`site_configs`, `product_post_variants`, delivery timestamps).
**PASS criteria**: the restore verification of the day passes; the dump stays local (`*.dump` is gitignored, never committed); the person who approves the window has seen the result.
**Schema / UI / backend**: none.
**Migration risk**: none by itself. The known limit is accepted for PG Test mode: the platform has no backup and PITR is off, so the dump is the only rollback data and everything after the dump is lost on a restore.
**Automated validation**: the local rehearsal of the script.
**Real production validation**: the read-only production dump and the restore check (already done once on 2026-09-27; it is repeated right before the window).
**Next**: Phase 2. Before a paid service or real-money PG, Supabase backup / PITR is re-reviewed (V4-D25, open item O6).

### Phase 2 — Production Release of v3 + Phase 1 (MUST)

**Purpose**: put the v3 domain and the Phase 1 result into production together and verify them there.
**Scope**: `docs/mall1/v3/CUTOVER.md` is re-issued with the Phase 1 migrations: the additive migrations, the legacy unpaid Orders, the stock conversion, the contraction, the post-check, the Production-scope order and the `main` push order (section 4.1), the promotion, the Supabase Cron activation, the rollback deployments.
**Schema impact**: all v3 and Phase 1 migrations, including the contraction. **UI impact**: none. **Backend impact**: none beyond deployment.
**Migration risk**: the stop conditions of `CUTOVER.md` 4.1 (a flag-less build on the v3 database is the largest single risk); the point of no return is the first real v3 order.
**Completion**: `v3_postcheck.sql` all ok, `reconcile_scheduler_status()` ok, the read-only smoke and the write smoke of `CUTOVER.md` section 7 pass.
**Automated validation**: the rehearsal on the cut-over database, Playwright on the cut-over local stack. **Real production validation**: the production E2E of section 7.
**Next**: 3, 4, 5, 6.

### Phase 3 — Payment: PG Test mode retained (MUST as a constraint, no new build)

**Purpose**: keep payment exactly as it is while V4 changes everything around it (V4-D20).
**Scope**: the PG Test recorder, the server confirm path, the simulated reversal adapter (`PG_REVERSAL_ADAPTER=simulated`), the production placeholder adapter that leaves an unknown outcome PENDING, and the reconcile sweeper stay as they are. **No** real PG vendor, real reversal adapter, webhook route, authorize / capture, or Point payment. The work of this phase is to prove, in every phase's regression gate and in the Phase 2 and Phase 10 production E2E, that payment, finalize, reversal and reconcile still behave.
**Schema / UI / backend impact**: none (a change here needs a new decision).
**Migration risk**: none. **Completion**: the payment part of the v3 suites and of the production E2E stays green. **Automated validation**: the existing payment suites. **Real production validation**: the PG Test flow in the production E2E.
**Next**: the real-money transition is a separate later phase (V5 candidate, section 5).

### Phase 4 — Fulfillment & Operations Console (MUST)

**Purpose**: the operator finishes an order's life from the screens, without a carrier integration.
**Scope**:
- **Lifecycle** (V4-D22 to V4-D24): a `PENDING` Order never expires; the consumer can cancel it while `PENDING`; after `PROCESSING` the ordinary Cancel stays refused. The Admin moves `PROCESSING -> SHIPPED` and the transition time is recorded; the consumer confirms receipt (`SHIPPED -> DELIVERED` at once); **14 days after the `SHIPPED` transition** a still-`SHIPPED` Order becomes `DELIVERED` automatically. The automatic completion is one database function run by Supabase Cron (no HTTP call, no secret), **idempotent**: it only touches `SHIPPED` Orders past 14 days, skips locked rows, and a repeated, concurrent or already-confirmed case changes nothing and raises no user-visible error. The job is created by a separate activation script, like the reconcile jobs, and has a deactivation script.
- **Operations**: order search, filter and pagination; a reversal and reconcile console for what `/api/admin/reversals` returns today (API only, no screen); the shortage screens tidied.
- **Not in this phase**: carrier API and live tracking (V4-D21), PENDING expiry (V4-D22), notifications (V4-D26). Open items O1 to O4 are answered before implementation.

**Schema impact**: timestamps for `SHIPPED` and `DELIVERED` on the Order (form decided in the phase design), the cron job. **UI impact**: Admin order screens, a receipt-confirmation action and the shipped date on the consumer order detail (no internal stock or logistics detail, BR-20). **Backend impact**: a receipt-confirmation RPC (owner-scoped, idempotent), the automatic-completion function, changes to `admin_advance_order` according to O2.
**Migration risk**: existing `SHIPPED` and `DELIVERED` Orders have no timestamp (O1); the Order status guard triggers and the allocation-freeze trigger stay as they are; Refund is unaffected (no Refund window after `DELIVERED`, v3 DN-42).
**Completion**: an order can go from received to delivered, cancelled, refunded or reversed using the screens only; the 14-day rule is proven at its boundary; the console shows every reversal that needs attention.
**Automated validation**: a SQL suite for the transitions, double confirmation, a confirmation racing the automatic run, and the 14-day boundary measured from the `SHIPPED` time and not from the creation time; Playwright for the operator and consumer flows; the v3 regression.
**Real production validation**: a test Order through receipt confirmation; that the automatic job is scheduled and runs empty. The 14-day boundary itself is verified locally; a time-shifted production test is not done without an explicit authorization.
**Next**: 10.

### Phase 5 — Reliability, Security & Audit (MUST)

**Purpose**: make failures and changes visible and keep the boundary tight, without a paid backup plan (V4-D25).
**Scope**: an audit trail of Admin mutations (prices, stock, page-config, Post Variant selection, status changes); visibility of reconcile, reversal and cron failures (`cron.job_run_details`, `net._http_response`, the Phase 4 console); a review of RLS and RPC grants (the existing grants verification kept and extended to the new objects); request limiting on the Route Handlers; cleanup of privileged variables that a project does not use (client-pwa holds `SUPABASE_SECRET_KEY` and `PG_TEST_*` without reading them). An error-tracking service is open item O5.
**Schema impact**: an audit table. **UI impact**: an Admin audit view. **Backend impact**: audit writes in the mutating RPCs or Route Handlers.
**Migration risk**: an audit write must not make a mutation fail or noticeably slower.
**Completion**: every listed mutation is audited; failures are visible without database access; the grants verification is green.
**Automated validation**: grants and RLS SQL suites, failure-injection tests. **Real production validation**: a real audited change and a real visible failure signal.
**Next**: 10. Backup / PITR is **not** required here; it is re-reviewed before a paid service or real-money PG (O6).

### Phase 6 — Storefront Discovery & Performance (SHOULD)

**Purpose**: make the store easy to browse and fast.
**Scope**: product search and sorting, real pagination (the lists are fixed at `p_limit` 100 today), category browsing, SEO (sitemap, robots, Open Graph; only `metadata` exists), `next/image` instead of plain `<img>` (23 files use `<img>`, one uses `next/image`), client-pwa route-based navigation (deep links, back), the page-builder section types `CATEGORY` and `BANNER` from the PRD, and buy-now only if it is decided later.
**Schema impact**: search indexes, section types inside the page-config JSONB. **UI impact**: client-web and client-pwa. **Backend impact**: search and pagination RPCs (signatures stay compatible).
**Migration risk**: consumer RPC signatures are called by deployed apps. **Completion**: search and pagination work on a large catalog; measured performance targets are met. **Automated validation**: Playwright, a performance measurement. **Real production validation**: real-domain SEO and performance. **Next**: none inside V4.

### Phase 10 — V4 Acceptance & Release Hardening (MUST)

**Purpose**: close V4.
**Scope**: the full production E2E of the approved scenarios in PG Test mode, including the delivery-completion policy; a rollback rehearsal; the runbook and the documents brought up to date; the remaining SHOULD and LATER items handed to V5.
**Completion**: section 4. **Automated validation**: the whole suite set. **Real production validation**: the production E2E with the stock and payment invariants checked after every step.

---

## 4. V4 completion criteria

1. Every V4 MUST phase (1, 1.5, 2, 3 as a constraint, 4, 5, 10) has passed its automated validation (SQL and HTTP suites, Playwright, the v3 domain regression) and its production validation (`production E2E observed`).
2. No mock, placeholder or dev trace reaches a production surface (the repository search of Phase 1 F plus a browser walk).
3. The v3 domain runs in production: the post-check is ok, the Supabase Cron jobs run, and the reconcile sweeper works.
4. The operator manages the whole lifecycle from the screens without database access: catalog, stock, posts, orders, shipping, delivery completion, cancel, refund, restock, reversals.
5. The delivery policy holds: no `PENDING` expiry, receipt confirmation, and the 14-day automatic completion, idempotent.
6. Payment stays in PG Test mode and that is stated wherever a reader could assume otherwise; the real-money transition is not part of V4.
7. The Phase 1.5 gate passes before each production migration; audit and failure visibility (Phase 5) work; the stock and payment invariants hold after the production E2E; the rollback was rehearsed.
8. The SHOULD and LATER items are listed for V5.

## 5. Moved out of V4 (V5 candidates)

| Candidate | Origin | Why it is not V4 |
|---|---|---|
| Customer Communication & Support: notification channels (mail, SMS, push), reviews, ratings, inquiries, a refund-window review | former Phase 7 | V4-D26 |
| Real-money Payment Transition: PG vendor, real reversal adapter, webhook, orphan detection against the real PG, authorize / capture, Point; **prerequisite: the Supabase backup / PITR re-review (O6)** | former Phase 3 | V4-D20 |
| Carrier integration and live delivery tracking | Phase 4 | V4-D21 |
| Pricing, Shipping Fee & Promotions (discounts, coupons, shipping fee, refund-amount derivation, DN-27) | Phase 8 | not started; large schema impact on finalize and refund |
| Multi-Warehouse & Inventory Intelligence (stock history, warehouse transfer UI over the existing `transfer_ware_stock`, allocation priority) | Phase 9 | not started; touches allocation |
