# Mall v3 — Phases

Draft 0.1 · 2026-09-26

This document splits the approved v3 business logic into implementation phases.
It does not define business policy. Policy lives in `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md` (the "business document"); if the two ever disagree, the business document and the user's approved decisions win and this document must be corrected.

References: `BR-xx` approved rules, `CF-xx` conflicts, `DN-xx` open decisions, `IN-xx` implementation notes, `S-xx` scenarios (all from the business document).

---

## 1. Principles

### 1.1 How phases are built

- Each phase is a vertical slice that can be verified on its own. Inside a phase the order is: DB/schema → RPC/Route Handler → shared types → Admin/Client UI (only what is needed to verify the slice) → verification.
- A phase starts only when its **preconditions** hold and ends at its **gate**. A gate needs the completion criteria met, the verification actually run and reported, and the user's approval.
- Open `DECISION NEEDED` items are not decided here. Each phase lists the ones that must be decided before its implementation starts under **Decision Before Implementation**. Implementation notes (`IN-xx`) are design choices made during the phase, not business decisions.
- Approved rules are not reopened. A phase that finds a rule unworkable stops and reports it as a `CONFLICT` or `DECISION NEEDED`.

### 1.2 Working rules (from `AGENTS.md` / `CLAUDE.md`)

- Database changes are new forward migrations. Applied migrations are never edited.
- Each migration is validated locally with `pnpm supabase db reset` (local Docker Supabase only) and then **reported as ready**. Applying anything to the linked/production database, `supabase db push`, and `db reset --linked` need an explicit instruction that names the migration(s). A Git push is not such an instruction.
- No production data is changed without explicit authorization.
- Commit and push only when the user asks. Never claim a check passed unless it ran; label results `production E2E observed` or `code-level verification only`.
- Verification is targeted: local SQL verification scripts, targeted typecheck/lint of the affected packages and apps, and app builds only when needed. No full-monorepo validation or browser automation unless a phase requires it.
- SQL verification follows the existing pattern in `supabase/verification/` (one `.sql` per feature, a `.sh` script for concurrency cases such as `refund_item_restocks_concurrency.sh`).
- Consumer applications never receive Ware/Warehouse/stock/allocation/shortage/restock internals (BR-20). Privileged operations run in a trusted server context.
- Add dependencies only when a phase requires them.

---

## 2. Migration / Deployment Strategy

### 2.1 Expand → migrate → contract

1. **Expand** (Phases 1–7): add new tables, columns, RPCs, endpoints, and shared types. Nothing the v2 runtime uses is removed or changes meaning.
2. **Migrate** (Phases 2, 4, 5, 6, 7, 8): move each flow to the new structures. The v3 paths are built next to the v2 paths (as new objects, or inactive until cutover). The two may coexist in the code base.
3. **Contract** (Phase 8 only): remove `PAID`, `create_order_from_cart`, `restock_order_item`, and the other legacy paths.

### 2.2 Rules

- Additive changes come first and may land at any time.
- An intermediate phase state must not break the v2 production runtime. A change that alters the behavior or meaning of an existing object that v2 uses (for example the meaning of `current_stock`, the order creation flow, the Order statuses, refund behavior) is prepared as a new object, or as a change that is not active for v2 clients, and is activated only at cutover.
- The v3 runtime is switched on at one explicit cutover point (2.3), not phase by phase.
- Legacy removal happens only in Phase 8, and only after the v3 paths of Phases 1–7 are verified.
- Production DB migrations and production deployments each need a separate, explicit instruction that names the migrations or the deployment. A Git push and a successful local validation are not such an instruction.
- Every phase report states: the migrations created and validated locally (reported ready, not applied); whether each change is additive or activated only at cutover; and which cutover items the phase contributes.

### 2.3 Cutover

Cutover is the single moment when production switches from the v2 runtime to v3. It consists of applying the production migrations (including the conversion of existing stock values, IN-09, and the activation of the v3 RPC behavior) and deploying the v3 applications together. It happens after the Phase 8 gate, is executed in Phase 9 on the user's explicit instruction, and has a rollback outline prepared beforehand.

### 2.4 Delivery strategy (process decision before Phase 1)

Pushing to `main` triggers the Git-based Vercel production deployment, so the team decides how v3 code is kept from changing production behavior before cutover. Options:

- **A. Long-lived v3 branch**, merged and deployed once at release. Production stays on v2 until then.
- **B. Incremental merges to `main`** limited to changes allowed by 2.2 (additive or inactive), with one cutover switch.

This document does not choose. Also needed before Phase 1: the confirmation of the carried-over v2 rules (DN-34), the test accounts (one Admin and two Clients), the verification approach, and the table/enum names (IN-05).

---

## 3. Phase map

| # | Phase | Depends on | Outcome |
|---|---|---|---|
| 1 | Schema and contract foundation | pre-Phase-1 decisions | Additive schema and shared types for everything later |
| 2 | Stock, allocation, and sellability core | 1 | B1 stock model, shortage-tolerant allocation, `is_sold_out`, sellability without stock |
| 3 | Payment reversal engine | 1 | Reversal creation, invariants, idempotency, execution adapter |
| 4 | Stage 2 finalize | 1, 2, 3 | Payment-first checkout, one Order per Payment, price-mismatch and orphan reversals |
| 5 | Cancel | 2, 3, 4 | Whole-Order `PENDING` cancel by Client/Admin, idempotent, with reversal |
| 6 | Admin fulfillment | 2, 4 | Lifecycle transitions with the gate, consume at `PROCESSING`, shortage handling |
| 7 | Refund and restock | 3, 6 | Refund invariants, atomic approval + reversal, explicit restock |
| 8 | Consumer/PWA alignment and legacy contraction | 4–7 | Consumer surfaces on v3 rules; legacy paths removed |
| 9 | Production E2E and release verification | 1–8 | Scenario-based verification and release readiness |

Phase 4 is the first core integration gate of v3; Phases 5 to 9 do not start until it passes. Phase 5 and Phase 6 do not depend on each other and may run in either order. Phase 3 needs only Phase 1, so it may run in parallel with Phase 2.

Compared with the eight areas first proposed: allocation/shortage/SOLD_OUT moved before finalize (Stage 2 allocates and revalidates sellability), and the reversal engine is separated because finalize failure, cancel, and refund all depend on it. Admin fulfillment precedes Refund because Refund eligibility and stock recovery rely on `PROCESSING` and the consume step.

---

## Phase 1 — Schema and contract foundation

**Goal**: add the database structures and shared types the later phases need, without changing v2 runtime behavior.

**Scope**
- In:
  - `payments`: allow a Payment without an Order (relax `payments_target_valid`), the Payment↔Order link with one Order per Payment (structure per IN-10), and a unique PG reference.
  - `payment_reversals` (provisional name): columns of BR-31, causes of BR-30, optional `order_id` / `refund_request_id`, idempotency key uniqueness, amount and status constraints, RLS (service-role writes; Consumer read scope decided with DN-19 in Phase 5).
  - `product_variants.is_sold_out` (BR-46).
  - A database bound on the allocation total per OrderItem (BR-07).
  - Shared types for reversals, the Payment/Order link, sellability, and Admin shortage.
- Out: behavior changes, removing `PAID` or any v2 object, the Refund status CHECK (Phase 7, DN-47).

**Main change targets**: a new forward migration (or a small set); `packages/types` (`payment.ts`, `product.ts`, `cart.ts`, `order.ts`, `inventory.ts`); a new SQL verification script under `supabase/verification/`.

**Preconditions**: the delivery strategy (2.4); DN-34 confirmed; IN-05 (names) fixed.

**Completion criteria**
- The full migration chain builds locally and v2 RPCs still run against the new schema.
- An Order-less Payment can exist; a second Order for the same Payment is impossible at the constraint/structure level.
- `is_sold_out` exists with a safe default; the allocation bound rejects an over-allocation.
- Shared types compile in all three apps.

**Verification**: `pnpm supabase db reset`; a SQL verification script for each new constraint (positive and negative cases) and a v2 smoke script (create order, cancel, refund request) on the new schema; targeted typecheck of `packages/types`, `apps/client-web`, `apps/user-web`, `apps/client-pwa`; `git diff --check`.

**Related**: BR-07, BR-25, BR-29, BR-30, BR-31, BR-45 (structure), BR-46 · CF-02, CF-04, CF-06, CF-14 (structure) · DN-34 · IN-05, IN-10.

**Gate**: migration reported ready (not applied to production); v2 smoke unchanged; types compile; user approval.

---

## Phase 2 — Stock, allocation, and sellability core

**Goal**: implement the B1 stock model (physical `current_stock` + `reserved_stock`), shortage-tolerant allocation, and stock-independent sellability, verifiable without any payment flow.

**Scope**
- In:
  - Allocation RPC(s), service-side: reserve what can be secured in a deterministic Ware order, record allocation rows, leave the rest as shortage, treat a Ware-less Variant as fully short (BR-09, BR-43, BR-47, BR-48).
  - Release (reserved down), consume (current and reserved down), restock primitive (current up), all keeping `0 <= reserved <= current` and serialized by row locks.
  - Admin physical stock adjustment that cannot go below `reserved_stock`.
  - Conversion of existing v2 stock values (net remainder) to physical values plus reservations, with a verification query (IN-09); validated locally only and applied to production only at cutover (2.3). Existing v2 RPCs keep their v2 behavior until then; the v3 stock functions are new objects (2.2).
  - Sellability: availability derived from `is_active`, `is_sold_out`, and post publication instead of stock; `list_product_posts`, `get_product_post_detail`, `get_cart`, and the Consumer stock-status contract updated.
  - user-web: `is_sold_out` setting, and the inventory screen showing physical and reserved stock.
- Out: Order creation (Phase 4), Admin additional allocation UI and `PROCESSING` wiring (Phase 6), cancel/refund wiring.

**Main change targets**: new forward migration(s); RPCs `reserve/release/consume` usage and a new allocate orchestration, `get_product_variant_availability`, `list_product_posts`, `get_product_post_detail`, `get_cart`, `adjust_ware_stock`, `set_ware_stock`, `admin_update_product`; `packages/types`; user-web inventory and product screens; a verification script and a concurrency script.

**Preconditions**: Phase 1.

**Decision Before Implementation** (decided in Phase 2): DN-25 — the Consumer sellability status is `AVAILABLE` / `SOLD_OUT` / `UNAVAILABLE`, there is no `LOW_STOCK`, and the numeric stock level is never exposed; IN-09 — allocation rows and `reserved_stock` change in the same database transaction (no asynchronous synchronization), consistency is verified by the invariants and the cutover verification, and the conversion of existing data is `supabase/cutover/v3_stock_and_sellability.sql` (applied only at cutover).

**Completion criteria**
- The stock example of S-37 (stock 10, orders 6 and 6) reproduces exactly at the database level.
- Allocation never produces a negative or over-reserved Ware; concurrent allocations do not double-take.
- Availability no longer reads numeric stock; a sold-out Variant is blocked, a stock-zero Variant is not.
- A Ware-less Variant yields an allocation of 0 and full shortage.

**Verification**: `pnpm supabase db reset`; SQL scenario scripts for S-02, S-03, S-16 mechanics, S-17, S-28, S-37; a concurrency script (parallel allocations on one Ware); the conversion verification query; targeted typecheck/lint; manual check of the Admin screens against the local stack.

**Related**: BR-04, BR-06 to BR-11, BR-18, BR-19, BR-28, BR-43, BR-46, BR-47, BR-48 · CF-01 (mechanics), CF-02, CF-06, CF-07, CF-18 · DN-25 · IN-09.

**Gate**: invariants and S-37 verified by SQL; concurrency script passes; the Consumer contract changes are listed for Phase 8; user approval.

---

## Phase 3 — Payment reversal engine

**Goal**: create and process payment reversals with their invariants, independent of what triggers them.

**Scope**
- In:
  - A service-side reversal creation RPC: takes the Payment row lock, enforces `SUM(PENDING + SUCCEEDED) <= payments.amount`, enforces idempotency-key uniqueness, sets the cause and links (BR-30, BR-32, BR-34).
  - The state cycle `PENDING → SUCCEEDED | FAILED`; a `FAILED` reversal frees its amount; `payments.status` is never changed by a reversal (BR-29).
  - A server-side PG adapter interface used to execute a reversal, with a PG Test simulated implementation for development (the PG Test service has no cancel API) and a placeholder for the production adapter.
  - Retry and reprocessing mechanics (IN-01) and the derived payment-level refund display (IN-06).
- Out: the cause-specific flows (finalize failure in Phase 4, cancel in Phase 5, refund in Phase 7), production PG integration.

**Main change targets**: new forward migration; reversal RPCs; a Route Handler or job that executes reversals; `packages/types`; a verification script and a concurrency script.

**Preconditions**: Phase 1.

**Decision Before Implementation** (decided in Phase 3): DN-40 — retry and `MANUAL_RECONCILIATION` creation only at the `service_role` boundary, the acting Admin recorded in `requested_by`, Admin UI/approval UX decided in the phase that wires it; IN-01 — a retry reuses the existing `payment_reversals` row and increments `attempt_count`, with no separate attempt history table in the initial v3; IN-03 — the Phase 1 trigger stays the final guard and the creation RPC takes the Payment row lock to serialize concurrent requests.

**Completion criteria**
- Concurrent reversal requests cannot exceed the Payment amount; a duplicate request with the same key creates one reversal (S-29).
- A simulated PG failure or delay leaves the reversal `PENDING`/`FAILED` and does not touch `payments.status` (S-27 mechanics).
- The derived display shows in-progress, partial, and full states.

**Verification**: SQL verification script (cap, idempotency, cause and link constraints, `FAILED` freeing amount); concurrency script (parallel requests against one Payment); a local run of the simulated adapter with forced failure and delay; targeted typecheck of the server code.

**Related**: BR-26 (mechanics), BR-29 to BR-34 · CF-14 (part), CF-15 (prepares Phase 4) · DN-40 · IN-01, IN-02, IN-03, IN-04, IN-06.

**Gate**: BR-34 demonstrated under concurrency; idempotent creation and the failure/retry cycle demonstrated; user approval.

---

## Phase 4 — Stage 2 finalize

**Goal**: Payment-first checkout. The Client checks out, the PG (test mode) completes, the server confirms, and finalize creates the Order with allocation. **This phase is the first core integration gate of v3**: it is the first point where reversal, stock/allocation, sellability, and payment work together end to end.

**Scope**
- In:
  - Server-side Payment creation without an Order; the server determines the amount from the submitted items (BR-44).
  - Server confirm as the primary path (the server verifies the result with the PG; the Client-picked result of the PG Test adapter stays a development-only adapter).
  - Finalize RPC: revalidate sellability (BR-03, BR-46), recompute the total and compare with the Payment amount, create the `PENDING` Order and snapshots, allocate through Phase 2, link the Payment, exactly one Order per `payment_id` (a repeat returns the existing Order) (BR-45).
  - Business-validation failure or price mismatch → no Order and a `FINALIZE_FAILURE` reversal through Phase 3 (BR-27, BR-45).
  - The auxiliary webhook endpoint (de-duplication, missed successes, orphan input, reversal result notification); production PG specifics stay behind the adapter (IN-10).
  - The orphan-Payment detection job that starts an `ORPHAN_PAYMENT` reversal (IN-11).
  - `complete_payment` rewritten: no `PAID`, no overwriting of a PG success (CF-13 part, CF-15).
  - client-web checkout flow: cart → checkout → PG (test) → success; the Client resubmits items/address at finalize; shortage is not an error message.
- Out: PWA ordering (Phase 8), cancel, fulfillment, removal of the v2 order RPC (Phase 8).

**Main change targets**: new forward migration(s); a new finalize RPC and the Payment creation/confirm RPCs; client-web `app/api/payments/*` and a webhook route; `lib/payment/*`; client-web `app/order`, `app/payment`, `app/success`; `packages/types`; a verification script and a concurrency script.

**Preconditions**: Phases 1, 2, 3.

**Decision Before Implementation** (decided in Phase 4): DN-38 / IN-11 — an Order-less `SUCCEEDED` Payment becomes an `ORPHAN_PAYMENT` reversal target after a default window of 30 minutes, created under the Payment row lock; DN-39 — a transient finalize failure rolls back and the Client retries, with the orphan rule as the last fallback; DN-41 — no zero-amount Orders in the initial v3; DN-23 (narrowed) — `finalize` does not touch the Cart; IN-10 — one Order per Payment through the Payment row lock and the unique `orders.payment_id`, with `payments.order_id` set in the same transaction. Not settled and carried to Phase 8: DN-19, DN-20, DN-24 (Client-facing behavior), and the rest of DN-23 (Cart clearing, selected-item orders, buy-now). Known limitation of the handoff structure, not a blocker: IN-12.

**Completion criteria**
- **Minimum integration scenarios** (all five must pass before the gate):
  1. normal purchase (S-01);
  2. shortage-tolerant purchase (S-02: two Orders of 6 on stock 10; both `PENDING`, the second with shortage 2, stock never negative);
  3. SOLD_OUT rejection (S-04 before the PG; S-07 after PG success: no Order and a reversal);
  4. price mismatch → reversal (S-06: no Order, one `FINALIZE_FAILURE` reversal, full amount);
  5. idempotent duplicate finalize (S-10, and S-11 for a repeated confirm/webhook: one Order, one allocation).
- S-03, S-05, S-08, S-09, and S-26 also pass at API level.
- N concurrent finalize calls for one Payment create exactly one Order and one allocation.
- A price mismatch or SOLD_OUT after PG success creates no Order and one `FINALIZE_FAILURE` reversal.
- An orphan Payment is reversed after the decided window and a late finalize cannot resurrect it.
- The v3 checkout works end to end in the local stack with the PG Test adapter.

**Verification**: SQL verification script for finalize (positive, mismatch, sold-out, duplicate); a concurrency script for parallel finalize; API-level scripted calls against the local stack; manual local run of the client-web flow; targeted typecheck/lint of client-web and packages.

**Related**: BR-01 to BR-05, BR-09, BR-25, BR-27, BR-43 to BR-47, BR-49 · CF-01, CF-03, CF-04, CF-05 (labels start), CF-13 (`complete_payment` part), CF-15 · DN-19, DN-20, DN-23, DN-24, DN-38, DN-39, DN-41 · IN-10, IN-11.

**Gate (first core integration gate)**: the five minimum integration scenarios pass; finalize idempotency and both reversal paths are verified; no Order exists without a succeeded Payment in the v3 path; user approval. Phases 5 to 9 start only after this gate.

---

## Phase 5 — Cancel

**Goal**: whole-Order Cancel of a `PENDING` Order by the Client or the Admin, idempotent, with allocation release and a payment reversal.

**Scope**
- In:
  - Cancel RPC for the owning Client and an Admin path: `PENDING` only, whole Order; an already `CANCELLED` Order returns success without side effects (BR-35, BR-17).
  - Allocation release once (`reserved_stock` down, Phase 2) and one `ORDER_CANCEL` reversal (Phase 3) per cancellation, in a consistent lock order.
  - The "cancellation is no longer possible" outcome when the Order has already left `PENDING`.
  - Admin cancel/reject Route Handler and Order-inspector action; Client cancel action; reason/actor recording per the decision.
- Out: partial cancel (BR-36), cancel after `PROCESSING`.

**Main change targets**: new forward migration; cancel RPC(s); user-web `app/api/admin/orders/[orderId]` and the Order inspector; client-web history/detail cancel action; `packages/types`; verification and concurrency scripts.

**Preconditions**: Phases 2, 3, 4.

**Decision Before Implementation** (decided in Phase 5): DN-12 — the actor (`CLIENT`/`ADMIN` and user id) and an optional reason are recorded in the internal table `order_cancellations`, one row per Order, the first cancel kept; DN-19 (narrowed) — only the API/domain contract is fixed here (the response carries the outcome and the order id, no reversal detail); how cancellation and reversal progress and any reason are shown to the Consumer is carried to Phase 8.

**Completion criteria**
- S-12 to S-15, S-27, S-30, S-32 pass.
- Double click, Client + Admin at the same moment, and retry after timeout produce one release and one reversal.
- A shortage Order cancels with only its allocated part released.

**Verification**: SQL verification script; concurrency script (repeated and simultaneous cancels); local API and UI check of both actors. The cancel-versus-`PROCESSING` race is verified at the Phase 6 gate.

**Related**: BR-16, BR-17, BR-26, BR-28, BR-35, BR-36, BR-43 · CF-08, CF-14 (cancel part), CF-18 (cancel part) · DN-12, DN-19.

**Gate**: idempotency and single-release/single-reversal demonstrated; user approval.

---

## Phase 6 — Admin fulfillment

**Goal**: the Order lifecycle with the allocation gate, the reservation consume, and Admin shortage handling.

**Scope**
- In:
  - Transition RPC replaced: `PENDING → PROCESSING` (requires full allocation; consumes the reservation), `PROCESSING → SHIPPED`, `SHIPPED → DELIVERED`; the manual `PENDING → PAID` is removed; no allocation decrease after `PROCESSING` (BR-15, BR-24, BR-42, BR-43).
  - Admin shortage view per Order and OrderItem (BR-12) and the Admin additional allocation, competing safely with newer Orders (BR-13, BR-28).
  - Order list/detail UI: status labels without `PAID`, shortage display, transition actions.
  - A `PENDING` expiry only if the decision requires one.
- Out: Refund and restock (Phase 7), removal of `PAID` from the schema (Phase 8).

**Main change targets**: new forward migration; the transition RPC and additional-allocation RPC; user-web `app/api/admin/orders*`, `app/(admin)/orders/page.tsx`, `component/order/*`; `packages/types`; verification and concurrency scripts.

**Preconditions**: Phases 2 and 4 (Phase 5 for the race check).

**Decision Before Implementation**: DN-14 (remaining transition details), DN-02 (additional-allocation workflow), DN-04 (whether any `PENDING` expiry is needed).

**Completion criteria**
- An Order with shortage cannot enter `PROCESSING`; a fully allocated Order can, and the reservation is consumed exactly once.
- No path decreases or releases allocation after `PROCESSING`.
- Admin sees shortage per Order/OrderItem and can allocate additional stock; a concurrent newer Order may take the stock first without corrupting the invariants.
- Cancel racing `PROCESSING` ends in exactly one outcome, and the losing Client cancel gets the "no longer possible" message.
- S-16, S-17, S-28, S-31, S-37 pass.

**Verification**: SQL verification script (gate, consume, no release after `PROCESSING`); concurrency script (allocation vs new Order, cancel vs `PROCESSING`); local UI check of the Admin Order screens; targeted typecheck/lint of user-web.

**Related**: BR-12 to BR-15, BR-24, BR-28, BR-35, BR-42, BR-43 · CF-09, CF-10, CF-13 (manual `PAID`), CF-18 (consume) · DN-02, DN-04, DN-14.

**Gate**: gate and consume verified; race verified; user approval.

---

## Phase 7 — Refund and restock

**Goal**: Refund eligibility, the cumulative quantity invariant, atomic approval with its reversal, and explicit restock under Policy B.

**Scope**
- In:
  - `request_refund`: allow-list of `PROCESSING`/`SHIPPED`/`DELIVERED`, row locking so the cumulative valid quantity never exceeds `OrderItem.quantity` even concurrently, snapshot unit price, the decided status set (BR-37, BR-38).
  - Approval RPC: `REQUESTED → APPROVED` and the linked `REFUND` reversal (`PENDING`) in one transaction; failure to create the reversal means no approval; a later PG failure does not revert the approval (BR-39). Rejection: no reversal, no Payment, no stock effect.
  - Restock: `admin_restock_refund_item` aligned to B1 (current stock up, original allocation Ware, at most the allocated quantity); retire `restock_order_item` (BR-40, BR-42).
  - Refund status CHECK; Admin refund screen (approve/reject/restock); Client refund card (partial quantities, status labels); the seller-initiated path if decided.
- Out: partial approval, withdrawal, refund window, and amount rules with discount/shipping unless decided before this phase.

**Main change targets**: new forward migration; `request_refund`, approval RPC, `admin_restock_refund_item`; user-web `app/(admin)/refund`, `app/api/admin/refunds*`; client-web refund card and hooks; `packages/types` (`refund.ts`, `adminRefund.ts`); verification and concurrency scripts (extending the existing refund restock scripts).

**Preconditions**: Phases 3 and 6.

**Decision Before Implementation**: DN-47 (Refund status set), DN-42 (window), DN-43 (partial approval), DN-44 (withdrawal), DN-45 (repeat idempotency), DN-46 (seller-initiated Refund / seller-failure workflow), DN-27 (amount with discount/shipping).

**Completion criteria**
- S-18 to S-22 and S-33 to S-36 pass; S-19 also under concurrent requests (the cumulative limit holds).
- Fault injection: if the reversal row cannot be created, the approval is not committed; a failed PG execution leaves the Refund `APPROVED`.
- Approval never changes stock; restock is explicit, allocation-bounded, and never applies to shortage quantity.
- The Order status is unchanged by any Refund.

**Verification**: SQL verification script; concurrency script for the cumulative invariant and for approval + reversal; local API/UI checks; targeted typecheck/lint of user-web and client-web.

**Related**: BR-30, BR-32, BR-34, BR-37 to BR-42 · CF-14 (refund part), CF-16, CF-17 · DN-27, DN-42 to DN-47 · IN-07, IN-08.

**Gate**: cumulative invariant and atomic approval verified; user approval.

---

## Phase 8 — Consumer/PWA alignment and legacy contraction

**Goal**: bring the remaining Consumer surfaces to the approved rules and remove the legacy paths, in that order: alignment first, contraction last.

**Scope**
- In:
  - Consumer surfaces: order number is `order_number` everywhere (BR-22); status labels and actions without `PAID` and without "결제하기" on `PENDING`; no shortage error messages; the renamed sellability contract; Order history/detail on the v3 lifecycle.
  - client-pwa within BR-49 (product list/detail, Cart, Order creation/lookup, no separate PG UI, no full parity); Point top-up per the decision.
  - Admin dashboards consistent with the physical/reserved stock meaning.
  - Contraction: map existing `PAID` data and remove `PAID` from `orders_status_valid` and the types, remove `create_order_from_cart`, `restock_order_item`, the Order-bound branch of `payments_target_valid`, and dead client code.
- Out: any new feature beyond BR-49.

**Main change targets**: client-web pages/components/hooks (history, order, payment, cart, point); client-pwa `app/page.tsx`, `lib/api.ts`; user-web dashboard; `packages/types`; a contraction migration.

**Preconditions**: Phases 1 to 7 are complete and their gates passed, so the v3 paths are verified; no client still uses a legacy path. Legacy contraction is performed only after that. Consumer/PWA alignment does not bring legacy removal forward: alignment is done on top of the v3 paths while the legacy objects still exist, and removal is the last step of this phase.

**Decision Before Implementation**: DN-48 (how PWA Order creation works when a real Order exists only after PG success), DN-49 (fate of the existing Point top-up); carried over from Phase 4: DN-19, DN-20, DN-24 (what the Client sees for finalize failures, PG failure retry, in-progress Payments) and DN-23 (Cart clearing after a purchase, selected-item orders, buy-now).

**Completion criteria**
- No source reference to `PAID`, `create_order_from_cart`, or `restock_order_item` remains (search-verified); all three apps typecheck.
- Consumer screens follow BR-20 to BR-23; the PWA scenario S-25 and S-24 behave as decided.
- The contraction migration builds on the full chain and is reported ready.
- The contraction was prepared and validated only after the v3 paths of Phases 1 to 7 were verified, and no legacy object was removed earlier.

**Verification**: `pnpm supabase db reset`; source search for removed names; targeted typecheck/lint/build of the three apps; local walkthrough of Consumer and PWA flows.

**Related**: BR-20 to BR-24, BR-49 · CF-05, CF-06, CF-07, CF-11, CF-12, CF-13, CF-16 · DN-48, DN-49.

**Gate**: the v3 paths of Phases 1 to 7 are verified; the contraction migration is ready (not applied to production); no legacy references remain; user approval.

---

## Phase 9 — Production E2E and release verification

**Goal**: verify the approved scenarios on clean data and prepare the release.

**Scope**
- In:
  - Cutover execution (2.3): applying the production migrations and deploying the v3 applications together, only on the user's explicit instruction.
  - Clean test data with a dedicated Admin and two Clients (so ownership can be cross-checked); a script of the scenarios (S-01 to S-37 as applicable) with the physical stock and reserved stock recorded as real numbers before and after each step.
  - The list of migrations to apply, the required environment per app, and a rollback outline; production migration only on an explicit instruction that names the migrations.
  - Handling of the existing v2 test data in production only with explicit authorization.
  - Results recorded with `production E2E observed` or `code-level verification only`; the final report of unresolved items.
- Out: versions and tags unless requested.

**Preconditions**: Phases 1 to 8; the delivery strategy executed; the user's explicit production authorization.

**Completion criteria**
- Every applicable scenario passes or has a documented exception; no blocking bug remains.
- Consumer boundary (BR-20) verified on the network responses of the Consumer apps.
- Concurrency-sensitive scenarios (duplicate finalize, double cancel, concurrent refund requests) verified.

**Verification**: the E2E run itself, against the local stack first and then production only as authorized.

**Related**: all BR · CF-11 · DN-34.

**Gate**: user sign-off on the final report.

---

## 4. Cross-phase views

### 4.1 Conflicts and the phase that resolves them

| Conflict | Resolved in |
|---|---|
| CF-01, CF-02 | 2 (allocation, bound), 4 (finalize replaces the v2 order RPC) |
| CF-03, CF-04 | 1 (schema), 4 (flow) |
| CF-05 | 4 (semantics), 8 (labels) |
| CF-06, CF-07 | 1 (column), 2 (availability), 8 (contract/UI) |
| CF-08 | 5 |
| CF-09, CF-10 | 6 |
| CF-11 | 9 |
| CF-12 | 8 |
| CF-13 | 4 (`complete_payment`), 6 (manual `PAID`), 8 (removal) |
| CF-14 | 1 (tables), 3 (engine), 5, 7 |
| CF-15 | 4 |
| CF-16, CF-17 | 7 (CF-16 finalized by removal in 8) |
| CF-18 | 2 (model), 5 and 6 (release and consume wiring) |

### 4.2 Open decisions and the phase that needs them

| Phase | Decide before implementation |
|---|---|
| Pre-1 | delivery strategy (2.4), DN-34, IN-05 |
| 2 | DN-25, IN-09 (decided) |
| 3 | DN-40, IN-01, IN-03 (decided) |
| 4 | DN-38, DN-39, DN-41, IN-10, IN-11 (decided); DN-19, DN-20, DN-23, DN-24 carried to Phase 8 |
| 5 | DN-12 (decided); DN-19 carried to Phase 8 |
| 6 | DN-02, DN-04, DN-14 |
| 7 | DN-27, DN-42, DN-43, DN-44, DN-45, DN-46, DN-47 |
| 8 | DN-48, DN-49, and from Phase 4: DN-19, DN-20, DN-23, DN-24 |
| 9 | none |

Every open decision in the business document appears above at least once. DN-19 is needed in two phases (Phase 4 for finalize failure, Phase 5 for cancellation progress), and DN-25 was decided in Phase 2.

### 4.3 Scenarios and the phase that first verifies them

| Phase | Scenarios |
|---|---|
| 2 | S-02, S-03, S-04 (flag), S-16, S-17, S-28, S-37 (database level) |
| 3 | S-27 (mechanics), S-29 |
| 4 | S-01, S-05 to S-11, S-26 |
| 5 | S-12 to S-15, S-27, S-30, S-32 |
| 6 | S-16, S-17, S-28, S-31, S-37 (through `PROCESSING`) |
| 7 | S-18 to S-22, S-33 to S-36 |
| 8 | S-24, S-25 |
| 9 | all applicable scenarios, on clean data |

S-23 (Multi-Ware) is verified at the database level in Phase 2 and again in Phase 9.

---

## 5. Out of scope for the initial v3

- Point payment (BR-49); authorize/capture (BR-49); partial Cancel (BR-36).
- A Product-level sold-out flag (BR-46); an explicit Ware priority (BR-48); non-stock-tracked goods (BR-47).
- FIFO or priority allocation for shortage Orders (BR-13, BR-28).
- A separate PG payment UI in client-pwa and full parity with client-web (BR-49).
- A generic payment-event ledger as the core payment model (BR-33).

## 6. Maintenance

- Phase contents change only when the business document or the user's decisions change.
- When a decision listed in 4.2 is made, it moves into the business document first; the phase then drops it from its "Decision Before Implementation" list.
- v2 documents are not edited.
- Versioning: the repository version `1.1.0` marks the first integrated v3 milestone (the Phase 4 Stage 2 finalize gate). It does not mean that the production cutover happened: production still runs the v2 runtime, and the v3 migrations and cutover are applied only on the user's explicit instruction (2.3).
