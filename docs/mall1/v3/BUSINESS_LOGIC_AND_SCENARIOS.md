# Mall v3 — Business Logic and Scenarios

Draft 0.13 · 2026-09-27 · Source of Truth candidate

This document is analysis and policy capture only. It is not an implementation plan and it does not define phases.

---

## Contents

1. Document Status / Source of Truth
2. Terminology
3. Approved v3 Business Rules
4. Domain-by-Domain Audit
5. Integrated Lifecycle
6. Scenario Catalog
7. DECISION NEEDED Registry
8. v2 Conflict Matrix
9. Implementation Impact Index

---

## 1. Document Status / Source of Truth

### 1.1 Role of this document

- This document records the Mall v3 business rules and keeps them separate from what the v2 implementation does.
- Rules in section 3 are user-approved (`APPROVED`) and are the only rules in this document that act as policy.
- Everything else is evidence (what v2 does, what old documents intended), an open question (`DECISION NEEDED`), or an implementation note (not a business decision).
- Authority order (from `AGENTS.md` / `CLAUDE.md`):
  1. explicit user-approved business decisions
  2. this document
  3. approved v3 domain contracts
  4. current schema / migrations / RPC / application code (evidence of existing behavior only)
  5. `docs/mall1/v2/*`
  6. legacy PRD
- If this document and an approved user decision disagree, the user decision wins and this document must be corrected.
- Current code, v2 SQL, v2 documents, the legacy PRD, and old E2E successes are not v3 policy.
- Do not turn a `DECISION NEEDED` item into an implementation choice.

### 1.2 Classification and evidence labels

Every rule, finding, and scenario line carries one or more of these labels.

| Label | Meaning |
|---|---|
| `APPROVED` | Business rule approved by the user for v3 (section 3). |
| `CONFIRMED` | The current implementation and an approved rule agree. |
| `CONFLICT` | Code, documents, or legacy intent disagree with an approved rule. Registered in section 8.1 as `CF-xx`. |
| `DECISION NEEDED` | No approved rule exists. Registered in section 7.1 as `DN-xx`. |
| `production E2E observed` (alias `[E2E]`) | Behavior actually observed in the v2 production E2E (Phase 8, 2026-09-25/26), as reported by the tester. It proves observed v2 behavior only. |
| `code-level verification only` (alias `[CODE]`) | Read from SQL / TypeScript source. Not exercised in production. |
| `legacy intent` (alias `[LEGACY]`) | Stated in the legacy PRD. Historical intent only, never policy. |

Reference IDs used in this document: `BR-xx` approved rules (section 3), `CF-xx` conflicts (section 8.1), `DN-xx` open decisions (section 7.1), resolved decisions (section 7.2, shown struck through), `IN-xx` implementation notes (section 7.3, not business decisions), `VF-xx` non-policy verification items (section 7.4), `S-xx` scenarios (section 6).

### 1.3 Treatment of v2 documents and the legacy PRD

- `docs/mall1/v2/*` is preserved unchanged as historical documentation of the v2 implementation. It is used here only as evidence.
- The legacy PRD (`docs/mall1/prd/*`) is used only as `legacy intent`. Where it happens to agree with an approved rule, that is noted, but it is not the source of the rule.
- Old E2E successes (`phase8-production-e2e.md`, `phase8-handoff.md`) prove observed v2 behavior, not desired v3 behavior.

### 1.4 How this draft was produced

Inspected (read-only): `AGENTS.md`, `CLAUDE.md`; `docs/mall1/v2/{PHASES,product-schema,payment-contract,phase8-production-e2e,phase8-handoff}.md`; `docs/mall1/v2/sql/05_rpc_order.sql`; migrations `20260924093151_remote_schema.sql`, `20260925070000_restrict_privileged_rpc_execute.sql`, `20260925130000_get_cart_read_only.sql`, `20260925140000_payments_and_points.sql`, `20260925150000_refund_item_restocks.sql`; user-web Admin Route Handlers (orders, refunds, restocks, wares, overview); client-web order/payment/history/cart/point/wishlist code (including `hooks/history/useOrderAfterSales.ts`); shared types `packages/types/src/refund.ts` and `product.ts`; client-pwa `app/page.tsx` and `lib/*`; legacy PRD (`1_Inventory`, `3_0/3_1/3_2_1 Order`, `6_1_Point_System`).

### 1.5 Verification limits

- No typecheck, lint, test, build, migration, or database query was run to produce this document.
- `[CODE]` statements come from reading source. `[E2E]` statements come from tester reports during the v2 Phase 8 production E2E; they are not re-verified here.
- Not observed in any production E2E: shortage/oversold orders, partial refund, partial restock, over-restock rejection, Multi-Ware allocation, payment reversal, concurrent requests.

---

## 2. Terminology

| Term | Definition | Status |
|---|---|---|
| Stage 1 Checkout | Temporary checkout state held by the Client. It is not a database Order. PG interaction happens here. May stay open for a long time. Not an Admin fulfillment order. The server records only the Payment of the PG attempt. | `APPROVED` (BR-01, BR-25, BR-44) |
| Stage 2 Order Finalization | The server-side step, after PG completion, that creates the real Order from the resubmitted items/address and links the Payment to it. Preceded by server revalidation. | `APPROVED` (BR-03, BR-05, BR-25, BR-44, BR-45) |
| Real Order | A row in `orders`, created at Stage 2. First status is `PENDING`. | `APPROVED` (BR-05) |
| `PENDING` | v3: a real Order the seller has to process. In the normal flow it exists only after the PG flow succeeded, so it is an already-paid Order. v2: an Order created before payment, awaiting payment. | v3 meaning `APPROVED` (BR-05, BR-24); v2 meaning `[CODE]` `[E2E]` (see CF-05) |
| Order lifecycle | `PENDING → PROCESSING → SHIPPED → DELIVERED`, with `CANCELLED` as a separate terminal state. | `APPROVED` (BR-24); remaining transition details `DECISION NEEDED` (DN-14) |
| `PAID` | A v2 Order status set when a payment succeeds. Removed from the v3 Order lifecycle. | `APPROVED` removal (BR-24); v2 usage is `CONFLICT` (CF-13) |
| Cancel | Cancellation of a whole `PENDING` Order by the Client or the Admin. Not available from `PROCESSING` on. Partial Cancel is not supported in the initial v3. | `APPROVED` (BR-35, BR-36) |
| Refund | The money-return domain for Orders in `PROCESSING`, `SHIPPED`, or `DELIVERED`, recorded in `refund_requests` and `refund_items`, partial per OrderItem quantity. It does not change the Order fulfillment status. | `APPROVED` (BR-37 to BR-41) |
| Payment | The record of the original PG payment (table `payments`). Its `status` is `PENDING` / `SUCCEEDED` / `FAILED` and is managed separately from the Order status. It may exist before the Order does. The original success is preserved after any reversal. | `APPROVED` (BR-24, BR-25, BR-29) |
| Payment reversal | A row in the child table `payment_reversals` (provisional name) recording a cancellation, refund, or reversal of (part of) a Payment. One Payment may have several. Causes include order cancel, refund, finalize failure, orphan payment, and administrative adjustment. Base statuses `PENDING` / `SUCCEEDED` / `FAILED`. | `APPROVED` (BR-30, BR-31, BR-32, BR-34); names and detail states are implementation design (IN-04, IN-05) |
| Derived refund display | The payment-level "refund in progress / partially refunded / fully refunded" indication, derived from the reversals. It is never a `payments.status` value. | `APPROVED` (BR-29); computation is an implementation note (IN-06) |
| Sellability | Consumer-visible sale state of a ProductPost/Product/Variant: sellable, sold out, sale disabled, unpublished. May block checkout and Order finalization. | `APPROVED` (BR-19) |
| `SOLD_OUT` / `is_sold_out` | Explicit sellability state decided by Admin, stored as a boolean `is_sold_out` on the Variant. Never derived from `current_stock`. | `APPROVED` (BR-18, BR-19, BR-46) |
| Sale disabled / `is_active` | Explicit state in which a Product/Variant cannot be sold. `is_active` on `products` and `product_variants` is kept for it. | `APPROVED` (BR-03, BR-46) |
| Numeric stock shortage | Requested quantity exceeds what can currently be allocated. An Admin fulfillment concern. Never a reason to reject Order creation. | `APPROVED` (BR-04, BR-11) |
| `current_stock` | Physical stock of a Ware. Never negative. A `PENDING` allocation does not reduce it; entering `PROCESSING` consumes it. | `APPROVED` (BR-06, BR-43); v2 uses it as a net remainder (CF-18) |
| `reserved_stock` | Quantity held by the allocations of `PENDING` Orders. `0 <= reserved_stock <= current_stock`. Stock available for a new allocation is `current_stock - reserved_stock`. | `APPROVED` (BR-43); not used by any v2 application (CF-18) |
| Allocation | A row in `order_item_ware_allocations` assigning a quantity of one Ware to one OrderItem. It is held as `reserved_stock` while the Order is `PENDING`. | `APPROVED` (BR-07, BR-43) |
| `allocated_quantity` | `SUM(order_item_ware_allocations.quantity)` for an OrderItem. May be less than `OrderItem.quantity`. | `APPROVED` (BR-08) |
| `shortage_quantity` | `OrderItem.quantity - allocated_quantity`. Computed from allocation records, not stored in a mutable OrderItem column by default. | `APPROVED` (BR-08) |
| Ware | Internal inventory unit. Never exposed to Consumers. | `APPROVED` (BR-20) |
| Warehouse | Internal space a Ware belongs to. Never exposed to Consumers. | `APPROVED` (BR-20) |
| Client / Consumer | The buying user (`user_profiles.role = 'CLIENT'`). | `CONFIRMED` (v2 role model, see section 4.14) |
| Admin / seller | The operator using `apps/user-web` (`role = 'ADMIN'`). | `CONFIRMED` (v2 role model) |
| PG | Payment gateway. In v2 only the PG Test recorder exists. The initial v3 uses single-step approval (no authorize/capture). | `CONFIRMED` (v2); scope `APPROVED` (BR-45, BR-49) |
| OrderItem snapshot | Order-time copy of product name, variant label, options, image, unit price. Immutable in v2 (`prevent_order_item_update`). | v2 rule; carry-over `DECISION NEEDED` (DN-34) |

---

## 3. Approved v3 Business Rules

Source of every rule: explicit user decisions recorded in `CLAUDE.md` ("Confirmed v3 Business Direction") and the user's statements in this project (2026-09-26). Each rule below is `APPROVED`.

### 3.1 Order 2-stage model

#### BR-01 Stage 1 is a client-held temporary checkout state

- The Client holds temporary order/checkout information.
- No `orders` row exists yet.
- PG/payment interaction happens in this stage.
- This stage may remain open for a long time.
- This stage is not an Admin fulfillment order.
- A server-side Payment record of the PG attempt may exist meanwhile (BR-25); the server stores nothing else about Stage 1 (BR-44).

#### BR-02 No database `CHECKOUT_PENDING` state

- Do not introduce a database `CHECKOUT_PENDING` state unless a later decision explicitly requires it.

#### BR-03 Server revalidation immediately before Stage 2

The server revalidates the selected sellable item before creating the real Order, including:

- ProductPost / Product / Variant still valid
- explicit sold-out state
- sale-disabled state
- current server-side price
- other explicitly approved sellability constraints

The server never trusts price or state sent by the Client.

#### BR-04 Numeric stock shortage never blocks Order creation

- Numeric stock shortage alone must not reject final Order creation.
- Only explicit SOLD_OUT / sale-disabled (and other approved sellability constraints) block it.

#### BR-05 Stage 2 creates the real Order as `PENDING`

- After the PG/payment flow reaches the point where the order is finalized (PG completion / callback flow), the server creates the real Order.
- This is the first moment an `orders` row exists.
- The initial status is `PENDING`.
- `PENDING` means the seller has a real Order to process.
- A `PENDING` Order is a real sales-processing target and its demand counts against stock (see BR-10 for the exact held part).
- Because a real Order is created only after the PG flow succeeded, an existing Order normally implies that its payment passed (BR-24). Point payment is outside the initial v3 (BR-49); whether zero-amount Orders can exist is open (DN-41).

### 3.2 Stock and allocation

#### BR-06 `current_stock` is never negative

- Numeric shortage is never represented by a negative `current_stock`.

#### BR-07 Order quantity and allocation quantity are separate

- The assumption that every OrderItem is fully Ware-allocated at Order creation is removed.
- Allocation is recorded in `order_item_ware_allocations`.
- The allocation total for an OrderItem is less than or equal to `OrderItem.quantity`.

#### BR-08 Allocated and shortage quantities

```text
allocated_quantity = SUM(order_item_ware_allocations.quantity)   -- per OrderItem
shortage_quantity  = OrderItem.quantity - allocated_quantity
```

- Shortage is computed from allocation records.
- Shortage is not stored in a mutable OrderItem column by default (OrderItem snapshots are immutable).

#### BR-09 Stage 2 allocates only what can currently be secured

- When the real Order (`PENDING`) is created, only the stock that can currently be secured is allocated.
- Insufficient stock does not fail Order creation.
- The part that could not be secured is shortage (unallocated quantity).

#### BR-10 Allocated quantity is held for that Order

- Allocated quantity is held for the Order it was allocated to, as `reserved_stock` (BR-43).
- A later Order cannot take stock that is already allocated.
- The Admin additional allocation is explicit and never automatic (former DN-02, decided in Phase 6).

#### BR-11 Overselling at Order intake is allowed

Examples:

```text
physically available 10, valid Orders received 15
  -> 15 Orders may exist; the seller later processes what stock allows
     and may reject/cancel the excess Orders.

stock 10
  Order A x6 -> allocated 6, shortage 0
  Order B x6 -> allocated 4, shortage 2
  both Orders are created as PENDING
```

#### BR-12 Admin sees shortage per Order and per OrderItem

- Admin must be able to see shortage for each Order and each OrderItem.

### 3.3 New stock

#### BR-13 New stock is not auto-allocated

- Arrival of new stock does not automatically allocate to any shortage Order.
- Admin reviews shortage Orders and decides which Order receives additional allocation.
- Automatic FIFO or priority allocation is out of scope for now.
- The general form of this rule, covering every kind of available-stock increase, is BR-28.

### 3.4 Fulfillment gate

#### BR-14 Shortage Orders may stay `PENDING`

- An Order with shortage may exist as `PENDING`.
- Admin may add allocation, or cancel/reject the Order.

#### BR-15 No fulfillment while unallocated quantity remains

- While any OrderItem has unallocated quantity, the Order cannot proceed to a real fulfillment stage.
- At minimum, full allocation must be complete before `PROCESSING` / `SHIPPED`.
- Refund eligibility and the Refund/Restock rules rely on this gate (BR-37, BR-42).
- The transition details are decided (former DN-14, Phase 6): Admin only, one step forward, `PROCESSING` needs full allocation and payment evidence.

### 3.5 Cancel

#### BR-16 `PENDING` can be cancelled by Client and by Admin

- While an Order is `PENDING`, the Client can cancel it.
- While an Order is `PENDING`, Admin/seller can cancel/reject it.
- The boundary and scope of Cancel are BR-35 and BR-36. Payment handling on cancellation is BR-26.

#### BR-17 Cancellation is idempotent from the caller's perspective

- Applies to Client double-click, Client and Admin cancelling at nearly the same time, and retry after a timeout.
- The final state safely remains cancelled.
- No avoidable user-facing state-transition error is shown when the requested final state has already been reached.
- Repeated cancellation must not release allocation twice or start the payment reversal twice (BR-26, BR-32).

### 3.6 Sellability

#### BR-18 Sold-out is not numeric stock shortage

- `current_stock <= 0` must never automatically mean SOLD_OUT.

#### BR-19 SOLD_OUT is an explicit Admin-decided state

- SOLD_OUT / sale-disabled / unpublished are explicit sellability states.
- They are Consumer-visible.
- They may block checkout and Order finalization.
- The database representation is BR-46.

### 3.7 Consumer boundary

#### BR-20 Consumer never receives internal stock/logistics detail

Normal Consumer responses must not expose:

- Ware internals
- Warehouse internals
- `current_stock`
- `reserved_stock`
- allocation rows
- shortage numbers
- restock rows
- privileged inventory metadata

Consumers see only approved sellability and order-status information.

### 3.8 Other approved behavior (stated by the user during v2 verification)

#### BR-21 Wishlist is a ProductPost toggle

- The heart toggles: first click adds the ProductPost, clicking the same heart again removes it (and clicking again re-adds it).
- Wishlist is ProductPost-based.
- A separate "duplicate add" interaction is not part of the UI contract.
- Source: user statement, v2 Phase 8 step 22; reaffirmed 2026-09-26.

#### BR-22 Consumers see `orders.order_number`, never the internal id

- The order number shown to a Consumer is always `orders.order_number` (`ORD-...`).
- The internal `orders.id` UUID is never displayed to a Consumer as an order number.
- Implementation scope of the client-pwa correction is not decided.
- Source: user statement, v2 Phase 8 step 24; reaffirmed 2026-09-26.

### 3.9 Consumer view of shortage Orders

#### BR-23 A shortage Order looks like an ordinary `PENDING` Order to the Consumer

- The Consumer does not need to know about shortage or allocation internals.
- A `PENDING` Order that has shortage is shown to the Consumer as an ordinary `PENDING` Order.
- The Consumer is never shown `shortage_quantity`, `allocated_quantity`, `current_stock`, or Ware/Warehouse internal state.
- Only Admin sees shortage and handles it (BR-12).

### 3.10 Order and Payment are separate

#### BR-24 Order status and Payment status are separate; `PAID` is removed from the Order lifecycle

- Order status and Payment status are managed separately.
- Order lifecycle: `PENDING → PROCESSING → SHIPPED → DELIVERED`, with `CANCELLED` as a separate terminal state.
- `PAID` is removed from the Order lifecycle.
- A real Order is created only after PG success (Stage 2), so the existence of an Order implies that the payment passed in the normal flow.
- The v2 Admin manual `PENDING → PAID` action is a removal target in v3. No default path may advance an Order without payment evidence.
- The Payment status set stays `PENDING` / `SUCCEEDED` / `FAILED` (BR-29); reversal history is in `payment_reversals` (BR-30 to BR-34). Remaining Order transition details are open (DN-14). Mapping of existing v2 `PAID` data is an implementation-design item, not a policy item.

#### BR-25 A Payment may exist before the Order and is linked to it at Stage 2

- Stage 1 Checkout itself is not a database Order.
- The server keeps a verifiable Payment record of the PG transaction/attempt and its result, even when no Order exists yet.
- After PG success, Stage 2 finalize creates the real Order.
- The created Order and the Payment are then linked.
- The v2 rule that an `ORDER_PAYMENT` requires an existing `order_id` conflicts with this rule (CF-04).

### 3.11 Payment reversal

#### BR-26 Cancelling a `PENDING` Order starts Order cancellation, allocation release, and a payment reversal

- A `PENDING` Order has already passed payment. When a Client or Admin cancels it, three things start together:
  1. Order → `CANCELLED`
  2. allocation release (decreasing `reserved_stock`, BR-43)
  3. payment cancel/refund handling: a payment reversal (cause `ORDER_CANCEL`, BR-30) is created as `PENDING` and becomes `SUCCEEDED` once the PG cancellation succeeds
- An external PG call cannot be made atomic with the database transaction. Order status and Payment/reversal status are therefore separate, and consistency is eventual.
- `payments.status` stays `SUCCEEDED`. The payment-level "refund in progress / refunded" display is derived from the reversal (BR-29).
- A PG failure or delay must not cause the Order cancellation or the allocation release to be repeated.
- Duplicate or concurrent cancellation is idempotent (BR-17).
- Outbox/retry design, retry history, and detailed reversal states are implementation notes (IN-01, IN-04).

#### BR-27 A successful PG payment is never left without an Order or a follow-up

- If, after PG success, Stage 2 finalize cannot create the Order because of a business validation failure, the payment is not left unattended.
- Examples: SOLD_OUT, sale disabled, a price mismatch (BR-45), any other business validation failure.
- When the Order cannot be created, the payment goes to automatic cancel/refund handling: a payment reversal (cause `FINALIZE_FAILURE`, BR-30) is created as `PENDING` and becomes `SUCCEEDED` after the PG reversal/refund. `payments.status` stays `SUCCEEDED`.
- Invariant: the state "PG success + Order not created + no follow-up" is not allowed.
- The approved rule does not depend on any specific PG feature. Authorize/capture is not part of the initial v3 (BR-49).

### 3.12 Available stock and priority

#### BR-28 Available stock is never auto-allocated to existing shortage Orders

- Applies to every kind of available-stock increase: new stock arrival, stock released by cancelling another Order, and any other increase. Available stock means `current_stock - reserved_stock` (BR-43).
- Such stock is not automatically allocated to an existing shortage Order.
- Admin decides which shortage Order receives additional allocation.
- Before Admin allocates, a newer Order finalized at Stage 2 may allocate that stock.
- For now there is no FIFO, no first-come priority, and no reserved priority for shortage Orders.
- If a priority for shortage Orders is needed, it will be added as a separate policy.

### 3.13 Payment model: original payment and reversals

#### BR-29 The original payment and its reversals are separate; the original success is preserved

- `payments` is the record of the original payment.
- `payments.status` stays `PENDING` / `SUCCEEDED` / `FAILED`.
- `REFUNDED`, `PARTIALLY_REFUNDED`, and `REFUND_PENDING` are not added to `payments.status`, and the original success is never overwritten by them.
- The original payment success is preserved after any reversal.
- The payment-level "refund in progress / partially refunded / fully refunded" display is derived from the reversals.

#### BR-30 Reversals live in a child table and may be several per Payment

- A child table `payment_reversals` (provisional name) holds the cancel / refund / reversal history.
- One Payment may have several reversal rows (full refund, partial refund, repeated partial refunds).
- At minimum the following causes can be expressed. Exact enum names are decided at implementation design.
  - `ORDER_CANCEL`
  - `REFUND`
  - `FINALIZE_FAILURE`
  - `ORPHAN_PAYMENT`
  - `MANUAL_RECONCILIATION` (or an equivalent administrative adjustment)

#### BR-31 Basic reversal information and states

- Required concept: `payment_id`.
- Base information: amount, reason type, status, idempotency key, PG reference, failure reason, created/updated time.
- Optional links: `order_id`, `refund_request_id`.
- Base statuses: `PENDING`, `SUCCEEDED`, `FAILED`.
- More detailed states may be added at implementation design, but the original payment status and the reversal status stay separate.

#### BR-32 Reversal invariants

- A duplicate reversal for the same business request can be blocked by the idempotency key.
- A refund-request-based reversal is linked to that `refund_request`.
- An Order-cancel reversal can be expressed without a `refund_request`.
- A finalize-failure or orphan-payment reversal can be expressed without an Order.
- A reversal failure does not change the original payment success.

#### BR-33 A generic payment-event ledger is not the core payment model

- A generic `payment_events` ledger is not used as the core payment model.
- Keeping PG callback/webhook raw records in an append-only audit/de-duplication log remains a possible future implementation option (IN-02), not a business rule.

#### BR-34 Reversal amount invariant

Relative to the original payment amount, this always holds:

```text
SUM(amount of PENDING + SUCCEEDED payment_reversals) <= payments.amount
```

- A reversal that is still in progress (`PENDING`) occupies refundable amount, not only a `SUCCEEDED` one.
- A new reversal request whose `PENDING + SUCCEEDED` total would exceed the original payment amount is not allowed.
- A `FAILED` reversal no longer occupies refundable amount and is excluded from the total. When a `PENDING` reversal becomes `FAILED`, its amount becomes refundable again.
- Example: Payment 100,000 with a `SUCCEEDED` reversal of 30,000 and a `PENDING` reversal of 50,000 leaves at most 20,000 for a new reversal.
- The database enforcement (row lock, RPC transaction, constraint/check) is implementation design (IN-03).

### 3.14 Cancel and Refund boundary

#### BR-35 Order Cancel is allowed only in `PENDING`

| Order status | Cancel |
|---|---|
| `PENDING` | allowed, whole Order, by the Client or the Admin |
| `PROCESSING` | not allowed |
| `SHIPPED` | not allowed |
| `DELIVERED` | not allowed |
| `CANCELLED` | a further Cancel request keeps the final state idempotently (BR-17) |

- Money return after `PROCESSING` is handled by the Refund domain, not by Cancel.

#### BR-36 No partial Cancel in the initial v3; Cancel and Refund do not overlap

- The initial v3 does not support partial Cancel. A `PENDING` Cancel is always for the whole Order.
- Cancelling only some OrderItems or only some quantity is out of the initial v3 scope.
- Because Cancel exists only in `PENDING` and Refund only from `PROCESSING` on (BR-37), the two never apply to the same Order state, so cancel and refund cannot be mixed on one Order.

#### BR-37 Refund eligibility and partial Refund

- A Refund can be requested for an Order in `PROCESSING`, `SHIPPED`, or `DELIVERED`.
- A Refund cannot be requested for an Order in `PENDING` or `CANCELLED`. In `PENDING`, Cancel is used instead.
- Partial Refund is supported: some quantity of an OrderItem may be refunded, priced at the snapshot unit price of the OrderItem.
- No Refund window after `DELIVERED` is enforced in the initial v3; it is re-reviewed later as a separate policy (former DN-42, decided in Phase 9).

#### BR-38 Cumulative Refund quantity invariant

- For each OrderItem, the cumulative quantity of valid Refund requests/approvals never exceeds the original `OrderItem.quantity`.
- Several partial Refund requests are allowed, but their valid cumulative quantity cannot exceed the ordered quantity.
- Valid requests that exist at the same time (concurrently) must not push the total over the limit.
- How `REJECTED` and withdrawn requests are excluded from the total follows the Refund status policy: only `REQUESTED` and `APPROVED` requests are valid; withdrawal is not supported (former DN-44, DN-47, decided in Phase 7).
- Enforcing this under concurrency (row lock, RPC) is implementation design (IN-07). The current `request_refund` does not guarantee it (CF-17).

#### BR-39 Refund approval and the linked reversal succeed or fail together

- When Admin moves a Refund request `REQUESTED → APPROVED`, the linked payment reversal (cause `REFUND`, status `PENDING`, linked to that `refund_request`, BR-30, BR-32) is created in the same database transaction:

```text
REQUESTED
  -> one transaction
       refund_request = APPROVED
       linked payment_reversal = PENDING
  -> commit
```

- If the reversal row cannot be created, the Refund `APPROVED` is not committed either.
- After the transaction commits, a failure of the actual PG reversal is a separate matter: the Refund stays `APPROVED`, the reversal becomes `FAILED` or a retry target, and the Refund is never moved back to `REQUESTED`. Reprocessing is done in the reversal domain (IN-01, DN-40).
- A rejected Refund (`REJECTED`) creates no reversal, has no Payment effect, and has no stock or restock effect.
- The transaction structure is implementation design (IN-08).

#### BR-40 Refund approval does not restore stock; Restock is explicit (Policy B)

- Approving a Refund does not automatically restore stock.
- Restoring stock is an explicit Admin restock action.
- Restock is based on the Ware(s) the OrderItem was originally allocated from.
- Restock cannot exceed the actually allocated quantity.
- Shortage/unallocated quantity is never a restock target.
- For a Refund on a `PROCESSING` Order whose goods have not physically shipped, stock recovery is the same explicit restock: the reservation was already consumed when `PROCESSING` began (BR-43), so the restock increases `current_stock`.

#### BR-41 Refund does not change the Order fulfillment status

- Approving or completing a Refund does not change the Order fulfillment status to `CANCELLED`.
- A Refund on a `PROCESSING`, `SHIPPED`, or `DELIVERED` Order keeps that Order's status history.
- A partial Refund does not change the whole Order status.
- Refund state and amount are expressed separately by `refund_requests`, `refund_items`, and `payment_reversals`.

#### BR-42 No allocation decrease after `PROCESSING`; refundable OrderItems have no shortage

- In the normal v3 lifecycle, once an Order has entered `PROCESSING`, no ordinary allocation decrease/release path is allowed.
- Full allocation must already be complete before `PROCESSING` (BR-15).
- After that point, stock recovery is done through Refund/Restock, not Cancel.
- Therefore, in the normal lifecycle, a refund-eligible OrderItem (`PROCESSING` or later) has no shortage/unallocated quantity.
- An Order that still has shortage stays `PENDING` and is subject to Cancel or additional allocation.
- The stock effect follows BR-43. That this gate is enforced is currently not guaranteed by v2 (CF-09).

### 3.15 Stock model, Stage 2 finalize, sellability schema, and initial scope

#### BR-43 Stock model: physical stock plus reservation

- `current_stock` is the physical stock of a Ware and is never negative (BR-06).
- `reserved_stock` is the quantity held by the allocations of `PENDING` Orders. Always `0 <= reserved_stock <= current_stock`.
- Stock available for a new allocation is `current_stock - reserved_stock`.
- Allocation (at Stage 2, or an Admin additional allocation) increases `reserved_stock`, not `current_stock`.
- Cancelling a `PENDING` Order releases its allocation: `reserved_stock` decreases and `current_stock` is unchanged.
- Entering `PROCESSING` consumes the reservation: `current_stock` and `reserved_stock` both decrease by the allocated quantity.
- After that point stock is recovered only through Refund/Restock: an explicit Admin restock increases `current_stock`. This is the same for a Refund in `PROCESSING`, `SHIPPED`, or `DELIVERED` (BR-40, BR-42).
- Admin physical stock adjustments act on `current_stock` and cannot go below `reserved_stock`.
- Keeping `reserved_stock` synchronized with the allocation rows and converting existing v2 stock data are implementation design (IN-09).

#### BR-44 Stage 1 data stays with the Client; the server records only the Payment

- The checkout data (items, shipping address) is held by the Client.
- The server records only the Payment of the PG attempt (BR-25).
- At finalize, the Client resubmits the items and address.
- The server never trusts a Client price: it determines the payment amount itself and recomputes the total at finalize (BR-03, BR-45).
- An orphan Payment (PG success but no finalize) is handled by a reversal policy (cause `ORPHAN_PAYMENT`, BR-27, BR-30), not by a server-side finalize. Detection and the time window are open (DN-38).

#### BR-45 Finalize contract: roles, one Order per payment, price mismatch

- The server confirm, in which the server itself verifies the result with the PG, is the primary finalize path.
- A webhook is the auxiliary path: de-duplication, recording a success the browser did not report, orphan detection input, and reversal result notification.
- There is exactly one Order per `payment_id`. A repeated or concurrent finalize for the same Payment returns the existing Order instead of creating another.
- If the total recomputed at finalize does not match the Payment amount (a price mismatch), the finalize is rejected and the full payment is reversed (cause `FINALIZE_FAILURE`, BR-27).
- The structure that guarantees one Order per Payment, webhook signature verification, and the production PG endpoints are implementation design (IN-10). The v2 PG Test adapter, where the Client picks the result, is a development-only adapter and not a v3 trust model.

#### BR-46 Sellability schema: `is_active` kept, Variant `is_sold_out` added

- `is_active` on Product and Variant stays as "sale disabled".
- The Variant gets a boolean `is_sold_out`, set by the Admin.
- Either flag (and an unpublished ProductPost) blocks checkout and Order finalization (BR-03, BR-19).
- A Product-level sold-out flag is not part of the initial v3.
- `is_sold_out` is independent of numeric stock (BR-18).

#### BR-47 A Variant with no linked Ware can be ordered; the whole quantity is shortage

- A Variant that has no linked Ware still accepts Orders (BR-04, BR-18).
- Its whole ordered quantity is shortage.
- By BR-15 such an Order cannot enter `PROCESSING` until a Ware is linked and the quantity is fully allocated.
- Non-stock-tracked goods (services, digital goods) are out of the initial v3 scope.

#### BR-48 Multi-Ware: deterministic order in the initial v3

- When a Variant is linked to several Wares, the initial v3 allocates in a deterministic order only.
- An explicit Ware priority (priority column, Admin-designated Ware) is a later policy.

#### BR-49 Initial v3 scope

- Point payment (paying with Points) is excluded from the initial v3.
- Authorize/capture is excluded: the initial v3 uses single-step approval, where PG success means the payment is approved and captured. A finalize failure is handled by a reversal (BR-27).
- client-pwa keeps only the current core scope: product list/detail, Cart, and Order creation/lookup.
- A separate PG payment UI in client-pwa and full feature parity with client-web are excluded from the initial v3.
- PWA ordering is handed off to the client-web checkout (former DN-48, decided in Phase 8). The existing v2 Point top-up UI is hidden and its data and RPCs are retained (former DN-49, decided in Phase 8).

---

## 4. Domain-by-Domain Audit

Format per area: Approved v3 policy · Current v2 implementation · Conflict · Decision Needed · Affected RPC/Table/UI.

### 4.1 Product / ProductPost / Variant

- **Approved v3 policy**: BR-03, BR-04, BR-18, BR-19, BR-20, BR-46, BR-47.
- **Current v2 implementation**
  - `[CODE]` Admin RPCs `admin_create_product`, `admin_update_product`, `admin_save_product_post`. ProductPost is `DRAFT` / `PUBLISHED` (scheduled publication supported by `get_product_post_detail`). Consumers read through `list_product_posts` and `get_product_post_detail`. ProductVariant is the sellable unit.
  - `[CODE]` Sale state is `is_active` on `products` and `product_variants`. No explicit SOLD_OUT state exists (`product_variants` has no such column).
  - `[CODE]` Availability is derived from numeric stock: `get_product_variant_availability` returns `AVAILABLE` only if the sum of `greatest(current_stock - reserved_stock, 0)` over linked active Wares/Warehouses is greater than 0, otherwise `OUT_OF_STOCK` (`UNAVAILABLE` if inactive). A Variant with no linked Ware is therefore `OUT_OF_STOCK`. The shared type `ProductVariantStockStatus` lists `AVAILABLE`, `OUT_OF_STOCK`, `UNAVAILABLE`.
  - `[E2E]` Create Product/Option/Variant, publish ProductPost, Consumer list/detail, Variant selection, price shown, raw stock not displayed (v2 steps 3–8).
- **Conflict**: CF-06, CF-07.
- **Decision Needed**: DN-34.
- **Affected**: RPC `get_product_variant_availability`, `list_product_posts`, `get_product_post_detail`, `get_product_detail`, `admin_*_product*`; tables `products`, `product_variants` (new `is_sold_out`), `product_posts`, `product_post_products`; shared types `product.ts`, `productPost.ts`, `cart.ts` (`isAvailable`, `stockStatus`); client-web purchase panel (`hooks/useProductPost.ts`); client-pwa `app/page.tsx` detail tab; user-web `app/(admin)/products/*`, `app/api/admin/products*`, `app/api/admin/product-posts*`.

### 4.2 Cart

- **Approved v3 policy**: none specific to Cart. BR-03/BR-04 govern finalization.
- **Current v2 implementation**
  - `[CODE]` Server-side Cart (`carts`, `cart_items`), one Cart per Client. `add_cart_item` merges quantity for the same Variant and checks only that the Product/Variant are active (no stock check). `update_cart_item_quantity` (client-web only), `remove_cart_item`, read-only `get_cart` (returns availability).
  - `[CODE]` The Cart is locked and cleared inside `create_order_from_cart`.
  - `[E2E]` Add and view Cart items confirmed; merge, quantity update, and remove were not individually reported.
- **Conflict**: CF-03 (Cart is consumed at Order creation), CF-06 (availability from numeric stock).
- **Decision Needed**: DN-34.
- **Affected**: RPC `add_cart_item`, `update_cart_item_quantity`, `remove_cart_item`, `get_cart`, `get_or_create_cart`; tables `carts`, `cart_items`; client-web `hooks/user/useCart.ts`, `app/cart/page.tsx`, `components/cart/*`; client-pwa Cart tab.

### 4.3 Checkout (Stage 1)

- **Approved v3 policy**: BR-01, BR-02, BR-03, BR-25, BR-44, BR-45.
- **Current v2 implementation**
  - `[CODE]` No Checkout stage exists. The `/order` page collects the shipping address and calls `create_order_from_cart`, which creates the Order immediately (status `PENDING`). Payment is a later step.
  - `[E2E]` Order creation redirected to `/payment?orderId=...`.
- **Conflict**: CF-03.
- **Decision Needed**: none open (former DN-23, DN-24 decided in Phase 8).
- **Affected**: client-web `app/order/page.tsx`, `components/order/*`, `hooks/order/useOrderSection.tsx`, `hooks/order/useClientOrder.ts`; client-pwa Cart-tab order form; table `client_addresses`.

### 4.4 PG / Payment

- **Approved v3 policy**: BR-01 (PG runs in Stage 1), BR-05 (Order is created after PG completion), BR-24 (Order and Payment statuses are separate), BR-25 (Payment may exist without an Order and is linked at Stage 2), BR-26 and BR-27 (payment reversal on `PENDING` cancellation and on finalize failure), BR-29 to BR-34 (original payment vs `payment_reversals`, `payments.status` unchanged, reversal invariants, amount limit), BR-39 (Refund approval and its linked reversal in one transaction), BR-44 (Client resubmits at finalize; server records only the Payment), BR-45 (finalize contract), BR-49 (no authorize/capture, no Point payment).
- **Current v2 implementation**
  - `[CODE]` Table `payments` (`purpose` `ORDER_PAYMENT` | `POINT_TOPUP`; `status` `PENDING` → `SUCCEEDED` | `FAILED`, terminal). `ORDER_PAYMENT` requires an existing `order_id`; amount is copied from `orders.total_amount`. At most one `SUCCEEDED` payment per Order (`payments_order_succeeded_uidx`). There is no reversal table, no refund amounts, and no PG transaction identifiers. (The `payments.status` set itself is compatible with BR-29.)
  - `[CODE]` `create_payment` and `complete_payment` are service-role only. `complete_payment` moves the Order `PENDING` → `PAID` through `admin_transition_order_status` and stores `payment_reference`; a completed payment is returned unchanged on replay; if the Order is no longer `PENDING` the payment is marked `FAILED` ("Order is no longer payable"), overwriting the fact that the PG succeeded, and no reversal is made.
  - `[CODE]` client-web Route Handlers `POST /api/payments` and `POST /api/payments/[paymentId]/confirm`. The browser triggers `confirm` and chooses the test result; the PG Test service (`lib/payment/pgTest.ts`) only records it and has no cancel/refund API. A PG Test failure changes nothing and the payment stays `PENDING`.
  - `[E2E]` Failure → payment `FAILED`, Order stays `PENDING`; retry on the same Order then succeeded → `SUCCEEDED`, Order `PAID`, `payment_reference` = payment id; PG Test Monitor records matched. The first attempt failed because client-web Production lacked `SUPABASE_SECRET_KEY` (configuration only).
  - `[E2E]` Not verified: payment success leaves Ware stock unchanged.
- **Conflict**: CF-03, CF-04, CF-05, CF-13, CF-14, CF-15.
- **Decision Needed**: none open (former DN-19, DN-20 decided in Phase 8).
- **Implementation notes**: IN-01 to IN-06, IN-08, IN-10, IN-11.
- **Affected**: RPC `create_payment`, `complete_payment`; table `payments` (and the new reversal table); client-web `app/api/payments/route.ts`, `app/api/payments/[paymentId]/confirm/route.ts`, `lib/payment/server.ts`, `lib/payment/pgTest.ts`, `hooks/payment/usePaymentApi.ts`, `app/payment/page.tsx`, `app/success/page.tsx`, `components/payment/*`.

### 4.5 Order / OrderItem

- **Approved v3 policy**: BR-05, BR-07, BR-08, BR-09, BR-10, BR-11, BR-12, BR-22, BR-23, BR-24, BR-35, BR-41, BR-45 (one Order per Payment).
- **Current v2 implementation**
  - `[CODE]` `orders.status` is one of `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`. `order_number` is generated as `ORD-YYYYMMDDHH24MISS-XXXXXXXX`. Totals are derived by the server (discount and shipping are 0). OrderItem snapshots are immutable (trigger). Owner-select RLS.
  - `[CODE]` `create_order_from_cart` (Cart-based, single call) creates the Order and OrderItems and, in the same transaction, deducts stock and writes allocations.
  - `[CODE]` Admin transitions go through `admin_transition_order_status`: `PENDING → PAID → PROCESSING → SHIPPED → DELIVERED`, service-role only, with no allocation check. The Admin UI offers "결제 완료 처리" for `PENDING → PAID`.
  - `[CODE]` The refund flow does not change the Order status (agrees with BR-41).
  - `[E2E]` Creation (stock 10 → 8), payment → `PAID`, history shows only the tester's own Orders.
- **Conflict**: CF-01, CF-02, CF-03, CF-05, CF-09, CF-13.
- **Decision Needed**: DN-34.
- **Affected**: tables `orders`, `order_items`, `order_item_ware_allocations`; RPC `create_order_from_cart`, `admin_transition_order_status`, `get_order_history`; user-web `app/(admin)/orders/page.tsx`, `component/order/*`, `app/api/admin/orders*`; client-web history and Order detail; shared type `order.ts`.

### 4.6 Warehouse / Ware

- **Approved v3 policy**: BR-06, BR-20, BR-43, BR-47, BR-48.
- **Current v2 implementation**
  - `[CODE]` Tables `warehouses`, `wares` (`current_stock >= 0`, `reserved_stock >= 0`, `reserved_stock <= current_stock`), `product_variant_wares` (unique pair). Admin RPCs (service-role only): `create_warehouse`, `update_warehouse`, `create_ware`, `update_ware`, `adjust_ware_stock`, `set_ware_stock`, `transfer_ware_stock`, `link_product_variant_ware`, `unlink_product_variant_ware`, `get_ware_snapshot`. `adjust_ware_stock` and `set_ware_stock` refuse values below `reserved_stock`. Admin dashboard low-stock alert uses `current_stock - reserved_stock` against a fixed threshold of 5 (`app/api/admin/overview/route.ts`).
  - `[CODE]` No stock movement history is recorded; `adjust_ware_stock` only updates `current_stock`.
  - `[E2E]` Warehouse/Ware creation, initial stock, and Variant↔Ware linking (v2 steps 2 and 4).
- **Conflict**: CF-18.
- **Decision Needed**: none open (the Multi-Ware initial order is BR-48).
- **Affected**: tables `warehouses`, `wares`, `product_variant_wares`; user-web `app/(admin)/inventory/page.tsx`, `component/inventory/*`, `app/api/admin/wares*`, `app/api/admin/warehouses`, `app/api/admin/products/[productId]/variant-wares`.

### 4.7 Stock / Allocation

- **Approved v3 policy**: BR-06 to BR-13, BR-15, BR-28, BR-40, BR-42, BR-43, BR-47, BR-48.
- **Current v2 implementation**
  - `[CODE]` `create_order_from_cart` decrements `current_stock` immediately and inserts allocation rows for the quantity it could take, walking eligible Wares in `w.id` order under `FOR UPDATE`; if quantity remains it raises `Insufficient stock` and the whole transaction rolls back.
  - `[CODE]` `order_item_ware_allocations`: `quantity > 0`, unique (`order_item_id`, `ware_id`). No constraint bounds the allocation total by `OrderItem.quantity`. No shortage computation exists anywhere.
  - `[CODE]` `reserve_ware_stock`, `release_ware_reservation`, `consume_reserved_ware_stock` exist (service-role only) but no application calls them. Their semantics match BR-43; their use does not exist yet.
  - `[CODE]` No v2 path reduces allocation rows after creation; restock adds to `current_stock` and does not delete allocation rows (compatible with BR-42), but nothing checks full allocation before `PROCESSING`.
  - `[E2E]` Stock 10 → 8 on Order creation; PENDING cancel restored stock (numbers not reported); refund approval left stock unchanged; restock increased stock 0 → 4.
- **Conflict**: CF-01, CF-02, CF-09, CF-10, CF-18.
- **Decision Needed**: none open (former DN-02 decided in Phase 6).
- **Implementation notes**: IN-09.
- **Affected**: tables `wares`, `order_item_ware_allocations`; RPC `create_order_from_cart`, `cancel_order`, `admin_transition_order_status`, `admin_restock_refund_item`, `restock_order_item`, reserve/release/consume RPCs, `adjust_ware_stock`, `set_ware_stock`, `transfer_ware_stock`; user-web inventory and Order screens.

### 4.8 Cancel

- **Approved v3 policy**: BR-16, BR-17, BR-26, BR-28 (released stock is not auto-allocated), BR-29 to BR-34 (payment reversal model), BR-35 (Cancel only in `PENDING`), BR-36 (whole Order only; no partial Cancel), BR-43 (release decreases `reserved_stock`).
- **Current v2 implementation**
  - `[CODE]` `cancel_order(p_order_id)` is callable only by the owning Client, only while `PENDING`, and always for the whole Order. It locks the Order row, adds the allocation total per Ware back to `current_stock`, and sets `CANCELLED`. Any non-`PENDING` status, including an already `CANCELLED` Order, raises `Only PENDING orders may be cancelled`. It does not touch `payments`.
  - `[CODE]` No Admin cancel RPC, Route Handler, or UI exists. Admin order actions are limited to `PENDING → PAID → PROCESSING → SHIPPED → DELIVERED`.
  - `[CODE]` client-web mirrors the RPC: `canCancelOrder` is true only for `PENDING` (`hooks/history/useOrderAfterSales.ts`).
  - `[E2E]` Client cancel of a `PENDING` Order restored stock (actual numbers were not reported). In v2 that Order was unpaid.
- **Judgment**: the boundary (`PENDING` only) and the whole-Order scope agree with BR-35 and BR-36 (`CONFIRMED`, `[CODE]`). The Admin path, idempotency, payment reversal, and the stock mechanics (BR-43) do not (`CONFLICT`).
- **Conflict**: CF-08, CF-14, CF-18.
- **Decision Needed**: none open (former DN-04 decided in Phase 6: no automatic expiry).
- **Affected**: RPC `cancel_order`; tables `orders`, `payments` and the new reversal table; client-web `hooks/history/useOrderAfterSales.ts`, `components/mypage/history/order/content/OrderStatusCard.tsx`; user-web Order inspector and Route Handlers (`app/api/admin/orders/[orderId]/route.ts`).

### 4.9 Refund

- **Approved v3 policy**: BR-37 (eligibility, partial Refund), BR-38 (cumulative quantity invariant), BR-39 (approval and linked reversal in one transaction), BR-40 (Policy B), BR-41 (Order status unchanged), BR-42; BR-30 and BR-32 (reversal cause `REFUND`, linked to its `refund_request`), BR-34 (amount limit).
- **Current v2 implementation**
  - `[CODE]` `request_refund(p_order_id, p_items, p_reason)` (Client). Rejected for `PENDING` and `CANCELLED` Orders, allowed otherwise. For each OrderItem, cumulative refunded quantity (excluding `REJECTED`/`CANCELLED` requests) may not exceed the ordered quantity. Amount = snapshot `unit_price` × quantity. It does not look at `payments`. It takes no row lock on the Order or OrderItems, and the only database constraint is a unique (`refund_request_id`, `order_item_id`), so concurrent requests can exceed the cumulative limit (CF-17). `refund_requests.status` has no CHECK constraint (VF-07).
  - `[CODE]` client-web mirrors the rules (`canRequestRefund`: not `PENDING`/`CANCELLED`; remaining quantity per OrderItem; `REJECTED`/`CANCELLED` requests ignored in the sum). The shared type `RefundStatus` and the UI labels include `COMPLETED` and `CANCELLED`, but no RPC sets them.
  - `[E2E]` A full-quantity (4 of 4) refund request on a fresh paid Order was created as `REQUESTED`. Partial refund was planned but not exercised.
- **Judgment**: eligibility (after `PAID` is removed), partial quantity, and snapshot pricing agree with BR-37 (`CONFIRMED`, `[CODE]`). The concurrency guarantee (BR-38) and the payment link (BR-39) do not (`CONFLICT`).
- **Conflict**: CF-14, CF-17.
- **Decision Needed**: DN-27 (amount with discount/shipping only). (Former DN-42 decided in Phase 9: no window in the initial v3.)
- **Affected**: RPC `request_refund`; tables `refund_requests`, `refund_items`; client-web `components/mypage/history/order/content/OrderRefundCard.tsx`, `hooks/history/useOrderAfterSales.ts`; shared types `refund.ts`, `adminRefund.ts`.

### 4.10 Refund Approval

- **Approved v3 policy**: BR-39 (approval and the linked `PENDING` reversal succeed or fail together; PG execution failure does not revert the approval; rejection has no reversal, Payment, or stock effect), BR-41, BR-30/BR-32.
- **Current v2 implementation**
  - `[CODE]` `admin_transition_refund_status` (service-role): only `REQUESTED` → `APPROVED` | `REJECTED`; stamps `processed_at`. A repeated request on a non-`REQUESTED` request raises an error. It changes no stock, no money, no Points, no Payment, and no Order status, and creates no reversal.
  - `[E2E]` Approval left Ware stock unchanged (0 → 0).
- **Judgment**: "approval does not change stock or Order status" agrees with BR-40 and BR-41 (`CONFIRMED`); "approval creates the linked reversal in the same transaction" does not (`CONFLICT`).
- **Conflict**: CF-14.
- **Decision Needed**: none open (former DN-46 decided in Phase 9).
- **Affected**: RPC `admin_transition_refund_status`; user-web `app/(admin)/refund/page.tsx`, `app/api/admin/refunds*`.

### 4.11 Restock

- **Approved v3 policy**: BR-40, BR-42, BR-43 (restock increases `current_stock`).
- **Current v2 implementation**
  - `[CODE]` `admin_restock_refund_item` (service-role): the RefundRequest must be `APPROVED`; the Ware must be one of the OrderItem's original allocation Wares; cumulative restock per refund item is at most the refunded quantity; cumulative restock per (OrderItem, Ware) is at most that Ware's allocation quantity; locks serialize concurrent calls; every restock is recorded in `refund_item_restocks`. Shortage/unallocated quantity has no allocation row and therefore cannot be restocked.
  - `[CODE]` The older `restock_order_item` RPC checks only that the quantity is at most the ordered quantity, accepts any target Ware, and keeps no restock record or refund linkage. No application uses it (CF-16).
  - `[E2E]` A restock of 4 raised stock 0 → 4 (equal to the approved quantity). Partial restock and over-restock rejection were not exercised (`[CODE]` only, VF-02).
- **Judgment**: `admin_restock_refund_item` agrees with BR-40 (`CONFIRMED`, `[CODE]`; the "restock at most the refunded quantity per refund item" cap is a v2 rule not yet approved as v3, DN-34). `restock_order_item` does not (`CONFLICT`).
- **Conflict**: CF-16.
- **Decision Needed**: none open for restock itself (DN-34 covers the carried-over cap).
- **Affected**: RPC `admin_restock_refund_item`, `restock_order_item`; tables `refund_item_restocks`, `order_item_ware_allocations`, `wares`; user-web `app/api/admin/refunds/[refundId]/restocks/route.ts`.

### 4.12 Point

- **Approved v3 policy**: BR-49 (Point payment is excluded from the initial v3).
- **Current v2 implementation**
  - `[CODE]` `point_balances`, `point_ledger`. Only `TOPUP` exists (`point_ledger_type_valid`), via a `POINT_TOPUP` payment of 1,000–1,000,000 in units of 1,000; one ledger entry per payment (`point_ledger_payment_unique`). Points cannot be spent.
  - `[E2E]` Failed top-up: no ledger row, no balance change. Successful top-up: one ledger row (`amount` 30000, `balance_after` 30000). UI refresh behavior was not reported.
  - `[LEGACY]` The Point PRD describes Points as a payment method (`USE`), accrual, and restoration on cancel/refund, with the Point deduction happening together with final Order creation in one transaction.
- **Conflict**: none against an approved rule.
- **Decision Needed**: none open (former DN-49 decided in Phase 8).
- **Affected**: tables `point_balances`, `point_ledger`; RPC `complete_payment`; client-web `app/mypage/point/page.tsx`, `components/mypage/point/*`, `hooks/point/usePoint.ts`; shared type `point.ts`.

### 4.13 Wishlist

- **Approved v3 policy**: BR-21.
- **Current v2 implementation**
  - `[CODE]` `wishlist_items` with unique (`client_id`, `product_post_id`) and owner RLS.
  - `[E2E]` Add, list, remove by clicking the same heart; re-add after removal was not reported.
- **Judgment**: `CONFIRMED` (current behavior agrees with BR-21).
- **Conflict**: none.
- **Decision Needed**: DN-34 (carry-over only).
- **Affected**: table `wishlist_items`; client-web `hooks/user/useWishlist.ts`, `app/wishlist/page.tsx`, `components/wishlist/*`; shared type `wishlist.ts`.

### 4.14 Admin / CLIENT authorization

- **Approved v3 policy**: BR-12 (Admin sees shortage), BR-16 and BR-35 (Admin can cancel `PENDING` only), BR-20 (Consumer boundary), BR-24 (no default path to advance an Order without payment evidence). Architecture rules from `AGENTS.md`: privileged operations run only in a trusted server context.
- **Current v2 implementation**
  - `[CODE]` `user_profiles.role` is `CLIENT` or `ADMIN`. Admin Route Handlers use `requireAdminServiceClient`. Privileged RPCs (Order/Refund transitions, Warehouse/Ware stock, link/unlink, `promote_user_to_admin`) were revoked from `anon`/`authenticated` (`20260925070000`). Consumer RPCs check `auth.uid()`. Owner-select RLS exists on orders, order items, refunds, payments, Points, wishlist, cart, addresses.
  - `[CODE]` The Admin Order route can move an Order `PENDING → PAID` without any payment record.
  - `[E2E]` The CLIENT saw only their own Orders; Admin login and server access worked after the user-web `SUPABASE_SECRET_KEY` fix; Consumer Ware/Warehouse non-exposure was observed on the inspected screens (product/post detail, Cart, Order/history detail, Refund, Wishlist, Point).
  - `[CODE]` user-web calls an RPC `complete_onboarding` that has no definition in the migrations or design SQL that were read (VF-05).
- **Conflict**: CF-10 (Admin cannot see allocation/shortage), CF-13 (manual `PENDING → PAID`).
- **Decision Needed**: none open (former DN-46 decided in Phase 9).
- **Affected**: `user_profiles`; user-web `lib/supabase/admin.ts`, all `app/api/admin/*`; RLS policies.

### 4.15 client-web

- **Approved v3 policy**: BR-20, BR-21, BR-22, BR-23.
- **Current v2 implementation**
  - `[CODE]` Whole-Cart order at `/order` → `/payment?orderId=` → confirm; `/success`; Order history and detail with cancel and refund cards; wishlist; Points; addresses. `OrderStatusCard` shows "결제하기" for `PENDING` and has a description for `PAID`. `toOrderErrorMessage` (`hooks/order/useClientOrder.ts`) turns `Insufficient stock` into "…의 재고가 부족합니다…", without a quantity. Cancel and refund eligibility helpers mirror the v2 RPC rules (`hooks/history/useOrderAfterSales.ts`).
  - `[E2E]` Full flow exercised during v2 Phase 8.
- **Conflict**: CF-01 (shortage error message), CF-03, CF-05, CF-13.
- **Decision Needed**: none open (former DN-24 decided in Phase 8).
- **Affected**: see 4.2, 4.3, 4.4, 4.8, 4.9, 4.12, 4.13.

### 4.16 client-pwa

- **Approved v3 policy**: BR-20, BR-22, BR-49 (initial scope: product list/detail, Cart, Order creation/lookup; no separate PG payment UI; no full parity with client-web).
- **Current v2 implementation**
  - `[CODE]` One page (`app/page.tsx`) with tabs. Post list/detail, Cart add/remove, whole-Cart Order creation (browser RPC `create_order_from_cart`, status `PENDING`), Order lookup by typing the Order UUID. No payment, Order list, cancel, refund, wishlist, Points, address management, or quantity edit. The home hero comes from `mainPageMock` in `@mall/mall-page-viewer`. Shortage error text is mapped in `lib/api.ts` (`toMessage`). Ordering is locked after one submit until reload.
  - `[E2E]` Step 24: list, detail, Variant, Cart, Order (quantity 1) worked; the Order ended as `PENDING` with `payment_reference` null; the UI showed the UUID as the order number. An earlier Production env pointing to a non-existent Supabase project (configuration issue) had blocked the product list.
  - `CLAUDE.md`: do not broadly rewrite client-pwa before the business logic and the final PWA scope are approved.
- **Conflict**: CF-12, CF-03, CF-01.
- **Decision Needed**: none open (former DN-23, DN-48 decided in Phase 8).
- **Affected**: client-pwa `app/page.tsx`, `lib/api.ts`, `lib/auth.ts`, `app/auth/callback/route.ts`.

### 4.17 Idempotency / Concurrency

- **Approved v3 policy**: BR-17 (idempotent cancel, including no repeated allocation release or payment reversal); BR-10 (allocation is held, so concurrent allocation must not double-take); BR-28 (Admin allocation may compete with newer Orders for the same stock); BR-32 and BR-34 (reversal idempotency key and amount limit); BR-38 (cumulative Refund quantity holds under concurrency); BR-39 (approval and reversal creation are one transaction); BR-45 (one Order per `payment_id`).
- **Current v2 implementation**
  - `[CODE]` `create_order_from_cart` locks the Cart row and locks Ware rows in `w.id` order; a duplicate submission from the same Client sees an empty Cart and raises `Cart is empty`. `cancel_order` locks the Order and then Wares in `ware_id` order. `complete_payment` locks the payment (and Order); a completed payment is returned unchanged; `payments_order_succeeded_uidx` and `point_ledger_payment_unique` back this up. `create_payment` takes no lock, so several `PENDING` payments per Order are possible. `request_refund` takes no lock and has no cross-request constraint (CF-17). `admin_restock_refund_item` locks the refund item, the allocation row, and the Ware. Wishlist has a unique key.
  - `[E2E]` No concurrency scenario was exercised.
- **Conflict**: CF-08 (non-idempotent cancel), CF-14 (no payment reversal to make idempotent), CF-17 (Refund quantity invariant not guaranteed under concurrency).
- **Decision Needed**: none open (former DN-45 decided in Phase 7).
- **Implementation notes**: IN-03, IN-07, IN-08, IN-10.
- **Verification items**: VF-06.
- **Affected**: RPC `create_order_from_cart`, `cancel_order`, `create_payment`, `complete_payment`, `request_refund`, `admin_restock_refund_item`; client-web `app/api/payments/*`.

---

## 5. Integrated Lifecycle

Order, Stock, Payment, Cancel, and Refund are one connected lifecycle. Only what is backed by approved rules is filled in; everything else is `DECISION NEEDED`. Order and Payment are two separate status tracks (BR-24); payment reversals are a third record kept under the Payment (BR-29 to BR-34); Refund is a fourth record set that does not change the Order status (BR-41).

### 5.1 Target lifecycle (approved parts and open parts)

```text
Stage 1  Client-held checkout state (not a database Order)             [APPROVED BR-01, BR-02, BR-44]
   |   PG interaction; may stay open for a long time
   |   the server records only the Payment of the PG attempt           [APPROVED BR-25, BR-44]
   |       payments.status: PENDING / SUCCEEDED / FAILED               [APPROVED BR-29]
   |   an in-progress Payment is not shown in the Consumer history; a reload resumes from the held data   [decided in Phase 8]
   |   PG failure: the Payment ends there; a retry is a new Payment   [decided in Phase 8]
   v
PG completion reaches the server                                        [APPROVED BR-05, BR-45]
   |   primary: server confirm (server verifies the result with the PG)
   |   auxiliary: webhook (de-duplication, missed successes, orphan input, reversal results)
   |   one Order per payment_id; repeated finalize returns the existing Order   [APPROVED BR-45]
   |   PG success but Stage 2 never invoked (orphan Payment):
   |       handled by a reversal, not by a server-side finalize        [APPROVED BR-44, BR-30]
   |       detection: scan job, default window 30 minutes; a late finalize cannot resurrect it   [decided in Phase 4]
   v
Server revalidation (Client resubmits items/address)                    [APPROVED BR-03, BR-44]
   |   explicit SOLD_OUT (is_sold_out) / sale disabled (is_active) / unpublished / validity   [APPROVED BR-46]
   |   the total recomputed by the server must equal the Payment amount [APPROVED BR-45]
   |   numeric shortage is NOT a reason to stop                        [APPROVED BR-04]
   |--- business validation fails or price mismatch: no Order is created   [APPROVED BR-27, BR-45]
   |       payment reversal (FINALIZE_FAILURE) PENDING -> SUCCEEDED
   |       payments.status stays SUCCEEDED                             [APPROVED BR-29, BR-30]
   |       reversal amount within the payment amount                   [APPROVED BR-34]
   |       Client-facing behavior: a general message only   [decided in Phase 8]
   |--- transient technical failure: rollback, Client retries, orphan rule as the last fallback   [decided in Phase 4]
   v
Stage 2  real Order created as PENDING, Payment linked to it            [APPROVED BR-05, BR-25]
   |   allocate only what can currently be secured                     [APPROVED BR-09]
   |   allocation increases reserved_stock; current_stock unchanged    [APPROVED BR-43]
   |   deterministic Ware order; a Variant with no Ware: all shortage  [APPROVED BR-47, BR-48]
   |   shortage_quantity = quantity - allocated_quantity               [APPROVED BR-08]
   |   zero-amount Orders are not created in the initial v3          [decided in Phase 4]
   v
PENDING  (seller has a real, already-paid Order to process)             [APPROVED BR-05, BR-24]
   |   Consumer sees an ordinary PENDING, also when there is shortage  [APPROVED BR-23]
   |-- Admin adds allocation to a shortage Order (reserved_stock up)   [APPROVED BR-13, BR-14, BR-43]; explicit, never automatic [decided in Phase 6]
   |-- available stock (current - reserved) increases: no auto-allocation to
   |   shortage Orders; a newer Order may take it before Admin acts    [APPROVED BR-28]
   |-- Cancel (whole Order only) by Client or Admin                    [APPROVED BR-16, BR-17, BR-35, BR-36]
   |       Order -> CANCELLED
   |       allocation released once (reserved_stock down); shortage part has nothing to release   [APPROVED BR-43]
   |       payment reversal (ORDER_CANCEL) PENDING -> SUCCEEDED (eventual)   [APPROVED BR-26, BR-30]
   |       payments.status stays SUCCEEDED                             [APPROVED BR-29]
   |       PG failure/delay never repeats the cancel or the release    [APPROVED BR-26]
   |       who cancelled and why: recorded internally in order_cancellations, first cancel wins   [decided in Phase 5]
   |       the Consumer sees no reason / actor / reversal detail   [decided in Phase 8]
   |-- PENDING expiry: none in the initial v3 ................... [decided in Phase 6]
   v
PROCESSING entry                                                        [APPROVED BR-24, BR-15, BR-42, BR-43]
   full allocation required before entering
   the reservation is consumed: current_stock and reserved_stock decrease
   no allocation decrease/release after entering
   no Cancel from here on                                            [APPROVED BR-35]
   PENDING -> PROCESSING -> SHIPPED -> DELIVERED
   transition details: Admin only, one step forward, UNCHANGED on repeat   [decided in Phase 6]
   seller must stop an Order after PROCESSING ................. [decided in Phase 9: Admin-created Refund request]
   v
Refund track (Orders in PROCESSING / SHIPPED / DELIVERED; not PENDING / CANCELLED)   [APPROVED BR-37]
   Client requests a Refund (whole or partial quantity per OrderItem, snapshot unit price)
       cumulative valid quantity <= OrderItem.quantity, also concurrently   [APPROVED BR-38]
   REQUESTED --Admin--> APPROVED                                     [APPROVED BR-39]
       same transaction: linked payment reversal (REFUND) PENDING
       if the reversal row cannot be created, APPROVED is not committed
       PG reversal SUCCEEDED, or FAILED / retry: the Refund stays APPROVED, never back to REQUESTED
       reversal amount within the payment amount                     [APPROVED BR-34]
       the Admin approves only part of the quantity? ............ not supported [decided in Phase 7]
   REQUESTED --Admin--> REJECTED: no reversal, no Payment effect, no stock effect   [APPROVED BR-39]
   Client withdraws the request ............................... not supported [decided in Phase 7]
   repeated approve/reject requests ........................... ALREADY_* on the same decision, refused on the opposite [decided in Phase 7]
   Refund status set: REQUESTED / APPROVED / REJECTED ......... [decided in Phase 7]
   Refund window after DELIVERED .............................. [decided in Phase 9: no window initially]
   Refund amount with discount / shipping ..................... [DN-27]
   APPROVED --(goods returned / inspected)--> Admin restock, explicit   [APPROVED BR-40, BR-43]
       approval alone never restores stock
       restock increases current_stock, also for a Refund in PROCESSING
       original allocation Ware only, never above the allocated quantity
       shortage/unallocated quantity is never restockable
   the Order fulfillment status is not changed by a Refund           [APPROVED BR-41]
   exceptional payment reconciliation channel ................. [service_role only, actor in requested_by; UX open]

Payment reversals (any cause)                                           [APPROVED BR-29 to BR-34]
   PENDING -> SUCCEEDED | FAILED ; a FAILED reversal frees its amount
   SUM(PENDING + SUCCEEDED) <= payments.amount, always               [APPROVED BR-34]
```

### 5.2 Transition table

| # | Transition | Actor | Guard / condition | Order effect | Payment effect | Stock / allocation effect | Status |
|---|---|---|---|---|---|---|---|
| T-01 | (none) → Stage 1 checkout | Client | none | none (no `orders` row) | none | none | `APPROVED` (BR-01, BR-44) |
| T-02 | PG attempt and result recorded | server | none | none | a server-side Payment record exists without an Order (`payments.status` `PENDING` / `SUCCEEDED` / `FAILED`); the server determines the amount | none | `APPROVED` (BR-25, BR-29, BR-44) |
| T-03 | PG failure | PG / server | none | none | failure is recorded on the Payment (`FAILED`) | none | recording `APPROVED` (BR-25, BR-29); retry rules `DECISION NEEDED` (DN-20) |
| T-04 | PG success → server confirm → revalidation passes → Order `PENDING` | server | BR-03 passes; recomputed total equals the Payment amount; numeric shortage does not block; one Order per `payment_id` | Order created as `PENDING` (or the existing Order is returned on repeat) | Payment linked to the Order | allocate what can be secured: `reserved_stock` increases, remainder is shortage (BR-09, BR-10, BR-43) | `APPROVED` (BR-03, BR-05, BR-25, BR-43, BR-44, BR-45) |
| T-05 | PG success but business validation fails or the price does not match | server | explicit SOLD_OUT / sale disabled / unpublished / price mismatch / other business validation failure | no Order | `payments.status` stays `SUCCEEDED`; a reversal (`FINALIZE_FAILURE`) goes `PENDING` → `SUCCEEDED` | none | `APPROVED` (BR-27, BR-29 to BR-34, BR-45); Client-facing behavior `DECISION NEEDED` (DN-19) |
| T-06 | PG success but transient technical failure | server | the finalize transaction rolls back | none | none (the Payment stays `SUCCEEDED`) | none | decided in Phase 4 (former DN-39): the Client retries; the orphan rule is the last fallback |
| T-07 | PG success but Stage 2 never invoked (orphan Payment) | server / system | a `SUCCEEDED`, Order-less Payment older than the window (default 30 minutes) | none | handled by a reversal (`ORPHAN_PAYMENT`) without an Order (BR-44, BR-30, BR-32) | none | direction `APPROVED` (BR-27, BR-44); detection decided in Phase 4 (former DN-38, window is a default to confirm) |
| T-08 | `PENDING` shortage Order gains allocation | Admin | available stock (`current_stock - reserved_stock`) exists; Admin chooses the Order | none | none | `reserved_stock` increases; shortage decreases | `APPROVED` (BR-13, BR-14, BR-28, BR-43); explicit Admin action on an Order or OrderItem, takes what is available (decided in Phase 6, former DN-02) |
| T-09 | `PENDING` → `CANCELLED` | Client | status is `PENDING`; whole Order; a repeated request is not an error | `CANCELLED` | `payments.status` stays `SUCCEEDED`; a reversal (`ORDER_CANCEL`) `PENDING` → `SUCCEEDED` | allocation released once: `reserved_stock` decreases (only the allocated part; shortage has nothing to release); released stock is not auto-allocated (BR-28) | `APPROVED` (BR-16, BR-17, BR-26, BR-28, BR-29 to BR-36, BR-43) |
| T-10 | `PENDING` → `CANCELLED` (reject) | Admin | status is `PENDING`; whole Order; a repeated or concurrent request is not an error | `CANCELLED` | same as T-09 | same as T-09 | `APPROVED` (BR-16, BR-17, BR-26, BR-28, BR-29 to BR-36, BR-43); actor and reason are recorded internally (former DN-12, decided in Phase 5); what the Consumer sees is DN-19 |
| T-11 | `CANCELLED` → `CANCELLED` (repeat) | Client / Admin | any | unchanged | no second reversal (idempotency key, BR-32) | no second release | `APPROVED` (BR-17, BR-26, BR-32, BR-35) |
| T-12 | PG reversal fails or is delayed after cancel | server | not defined | stays `CANCELLED`; the cancel and the release are not repeated | `payments.status` stays `SUCCEEDED`; the reversal stays `PENDING` or becomes `FAILED`; a `FAILED` reversal frees its amount (BR-34) | none | direction `APPROVED` (BR-26, BR-29, BR-31, BR-34); retry history is an implementation note (IN-01); reprocessing procedure `DECISION NEEDED` (DN-40) |
| T-13 | `PENDING` → `PROCESSING` | Admin | every OrderItem fully allocated (BR-15) | `PROCESSING` | none | the reservation is consumed: `current_stock` and `reserved_stock` decrease by the allocated quantity; from here on no allocation decrease/release (BR-42, BR-43) | `APPROVED` (BR-24, BR-15, BR-42, BR-43); remaining details `DECISION NEEDED` (DN-14) |
| T-14 | `PROCESSING` → `SHIPPED` | Admin | every OrderItem fully allocated (already guaranteed by T-13) | `SHIPPED` | none | none | `APPROVED` (BR-24, BR-15); remaining details `DECISION NEEDED` (DN-14) |
| T-15 | `SHIPPED` → `DELIVERED` | Admin | not defined beyond BR-24 | `DELIVERED` | none | none | lifecycle `APPROVED` (BR-24); no condition beyond the previous status (decided in Phase 6, former DN-14) |
| T-16 | Cancel in `PROCESSING` / `SHIPPED` / `DELIVERED` | Client / Admin | not allowed | unchanged | none | none | `APPROVED` (BR-35); a seller-side stop after `PROCESSING` is an Admin-created Refund request (former DN-46, decided in Phase 9) |
| T-17 | partial Cancel (some OrderItems or some quantity) | Client / Admin | not supported in the initial v3 | unchanged | none | none | `APPROVED` (BR-36) |
| T-18 | Refund request | Client | Order is `PROCESSING` / `SHIPPED` / `DELIVERED`; not `PENDING` / `CANCELLED`; cumulative valid quantity per OrderItem within `OrderItem.quantity` | none (BR-41) | none | none | `APPROVED` (BR-37, BR-38, BR-41); no window in the initial v3 (former DN-42, decided in Phase 9); status set `DECISION NEEDED` (DN-47) |
| T-19 | Restock | Admin | Refund `APPROVED`; original allocation Ware; not above the allocated quantity; never shortage/unallocated | none | none | `current_stock` increases through this explicit action only, also for a Refund in `PROCESSING` | `APPROVED` (BR-40, BR-42, BR-43) |
| T-20 | manual `PENDING` → `PAID` | Admin | v2 only | removed from v3 | none | none | `APPROVED` removal (BR-24); v2 behavior `CONFLICT` (CF-13); exceptional reconciliation channel `DECISION NEEDED` (DN-40) |
| T-21 | new reversal request against a Payment | server | `SUM(PENDING + SUCCEEDED)` plus the new amount must not exceed `payments.amount` | none | a request beyond the limit is rejected; a `FAILED` reversal frees its amount | none | `APPROVED` (BR-34); enforcement is an implementation note (IN-03) |
| T-22 | Refund `REQUESTED` → `APPROVED` | Admin | one transaction with creating the linked `REFUND` reversal (`PENDING`); if the reversal row cannot be created, no commit | unchanged (BR-41) | linked reversal `PENDING`; later `SUCCEEDED` or `FAILED`/retry; `payments.status` stays `SUCCEEDED`; the Refund is never moved back to `REQUESTED` | none (approval alone does not restore stock, BR-40) | `APPROVED` (BR-39, BR-40, BR-41, BR-32, BR-34); partial approval `DECISION NEEDED` (DN-43); repeated request `DECISION NEEDED` (DN-45); amount with discount/shipping `DECISION NEEDED` (DN-27); v2 behavior `CONFLICT` (CF-14) |
| T-23 | Refund `REQUESTED` → `REJECTED` | Admin | none | unchanged | none; no reversal | none | `APPROVED` (BR-39); repeated request `DECISION NEEDED` (DN-45) |
| T-24 | Client withdraws a Refund request | Client | not supported in the initial v3 | unchanged | none | none | decided in Phase 7 (former DN-44, DN-47) |
| T-25 | seller stops an Order after `PROCESSING` | Admin | the Admin creates a Refund request on behalf of the Client; then the ordinary approval, reversal, and explicit restock (Cancel stays refused) | none until restock (Policy B) | Refund state only | Refund request marked Admin-initiated | `APPROVED` (former DN-46, decided in Phase 9) |
| T-26 | Admin adds physical stock or adjusts it | Admin | `current_stock` never below `reserved_stock` | none | none | `current_stock` changes; available stock changes; no auto-allocation (BR-28) | `APPROVED` (BR-43, BR-28) |

### 5.3 Status labels in the current v2 implementation (evidence only)

`[CODE]` `orders.status`: `PENDING` (created before payment), `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`. Refund request statuses set by the RPCs: `REQUESTED`, `APPROVED`, `REJECTED`; the shared type `RefundStatus` and client-web labels also list `COMPLETED` and `CANCELLED`, which nothing sets (DN-47). Payment statuses: `PENDING`, `SUCCEEDED`, `FAILED`. In v3 `PAID` leaves the Order lifecycle (BR-24) and the Payment status set stays `PENDING` / `SUCCEEDED` / `FAILED` (BR-29); reversals are kept in `payment_reversals` (BR-30, BR-31).

---

## 6. Scenario Catalog

Expected Results contain only what is approved. Anything else points to a `DN-xx`.

#### S-01 Normal purchase, stock sufficient

- **Preconditions**: ProductPost published; Variant sellable; linked Ware available stock (`current_stock - reserved_stock`) is at least the requested quantity; Client logged in.
- **Flow**: Stage 1 checkout → PG completes → server confirm → server revalidates (Client resubmitted items/address) → Stage 2 creates the Order and links the Payment.
- **Expected Result**: Order `PENDING`; Payment linked to the Order; `allocated_quantity` equals `OrderItem.quantity`; shortage 0 (BR-03, BR-05, BR-09, BR-25, BR-44, BR-45).
- **Stock/Allocation Effect**: allocation rows sum to the ordered quantity; `reserved_stock` increases by that quantity; `current_stock` is unchanged until `PROCESSING` (BR-43).
- **Consumer Visibility**: the Order as `PENDING` (BR-23); no stock, allocation, or shortage numbers (BR-20); the order number shown is `order_number` (BR-22).
- **Admin Visibility**: the Order with full allocation, shortage 0 (BR-12); the linked Payment.
- **Current v2 behavior**: the Order is created first (`PENDING`, unpaid) with full allocation and immediate `current_stock` deduction, then paid → `PAID`. `[E2E]` stock 10 → 8 on creation; payment → `PAID` with `payment_reference` = payment id.
- **v3 Status**: `APPROVED`; `CONFLICT` CF-03, CF-13, CF-18.

#### S-02 Ordered quantity greater than stock

- **Preconditions**: Variant sellable; physical stock 10, nothing reserved.
- **Flow**: Order A ×6 finalizes, then Order B ×6 finalizes.
- **Expected Result**: both Orders are created as `PENDING` (BR-04, BR-11). A: allocated 6, shortage 0. B: allocated 4, shortage 2.
- **Stock/Allocation Effect**: `current_stock` stays 10 and never negative (BR-06); `reserved_stock` is 6 after A and 10 after B, so nothing is available (BR-43); A's allocation is held and B cannot take it (BR-10).
- **Consumer Visibility**: B is shown as an ordinary `PENDING` Order; no numbers (BR-20, BR-23).
- **Admin Visibility**: B shows shortage 2 per Order and per OrderItem (BR-12).
- **Current v2 behavior**: `[CODE]` `create_order_from_cart` raises `Insufficient stock…` for B; no Order is created; the Cart stays; the UI shows a shortage message. Not exercised in `[E2E]`.
- **v3 Status**: `APPROVED`; `CONFLICT` CF-01, CF-18.

#### S-03 `current_stock` is 0 or the Variant has no Ware, but the item is still on sale

- **Preconditions**: Variant not sold out (`is_sold_out` false) and not sale-disabled (`is_active` true); available stock 0, or no linked Ware at all.
- **Flow**: the Client finalizes an Order.
- **Expected Result**: Order `PENDING` is created; allocated 0; shortage equals the ordered quantity (BR-04, BR-18, BR-46, BR-47).
- **Stock/Allocation Effect**: no allocation rows; no stock change. A Variant with no linked Ware cannot enter `PROCESSING` until a Ware is linked and fully allocated (BR-15, BR-47).
- **Consumer Visibility**: item shown as purchasable; the Order is an ordinary `PENDING` (BR-23); no shortage information (BR-20).
- **Admin Visibility**: shortage equals the ordered quantity.
- **Current v2 behavior**: `[CODE]` availability is `OUT_OF_STOCK` when the available stock sum is 0 (also when no Ware is linked), the purchase UI disables the item, and `create_order_from_cart` would fail.
- **v3 Status**: `APPROVED`; `CONFLICT` CF-06, CF-01.

#### S-04 Explicit SOLD_OUT

- **Preconditions**: Admin has set the Variant's `is_sold_out` (BR-46).
- **Flow**: a Client tries to check out / finalize.
- **Expected Result**: blocked before Stage 2; no Order is created (BR-03, BR-04, BR-19, BR-46).
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: the sold-out sellability state is visible (BR-19).
- **Admin Visibility**: the SOLD_OUT setting.
- **Current v2 behavior**: no explicit SOLD_OUT exists; only `is_active` for sale-disabled, and availability derived from stock `[CODE]`.
- **v3 Status**: `APPROVED`; `CONFLICT` CF-06.

#### S-05 Stage 1 kept open for a long time

- **Preconditions**: Client is in checkout, PG interaction pending.
- **Flow**: time passes; the Client later completes or abandons.
- **Expected Result**: no `orders` row exists meanwhile and Admin sees no Order (BR-01); the server stores only the Payment (BR-44); revalidation applies at Stage 2 (BR-03).
- **Stock/Allocation Effect**: none while in Stage 1 (nothing is held).
- **Consumer Visibility**: an in-progress Payment is not shown in the history; a reload resumes from the checkout data the Client holds (former DN-24, decided in Phase 8).
- **Admin Visibility**: none.
- **Current v2 behavior**: no Stage 1. `[CODE]` an unpaid `PENDING` Order holds deducted stock indefinitely; no expiry exists (DN-04).
- **v3 Status**: `APPROVED` (BR-01, BR-44); visibility decided in Phase 8 (former DN-24).

#### S-06 Price changes before Stage 2

- **Preconditions**: the Payment amount was determined by the server at P1; Admin changes the Variant price to P2 before finalization.
- **Flow**: PG completes; the server recomputes the total at finalize.
- **Expected Result**: the recomputed total does not equal the Payment amount, so the finalize is rejected and the full payment is reversed (cause `FINALIZE_FAILURE`); no Order is created (BR-03, BR-27, BR-45). A Client-sent price is never trusted (BR-44).
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: only a general message; no reversal detail (former DN-19, decided in Phase 8).
- **Admin Visibility**: the Payment with its reversal record (BR-30).
- **Current v2 behavior**: `[CODE]` the price is read from the database at Order creation and the payment amount equals the Order total, so P1 vs P2 cannot arise after payment.
- **v3 Status**: `APPROVED` (BR-27, BR-45); `CONFLICT` CF-14.

#### S-07 Item becomes SOLD_OUT before Stage 2

- **Preconditions**: PG has succeeded; the item is explicitly set SOLD_OUT before finalization.
- **Flow**: Stage 2 revalidation runs.
- **Expected Result**: explicit SOLD_OUT blocks Order creation (BR-03, BR-04, BR-46); no Order exists; a payment reversal (cause `FINALIZE_FAILURE`) is created `PENDING` and becomes `SUCCEEDED` after the PG reversal, and `payments.status` stays `SUCCEEDED` (BR-27, BR-29, BR-30).
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: only a general message; no reversal detail (former DN-19, decided in Phase 8).
- **Admin Visibility**: the Payment with its reversal record (BR-30).
- **Current v2 behavior**: not applicable. `[CODE]` `complete_payment` marks a payment `FAILED` ("Order is no longer payable") if the Order is no longer `PENDING`, with no reversal.
- **v3 Status**: `APPROVED` (BR-27); `CONFLICT` CF-14, CF-15; Client-facing behavior decided in Phase 8 (former DN-19).

#### S-08 PG failure

- **Preconditions**: Stage 1 in progress.
- **Flow**: the PG reports failure.
- **Expected Result**: no Order is created (BR-05); the failed attempt is recorded server-side as a Payment record without an Order, `payments.status` `FAILED` (BR-25, BR-29). The Payment ends there and a retry is a new Payment (former DN-20, decided in Phase 8).
- **Stock/Allocation Effect**: none (no Order exists at Stage 1).
- **Consumer Visibility**: a general failure message; the retry starts a new Payment (former DN-20, Phase 8).
- **Admin Visibility**: PG failures are not Orders (BR-01).
- **Current v2 behavior**: `[E2E]` payment `FAILED` with a failure reason, Order stays `PENDING`, PG Test Monitor shows `isSuccess=false`; retry on the same Order works; UI text says the Order stays awaiting payment.
- **v3 Status**: recording `APPROVED` (BR-25, BR-29); retry decided in Phase 8 (former DN-20); `CONFLICT` CF-03, CF-04.

#### S-09 PG success but finalize fails (business validation)

- **Preconditions**: PG has succeeded; Stage 2 cannot create the Order because of a business validation failure (SOLD_OUT, sale disabled, price mismatch, other).
- **Flow**: finalization is attempted and rejected.
- **Expected Result**: a payment reversal (cause `FINALIZE_FAILURE`) is created and goes `PENDING` → `SUCCEEDED`; `payments.status` stays `SUCCEEDED`. The state "PG success + no Order + no follow-up" never persists (BR-27). Numeric shortage is not a valid failure reason (BR-04).
- **Stock/Allocation Effect**: none (no Order was created).
- **Consumer Visibility**: only a general message; no reversal detail (former DN-19, decided in Phase 8).
- **Admin Visibility**: the Payment with its reversal record (BR-30).
- **Current v2 behavior**: not applicable; the Order exists before payment `[CODE]`.
- **v3 Status**: `APPROVED` (BR-27, BR-29 to BR-34, BR-45); `CONFLICT` CF-14, CF-15; Client-facing behavior decided in Phase 8 (former DN-19).

#### S-10 Duplicate finalize request

- **Preconditions**: the same Stage 1 checkout is submitted for finalization twice (double click, retry after timeout).
- **Flow**: two finalize requests for the same `payment_id` reach the server.
- **Expected Result**: exactly one Order exists for that `payment_id`; the repeated or concurrent request returns the existing Order (BR-45).
- **Stock/Allocation Effect**: allocation and `reserved_stock` change once (BR-10, BR-43).
- **Consumer Visibility**: the one Order.
- **Admin Visibility**: the one Order.
- **Current v2 behavior**: `[CODE]` `create_order_from_cart` locks the Cart; the second call sees an empty Cart and raises `Cart is empty`.
- **v3 Status**: `APPROVED` (BR-45); structure is an implementation note (IN-10).

#### S-11 Duplicate PG confirm or webhook

- **Preconditions**: the server confirm and a webhook (or two confirms) both report the same completion.
- **Flow**: two completion notifications reach the server.
- **Expected Result**: both lead to the same finalize for the `payment_id`; one Order (BR-45). The webhook is auxiliary and only de-duplicates and records (BR-45).
- **Stock/Allocation Effect**: no double allocation.
- **Consumer Visibility**: the one Order.
- **Admin Visibility**: the one Order.
- **Current v2 behavior**: `[CODE]` `complete_payment` is idempotent: a completed payment is returned unchanged; unique indexes back it up. The PG Test service is only a recorder and is called by the browser-triggered `confirm` route; behavior of a concurrent double `confirm` at the PG Test service is unverified (VF-06). No webhook exists.
- **v3 Status**: `APPROVED` (BR-45); keeping a raw callback log is an implementation option (IN-02, IN-10).

#### S-12 Client cancels a `PENDING` Order

- **Preconditions**: a real Order in `PENDING` (already paid).
- **Flow**: the Client cancels.
- **Expected Result**: the whole Order becomes `CANCELLED`; its allocation is released once; a payment reversal (cause `ORDER_CANCEL`) is created `PENDING` and becomes `SUCCEEDED` after the PG cancellation, while `payments.status` stays `SUCCEEDED` (BR-16, BR-26, BR-29, BR-30, BR-35, BR-36). A repeated cancel is not an error and creates no second reversal (BR-17, BR-32).
- **Stock/Allocation Effect**: `reserved_stock` decreases by the allocated quantity; `current_stock` is unchanged; the freed stock becomes available, is not auto-allocated to any shortage Order, and a newer Order may take it (BR-28, BR-43).
- **Consumer Visibility**: status `CANCELLED`; no refund/reversal progress, reason, or actor is shown (former DN-19, decided in Phase 8); no stock numbers (BR-20).
- **Admin Visibility**: the cancelled Order and its reversal; the actor and reason are recorded in `order_cancellations`, one row per Order, the first cancel kept (former DN-12).
- **Current v2 behavior**: `[CODE]` `cancel_order` (owner, `PENDING` only) restores the allocation total to `current_stock` and does not touch `payments`. `[E2E]` a `PENDING` Order was cancelled and stock was restored (numbers not reported). In v2 a `PENDING` Order is unpaid.
- **v3 Status**: `APPROVED` (BR-16, BR-17, BR-26, BR-28, BR-29 to BR-36, BR-43); `CONFLICT` CF-08, CF-14, CF-18.

#### S-13 Admin cancels / rejects a `PENDING` Order

- **Preconditions**: a real Order in `PENDING` (typically with shortage).
- **Flow**: Admin cancels/rejects it.
- **Expected Result**: the whole Order becomes `CANCELLED`; allocation released once; a payment reversal (`ORDER_CANCEL`) goes `PENDING` → `SUCCEEDED`; `payments.status` stays `SUCCEEDED` (BR-16, BR-26, BR-29, BR-30, BR-35); a repeated request is not an error (BR-17). Reason/state model open (DN-12).
- **Stock/Allocation Effect**: same as S-12 (BR-28, BR-43).
- **Consumer Visibility**: status `CANCELLED`; no reason or actor is shown (former DN-19, decided in Phase 8).
- **Admin Visibility**: the action and its actor, recorded in `order_cancellations` (former DN-12).
- **Current v2 behavior**: `[CODE]` no Admin cancel RPC, Route Handler, or UI.
- **v3 Status**: `APPROVED` (BR-16, BR-26, BR-35); `CONFLICT` CF-08, CF-14; the recording of actor and reason is decided (former DN-12).

#### S-14 Client and Admin cancel at the same time

- **Preconditions**: a `PENDING` Order.
- **Flow**: both cancel within the same moment.
- **Expected Result**: the Order ends `CANCELLED`; neither caller sees an avoidable transition error (BR-17); allocation is released once and exactly one reversal is started (BR-26, BR-32). Which actor is recorded is open (DN-12).
- **Stock/Allocation Effect**: a single release (BR-17).
- **Consumer Visibility**: `CANCELLED`.
- **Admin Visibility**: `CANCELLED`; the first cancel's actor stays recorded (former DN-12).
- **Current v2 behavior**: `[CODE]` `cancel_order` locks the Order; a second call after the first commit raises `Only PENDING orders may be cancelled`. Not exercised in `[E2E]`.
- **v3 Status**: `APPROVED`; `CONFLICT` CF-08.

#### S-15 Repeated cancel request

- **Preconditions**: the Order is already `CANCELLED`.
- **Flow**: the same cancel request arrives again.
- **Expected Result**: the final state stays `CANCELLED`; no user-facing error (BR-17, BR-35); no second release and no second reversal (BR-26, BR-32).
- **Stock/Allocation Effect**: no second release.
- **Consumer Visibility**: `CANCELLED`, no error.
- **Admin Visibility**: `CANCELLED`, no error.
- **Current v2 behavior**: `[CODE]` raises `Only PENDING orders may be cancelled`.
- **v3 Status**: `APPROVED`; `CONFLICT` CF-08.

#### S-16 Additional allocation to a shortage Order

- **Preconditions**: Order B `PENDING` with shortage 2; available stock (`current_stock - reserved_stock`) exists.
- **Flow**: Admin reviews shortage Orders and allocates additional stock to B.
- **Expected Result**: B's `allocated_quantity` increases and shortage decreases (BR-13, BR-14). Order actions requiring full allocation become possible only when shortage is 0 (BR-15). Because a newer Order may already have taken the stock (BR-28), Admin's allocation can find less stock than expected.
- **Stock/Allocation Effect**: allocation rows for B increase; `reserved_stock` increases by the same amount; the stock taken is held for B (BR-10, BR-43).
- **Consumer Visibility**: an ordinary `PENDING` Order; no numbers (BR-20, BR-23).
- **Admin Visibility**: per-Order/OrderItem shortage before and after (BR-12).
- **Current v2 behavior**: no shortage and no Admin allocation feature exist `[CODE]`; `adjust_ware_stock` changes Ware stock only.
- **v3 Status**: `APPROVED`; the workflow is decided in Phase 6 (former DN-02).

#### S-17 New stock arrives

- **Preconditions**: one or more shortage Orders exist.
- **Flow**: Admin adds physical stock to a Ware.
- **Expected Result**: no automatic allocation to any Order (BR-13, BR-28); Admin decides later (S-16). A newer Order finalized before Admin acts may allocate the new stock (BR-28).
- **Stock/Allocation Effect**: `current_stock` increases, so available stock increases; `reserved_stock` and existing allocations are unchanged (BR-43).
- **Consumer Visibility**: none.
- **Admin Visibility**: shortage Orders remain listed with their shortage (BR-12).
- **Current v2 behavior**: `[CODE]` `adjust_ware_stock` (service-role) increases `current_stock`; there are no shortage Orders to serve.
- **v3 Status**: `APPROVED` (BR-13, BR-28, BR-43).

#### S-18 Full refund

- **Preconditions**: an Order in `PROCESSING`, `SHIPPED`, or `DELIVERED` with no earlier Refund; every OrderItem is fully allocated (BR-42).
- **Flow**: the Client requests a Refund for all quantity; Admin approves; the PG reversal runs; later, after the goods are returned/inspected, Admin restocks.
- **Expected Result**: `REQUESTED → APPROVED` and the linked `REFUND` reversal (`PENDING`) are created in one transaction; the reversal becomes `SUCCEEDED` after the PG reversal; `payments.status` stays `SUCCEEDED` (BR-37, BR-39, BR-29 to BR-34). The Order status is unchanged (BR-41).
- **Stock/Allocation Effect**: approval alone changes no stock (BR-40); `current_stock` increases only through the explicit restock, into the original allocation Ware, up to the allocated quantity. The reservation was already consumed at `PROCESSING` (BR-43), so a `PROCESSING` Refund uses the same restock.
- **Consumer Visibility**: refund status; no internal restock information (BR-20).
- **Admin Visibility**: the refund request, its reversal, and restock records.
- **Current v2 behavior**: `[E2E]` full-quantity refund (4 of 4): `REQUESTED` → `APPROVED`; stock unchanged (0); after an Admin restock of 4, stock 0 → 4. `[CODE]` the Order status stays as it was and no money, Points, Payment, or reversal changes.
- **v3 Status**: `APPROVED` (BR-37, BR-39 to BR-43); stock/Order-status behavior `CONFIRMED`; `CONFLICT` CF-14; open: amount with discount/shipping (DN-27); no window in the initial v3 (former DN-42, decided in Phase 9).

#### S-19 Partial refund and cumulative limit

- **Preconditions**: an Order in `PROCESSING`, `SHIPPED`, or `DELIVERED` with an OrderItem of quantity 6.
- **Flow**: the Client requests 2, later requests 3, then tries to request 3 more.
- **Expected Result**: the first two requests are valid (cumulative 5 of 6); the third is refused because the valid cumulative quantity would exceed 6 (BR-37, BR-38). Each approved request gets its own linked `REFUND` reversal, and the reversal total stays within the payment amount (BR-34, BR-39). The Order status is unchanged (BR-41).
- **Stock/Allocation Effect**: approval changes no stock; restock is explicit (BR-40).
- **Consumer Visibility**: refund status.
- **Admin Visibility**: the requests with quantity and amount (snapshot unit price × quantity).
- **Current v2 behavior**: `[CODE]` supported for a single flow: cumulative refunded quantity per OrderItem may not exceed the ordered quantity; `REJECTED`/`CANCELLED` requests are ignored in the sum. Not guaranteed under concurrent requests (CF-17). Not exercised in `[E2E]` (a full refund was used instead).
- **v3 Status**: `APPROVED` (BR-37, BR-38); `CONFLICT` CF-17; partial approval is not supported (former DN-43, decided in Phase 7).

#### S-20 Refund approved, restock not yet done

- **Preconditions**: an `APPROVED` refund.
- **Flow**: time passes before Admin restocks.
- **Expected Result**: stock is unchanged until the explicit restock (BR-40); the linked reversal proceeds independently of restock (BR-39).
- **Stock/Allocation Effect**: none by approval. The reservation was consumed when `PROCESSING` began, so no hold remains to release; `current_stock` increases only at the restock (BR-43).
- **Consumer Visibility**: refund status.
- **Admin Visibility**: approved but not restocked.
- **Current v2 behavior**: `[E2E]` approval left stock unchanged (0 → 0); `[CODE]` approval touches no stock.
- **v3 Status**: `APPROVED` (BR-40, BR-43); `CONFIRMED`.

#### S-21 Partial restock

- **Preconditions**: an `APPROVED` refund for quantity N.
- **Flow**: Admin restocks part of N.
- **Expected Result**: allowed within the original allocation Ware and never above the allocated quantity (BR-40). The cap "cumulative restock per refund item is at most the refunded quantity" is a v2 rule that still needs approval (DN-34).
- **Stock/Allocation Effect**: `current_stock` of the chosen original allocation Ware increases by the restocked quantity (BR-43).
- **Consumer Visibility**: none (BR-20).
- **Admin Visibility**: restock records.
- **Current v2 behavior**: `[CODE]` cumulative restock per refund item may not exceed the refunded quantity, nor the (OrderItem, Ware) allocation quantity; each restock is recorded. Not exercised in `[E2E]`.
- **v3 Status**: `APPROVED` (BR-40); `CONFIRMED` (`[CODE]`); carry-over `DECISION NEEDED` (DN-34).

#### S-22 Over-restock attempt

- **Preconditions**: an `APPROVED` refund already restocked up to its limit.
- **Flow**: Admin tries to restock more.
- **Expected Result**: refused when it would exceed the actually allocated quantity (BR-40); shortage/unallocated quantity is never restockable (BR-40, BR-42).
- **Stock/Allocation Effect**: none when rejected.
- **Consumer Visibility**: none.
- **Admin Visibility**: rejection message.
- **Current v2 behavior**: `[CODE]` rejected by the refunded-quantity and allocation-quantity limits. Not exercised in production (VF-02).
- **v3 Status**: `APPROVED` (BR-40); `CONFIRMED` (`[CODE]` only).

#### S-23 Multi-Ware

- **Preconditions**: a Variant linked to several Wares.
- **Flow**: Orders are finalized; Admin later adds allocation, cancels, or restocks.
- **Expected Result**: allocations are recorded per Ware (BR-07) in the deterministic order of the initial v3 (BR-48). Restock goes only to the original allocation Wares (BR-40).
- **Stock/Allocation Effect**: allocation rows and `reserved_stock` per Ware; release and consume act on the same Wares (BR-43).
- **Consumer Visibility**: none (BR-20).
- **Admin Visibility**: per-Ware allocation and shortage.
- **Current v2 behavior**: `[CODE]` Wares are consumed in `w.id` order; cancel restores each Ware's allocation; restock is limited to original allocation Wares. Not exercised in `[E2E]` (only one Ware existed).
- **v3 Status**: `APPROVED` (BR-48, BR-43); an explicit Ware priority is a later policy.

#### S-24 Point

- **Preconditions**: a Client with a Point balance.
- **Flow**: the Client tries to pay an Order with Points.
- **Expected Result**: not supported in the initial v3 (BR-49). The existing top-up UI is hidden and its data and RPCs are retained (former DN-49, decided in Phase 8).
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: The Point UI is hidden; the Point data and RPCs are retained (former DN-49, decided in Phase 8).
- **Admin Visibility**: not defined.
- **Current v2 behavior**: `[E2E]` failed top-up leaves no ledger row; successful top-up creates one `TOPUP` ledger row and increases the balance once. `[CODE]` no spending. `[LEGACY]` Points as a payment method, accrual, restoration.
- **v3 Status**: `APPROVED` (scope exclusion, BR-49); decided in Phase 8 (former DN-49).

#### S-25 PWA order

- **Preconditions**: a Client in client-pwa with items in the Cart.
- **Flow**: create an Order from the Cart.
- **Expected Result**: the PWA keeps its core scope (product list/detail, Cart, Order creation/lookup) and has no separate PG payment UI (BR-49). Ordering there is handed off to the client-web checkout, because a real Order exists only after PG success (BR-05) and the PWA has no PG UI (former DN-48, decided in Phase 8). The order number shown to the Consumer is `orders.order_number`, never the UUID (BR-22).
- **Stock/Allocation Effect**: same as any Order once created.
- **Consumer Visibility**: order number and status; no internal information (BR-20).
- **Admin Visibility**: the Order like any other.
- **Current v2 behavior**: `[E2E]` quantity 1 Order created as `PENDING`, `payment_reference` null, no payment step in the PWA, the UI displayed the UUID as the order number. The PWA-created Order can only be paid in client-web `[CODE]`.
- **v3 Status**: `APPROVED` (BR-22, BR-49); the hand-off is decided in Phase 8 (former DN-48); `CONFLICT` CF-12, CF-03.

#### S-26 Orphan Payment (PG success, Stage 2 never invoked)

- **Preconditions**: the PG payment succeeded; the Client closed the tab or lost the network before Stage 2 was invoked.
- **Flow**: no finalize request reaches the server; the server holds no checkout data (BR-44).
- **Expected Result**: the state "PG success + no Order + no follow-up" must not persist (BR-27). The payment is handled by a reversal (cause `ORPHAN_PAYMENT`) without an Order, not by a server-side finalize (BR-44, BR-30, BR-32). It is detected by a scan job after a window (default 30 minutes, decided in Phase 4 as former DN-38).
- **Stock/Allocation Effect**: none (no Order exists).
- **Consumer Visibility**: only a general message; no reversal detail (former DN-19, decided in Phase 8).
- **Admin Visibility**: not defined.
- **Current v2 behavior**: not applicable; the Order exists before payment `[CODE]`. Not exercised in `[E2E]`.
- **v3 Status**: direction `APPROVED` (BR-27, BR-44, BR-30, BR-32); detection decided in Phase 4 (former DN-38); job design is an implementation note (IN-11).

#### S-27 Payment reversal fails or is delayed after a cancellation

- **Preconditions**: a `PENDING` Order was cancelled; the PG cancellation fails or is slow.
- **Flow**: the Order is `CANCELLED`; the `ORDER_CANCEL` reversal is `PENDING` (or becomes `FAILED`); the PG call does not succeed yet.
- **Expected Result**: the Order stays `CANCELLED`; the Order cancellation and the allocation release are not repeated; a repeated cancel request stays idempotent (BR-17, BR-26). `payments.status` stays `SUCCEEDED` (BR-29, BR-32). A `FAILED` reversal frees its amount for a new reversal request (BR-34). How retries are recorded is an implementation note (IN-01); the Admin reprocessing procedure is open (DN-40).
- **Stock/Allocation Effect**: none beyond the single release already done.
- **Consumer Visibility**: only the Refund status; no reversal progress (former DN-19, decided in Phase 8).
- **Admin Visibility**: the reversal and its failure; retry only at the trusted server boundary, actor recorded (former DN-40); the Admin screen is open.
- **Current v2 behavior**: not applicable; no payment reversal exists `[CODE]`; the PG Test service has no cancel API.
- **v3 Status**: direction `APPROVED` (BR-26, BR-29, BR-31, BR-34); `CONFLICT` CF-14; the reprocessing boundary is decided (former DN-40).

#### S-28 Admin allocation competes with a newer Order

- **Preconditions**: a shortage Order exists; stock has just become available (new stock or a released allocation).
- **Flow**: a newer Order is finalized at Stage 2 before Admin allocates to the shortage Order.
- **Expected Result**: the newer Order may allocate that stock; no FIFO, first-come, or reserved priority applies (BR-28). The shortage Order keeps its shortage until Admin allocates.
- **Stock/Allocation Effect**: the newer Order's allocation raises `reserved_stock` (BR-10, BR-43); Admin's later allocation may find less stock than expected.
- **Consumer Visibility**: both are ordinary `PENDING` Orders (BR-23).
- **Admin Visibility**: shortage per Order (BR-12).
- **Current v2 behavior**: not applicable; shortage Orders do not exist `[CODE]`.
- **v3 Status**: `APPROVED` (BR-28); the Admin workflow is decided in Phase 6 (former DN-02).

#### S-29 Reversal amount limit

- **Preconditions**: a Payment of 100,000 with a `SUCCEEDED` reversal of 30,000 and a `PENDING` reversal of 50,000.
- **Flow**: a new reversal of 30,000 is requested; then the 50,000 reversal fails; then a new reversal of 30,000 is requested again.
- **Expected Result**: the first new request is not allowed, because 30,000 + 50,000 + 30,000 exceeds 100,000; at most 20,000 could be requested. After the 50,000 reversal becomes `FAILED`, it no longer occupies amount, so the second request (30,000 + 30,000) is allowed (BR-34).
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: only a general message; no reversal detail (former DN-19, decided in Phase 8).
- **Admin Visibility**: the reversals of the Payment and their statuses (BR-30).
- **Current v2 behavior**: not applicable; no reversal exists `[CODE]`.
- **v3 Status**: `APPROVED` (BR-34); enforcement is an implementation note (IN-03); `CONFLICT` CF-14.

#### S-30 Cancelling a shortage Order (quantity 6, allocated 4, shortage 2)

- **Preconditions**: an OrderItem with quantity 6, allocated 4, shortage 2, in a `PENDING` Order that has already passed payment.
- **Flow**: the Client or Admin cancels the whole Order.
- **Expected Result**: the whole Order becomes `CANCELLED`; the allocation of 4 is released (once); the shortage of 2 has nothing to release; the full payment amount is the subject of one `ORDER_CANCEL` reversal within the payment amount (BR-26, BR-32, BR-34, BR-35, BR-36).
- **Stock/Allocation Effect**: `reserved_stock` decreases by 4 and `current_stock` is unchanged; the 4 freed units are not auto-allocated to another shortage Order (BR-28, BR-43).
- **Consumer Visibility**: an ordinary cancelled Order; no shortage numbers (BR-20, BR-23).
- **Admin Visibility**: the cancelled Order with its earlier shortage and its reversal (BR-12).
- **Current v2 behavior**: `[CODE]` `cancel_order` restores the sum of the allocation rows (4) to `current_stock` and never had a shortage state; it does not touch `payments`.
- **v3 Status**: `APPROVED`; `CONFLICT` CF-08, CF-14, CF-18.

#### S-31 Cancel attempted after `PROCESSING` has started

- **Preconditions**: an Order in `PROCESSING`, `SHIPPED`, or `DELIVERED`.
- **Flow**: the Client or the Admin tries to cancel it.
- **Expected Result**: not allowed (BR-35). The money return path is Refund (BR-37). Because `PROCESSING` may win a race against a concurrent Client cancel, the Client's cancel then ends as "cancellation is no longer possible", which is a legitimate refusal and not the idempotent same-final-state case of BR-17.
- **Stock/Allocation Effect**: none; no allocation decrease/release (BR-42).
- **Consumer Visibility**: the Client is directed to the Refund path; wording is a display matter.
- **Admin Visibility**: the Order is unchanged.
- **Current v2 behavior**: `[CODE]` `cancel_order` raises `Only PENDING orders may be cancelled`; client-web shows the cancel action only for `PENDING`.
- **v3 Status**: `APPROVED` (BR-35); `CONFIRMED` for the boundary (`[CODE]`); a seller-side stop after `PROCESSING` is an Admin-created Refund request (former DN-46, decided in Phase 9).

#### S-32 Partial cancel requested

- **Preconditions**: a `PENDING` Order with several OrderItems, or an OrderItem with quantity greater than 1.
- **Flow**: someone asks to cancel only one OrderItem or only part of a quantity.
- **Expected Result**: not supported in the initial v3; a `PENDING` cancellation is always for the whole Order (BR-36). To keep some items the Client would have to cancel the whole Order and order again (a Stage 2 Order is a fresh checkout).
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: no partial-cancel action is offered.
- **Admin Visibility**: an Order with a short OrderItem can only be cancelled/rejected as a whole, or given additional allocation (BR-14).
- **Current v2 behavior**: `[CODE]` `cancel_order` cancels the whole Order only.
- **v3 Status**: `APPROVED` (BR-36); `CONFIRMED` (`[CODE]`).

#### S-33 Refund requested for a `PENDING` or `CANCELLED` Order

- **Preconditions**: an Order in `PENDING` or `CANCELLED`.
- **Flow**: the Client tries to request a Refund.
- **Expected Result**: not allowed (BR-37). For `PENDING`, Cancel is used instead (BR-35); a `CANCELLED` Order has already been reversed (BR-26).
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: no Refund action for these statuses.
- **Admin Visibility**: none.
- **Current v2 behavior**: `[CODE]` `request_refund` rejects `PENDING` and `CANCELLED`; client-web mirrors it.
- **v3 Status**: `APPROVED` (BR-37); `CONFIRMED` (`[CODE]`).

#### S-34 Refund approval, PG failure after commit

- **Preconditions**: a `REQUESTED` Refund on an eligible Order.
- **Flow**: Admin approves; the transaction commits with the linked reversal `PENDING`; the PG reversal then fails.
- **Expected Result**: the Refund stays `APPROVED` and is never moved back to `REQUESTED`; the reversal becomes `FAILED` or a retry target and is reprocessed in the reversal domain; `payments.status` stays `SUCCEEDED` (BR-39, BR-29, BR-32). If the reversal row could not be created inside the transaction, the Refund would not have been approved at all (BR-39). A `FAILED` reversal frees its amount (BR-34).
- **Stock/Allocation Effect**: none (BR-40).
- **Consumer Visibility**: no reversal progress is shown (former DN-19, decided in Phase 8).
- **Admin Visibility**: the approved Refund with a failed reversal; reprocessing is a trusted-server operation with the actor recorded (former DN-40); the Admin screen is open.
- **Current v2 behavior**: `[CODE]` approval creates no reversal.
- **v3 Status**: `APPROVED` (BR-39); `CONFLICT` CF-14; retry recording is an implementation note (IN-01, IN-08).

#### S-35 Refund rejection

- **Preconditions**: a `REQUESTED` Refund.
- **Flow**: Admin rejects it.
- **Expected Result**: the Refund becomes `REJECTED`; no reversal is created; no Payment effect; no stock or restock effect (BR-39). A rejected request no longer counts toward the cumulative quantity (BR-38, per the status policy DN-47), so the Client can request that quantity again.
- **Stock/Allocation Effect**: none.
- **Consumer Visibility**: refund status `REJECTED`.
- **Admin Visibility**: the rejected request.
- **Current v2 behavior**: `[CODE]` `admin_transition_refund_status` sets `REJECTED`; the sum in `request_refund` ignores `REJECTED` requests; a repeated request raises an error.
- **v3 Status**: `APPROVED` (BR-39); `CONFIRMED` (`[CODE]`); the repeated-request policy is decided in Phase 7 (former DN-45).

#### S-36 Seller must stop an Order after `PROCESSING`

- **Preconditions**: an Order in `PROCESSING` that the seller cannot fulfil (for example damaged or missing goods).
- **Flow**: Admin needs to stop the Order and return the money.
- **Expected Result**: Cancel is not allowed after `PROCESSING` (BR-35). The Admin creates a Refund request on behalf of the Client; approval, the linked `payment_reversal`, and the explicit restock then follow the ordinary Refund flow. The request keeps the fact that the Admin started it (former DN-46, decided in Phase 9).
- **Stock/Allocation Effect**: the reservation is already consumed (BR-43); stock returns only by the explicit Admin restock of the refunded quantity (Policy B).
- **Consumer Visibility**: the ordinary Refund state only; no Admin-side detail (BR-20).
- **Admin Visibility**: the Refund request, marked as Admin-initiated, with its approval, reversal, and restock.
- **Current v2 behavior**: not applicable; Admin can only advance an Order `[CODE]`.
- **v3 Status**: `APPROVED` (former DN-46, decided in Phase 9).

#### S-37 Stock through the lifecycle (reservation, consume, restock)

- **Preconditions**: a Ware with physical `current_stock` 10 and `reserved_stock` 0; Order A ×6 and Order B ×6 are finalized (A first).
- **Flow**: A is allocated, B is allocated; Admin moves A to `PROCESSING`; A is refunded, the goods come back, and Admin restocks 6.
- **Expected Result** (BR-43):
  - after A: `reserved_stock` 6, `current_stock` 10, available 4;
  - after B (allocated 4, shortage 2): `reserved_stock` 10, `current_stock` 10, available 0;
  - A enters `PROCESSING`: the reservation is consumed, `current_stock` 4, `reserved_stock` 4 (B's hold), available 0;
  - A's refund approval changes nothing; after the explicit restock of 6: `current_stock` 10, `reserved_stock` 4, available 6, and B's shortage 2 is still not auto-allocated (BR-28, BR-40).
- **Stock/Allocation Effect**: as listed; `0 <= reserved_stock <= current_stock` holds throughout (BR-43).
- **Consumer Visibility**: none of these numbers (BR-20).
- **Admin Visibility**: available stock, reservations, and B's shortage (BR-12).
- **Current v2 behavior**: `[CODE]` `current_stock` is a net remainder and `reserved_stock` is unused, so B would be refused and the numbers differ (CF-01, CF-18).
- **v3 Status**: `APPROVED` (BR-43, BR-28, BR-40); `CONFLICT` CF-18.

---

## 7. DECISION NEEDED Registry

### 7.1 Open decisions

"Origin" is `CLAUDE.md` for items carried over from its "Unresolved v3 Decisions", or `analysis 2026-09-26` for items found while preparing this document.

| ID | Decision needed | Domains | Origin |
|---|---|---|---|
| DN-27 | Refund amount derivation for the linked reversal when discounts or shipping fees exist, narrowed: the current rule (decided in Phase 7) is the immutable OrderItem snapshot unit price times the refunded quantity; it is to be reviewed when discount or shipping is introduced (today both are 0, so the item total equals the payment amount). The reversal creation itself, its linkage, and the absence of stock and Order-status effects are approved (BR-39 to BR-41). | Refund, Payment | analysis 2026-09-26 |
| DN-34 | Confirmation that v2 rules untouched by v3 decisions carry over (OrderItem snapshot immutability, Cart identity Product + Variant, owner RLS, Wishlist ProductPost basis, History via Order, the cap "cumulative restock per refund item is at most the refunded quantity"). | all | analysis 2026-09-26 |

### 7.2 Resolved decisions

Resolved by approved rules and removed from the open registry.

| Former ID | Decision | Resolved by | Remaining question |
|---|---|---|---|
| ~~DN-42~~ | Refund window after `DELIVERED`. | User decision recorded with Phase 9: the initial v3 release sets no Refund window after `DELIVERED` (as in v2). It is re-reviewed later, as a separate policy, from operating experience | A window, if any, is a later policy (no code enforces one) |
| ~~DN-46~~ | Seller-initiated Refund / seller-failure workflow: the Admin path when an Order must be stopped after `PROCESSING`. | User decision recorded with Phase 9: the Admin creates the Refund request on behalf of the Client (from `PROCESSING` on); approval, the linked `payment_reversal`, and the explicit restock reuse the existing Refund flow unchanged. The fact that the Admin started the request is kept for audit (`refund_requests.initiated_by = 'ADMIN'`). Cancel stays refused after `PROCESSING` (BR-35); no separate seller-failure workflow | none |
| ~~DN-20~~ | PG failure / abandonment: retry semantics and what the Client sees. | User decision recorded with the Phase 8 implementation: a PG failure ends that Payment (`FAILED`, terminal); a retry creates a new Payment from the checkout data the Client holds; there is no automatic retry | none |
| ~~DN-24~~ | Whether an in-progress Payment is shown to the Client. | User decision recorded with the Phase 8 implementation: it is not shown in the Consumer history or as an indicator; after a reload the Client resumes from the checkout data it holds | A Payment whose held data was lost is handled by the orphan rule (DN-38) |
| ~~DN-19~~ | Client-facing behavior after a finalize failure or a cancellation. | User decision recorded with the Phase 8 implementation: the Consumer sees only a general cancellation / finalize-failure message; the reversal state, amount, the cancelling actor, and the cancel reason are never shown (BR-20) | The exact wording is a display matter |
| ~~DN-23~~ | Cart ↔ Checkout: clearing, selected-item orders, buy-now. | User decision recorded with the Phase 8 implementation: `finalize` does not touch the Cart; when the Order exists the Client removes only the purchased Cart lines; ordering selected items and buy-now are not supported in the initial v3 | none |
| ~~DN-48~~ | How PWA Order creation works when a real Order exists only after PG success. | User decision recorded with the Phase 8 implementation: ordering in the PWA is handed off to the client-web checkout; the PWA keeps product list/detail, Cart, and Order lookup by order number (BR-22, BR-49) | none |
| ~~DN-49~~ | Fate of the existing Point top-up feature. | User decision recorded with the Phase 8 implementation: the Point top-up UI is hidden; the existing Point data and RPCs are kept initially (BR-49) | When the Point data and RPCs are removed is decided after release |
| ~~DN-47~~ | Refund request status set and the meaning of `COMPLETED` / `CANCELLED`. | User decision recorded with the Phase 7 implementation: the status set is `REQUESTED` / `APPROVED` / `REJECTED`; `COMPLETED` and `CANCELLED` are not used in the initial v3; a valid request for BR-38 is `REQUESTED` or `APPROVED` (BR-38, BR-39) | Removing the unused values from the shared type is part of the Phase 8 contraction |
| ~~DN-43~~ | Whether Admin may approve only part of the requested Refund quantity. | User decision recorded with the Phase 7 implementation: partial approval is not supported; a request is approved or rejected as a whole | none |
| ~~DN-44~~ | Whether the Client may withdraw a Refund request. | User decision recorded with the Phase 7 implementation: withdrawal is not supported in the initial v3, so there is no effect on the cumulative quantity of BR-38 | none |
| ~~DN-45~~ | Idempotency of repeated Refund approval/rejection requests. | User decision recorded with the Phase 7 implementation: the same decision again returns `ALREADY_APPROVED` / `ALREADY_REJECTED` (no error) and creates no second reversal (the reversal key is unique per request, BR-32); the opposite decision on a decided request is refused | none |
| ~~DN-14~~ | Remaining Order status transition details: who performs each transition, its conditions, and the fulfillment gate. | User decision recorded with the Phase 6 implementation: only the trusted server (Admin) performs the transitions; one step forward at a time (`PENDING` to `PROCESSING` to `SHIPPED` to `DELIVERED`); a request for the status the Order already has returns `UNCHANGED`; skipping a step, going back, `PAID`, and `CANCELLED` are refused (Cancel is its own path, BR-35); `PROCESSING` needs full allocation (BR-15) and payment evidence (BR-24), and consumes the reservation once (BR-43); `SHIPPED` and `DELIVERED` need no condition beyond the previous status | none |
| ~~DN-02~~ | Admin additional-allocation workflow. | User decision recorded with the Phase 6 implementation: the Phase 2 allocation functions are reused; the Admin runs the allocation explicitly for an Order or one OrderItem; it takes what is currently available (possibly nothing, not an error), never takes stock held by another Order, and is never automatic (BR-13, BR-28) | The Admin screen is a Phase 8 surface item |
| ~~DN-04~~ | `PENDING` expiration policy. | User decision recorded with the Phase 6 implementation: the initial v3 has no automatic `PENDING` expiry; a `PENDING` Order is an already-paid Order the seller processes or cancels | none |
| ~~DN-12~~ | Seller rejection reason/state model: reason, actor recording, and which actor is kept when Client and Admin cancel concurrently. | User decision recorded with the Phase 5 implementation: who cancelled (`CLIENT` or `ADMIN`, and the user id) and an optional reason (at most 500 characters) are recorded in the internal table `order_cancellations`, one row per Order; the first cancel is kept and a later or concurrent cancel never overwrites it (BR-16, BR-17). The table has no Consumer access | What the Consumer sees of the reason or actor is decided in Phase 8 with DN-19; a structured rejection-reason code list is not part of the initial v3 |
| ~~DN-38~~ | Orphan Payment detection, time window, and the race with a late finalize. | User decision recorded with the Phase 4 implementation: a `SUCCEEDED`, Order-less `ORDER_PAYMENT` older than a window (default 30 minutes) with no closing reversal becomes an `ORPHAN_PAYMENT` reversal target; the reversal is created under the Payment row lock (`SKIP LOCKED`), so it cannot race a finalize, and a late finalize then returns `ALREADY_CLOSED` (BR-27, BR-44) | The 30 minutes is a default parameter, to be confirmed; the schedule that runs the job is a deployment matter (Phase 9); what the Client or Admin sees is DN-19 |
| ~~DN-39~~ | Transient (technical) finalize failure: retry policy and where attempt state is kept. | User decision recorded with the Phase 4 implementation: the whole finalize transaction rolls back and the Payment stays `SUCCEEDED` with no Order and no reversal; the Client retries (it holds the items, BR-44); if it never does, the orphan rule (DN-38) is the final fallback; no attempt state is stored | none |
| ~~DN-41~~ | Zero-amount Orders and "an Order implies a passed payment". | User decision recorded with the Phase 4 implementation: the initial v3 creates no zero-amount Orders; a checkout total must be greater than zero (a Payment amount is always greater than zero) (BR-05, BR-24, BR-49) | Free items would need a later decision |
| ~~DN-40~~ | Manual reconciliation: who may reprocess a `FAILED` reversal or create an administrative adjustment, and the minimal procedure. | User decision recorded with the Phase 3 implementation: retry (`FAILED` to `PENDING` on the same reversal) and `MANUAL_RECONCILIATION` creation are performed only at the trusted server (`service_role`) boundary, there is no Consumer path, and the acting Admin is recorded in `requested_by` (BR-24, BR-30) | The Admin screen and approval UX are decided in the phase that wires them (Phases 5 to 7). Registering a PG payment the Mall has no record of is a Payment record, not a reversal, and belongs with the orphan-payment decision (DN-38) |
| ~~DN-25~~ | Whether a Consumer-visible `LOW_STOCK`-like status is allowed given that numeric shortage is internal. | User decision recorded with the Phase 2 implementation (`get_product_variant_sellability`): the Consumer sellability status is `AVAILABLE` / `SOLD_OUT` / `UNAVAILABLE`; there is no `LOW_STOCK`; the numeric stock level is never exposed to the Consumer (BR-18, BR-19, BR-20, BR-46) | Renaming the existing Consumer status type and mapping (`OUT_OF_STOCK` to `SOLD_OUT`) is a Phase 8 Consumer-contract item |
| ~~DN-01~~ | Stock decrement timing, meaning of `current_stock`, release mapping, effect of a pre-shipment Refund. | BR-43 (physical `current_stock` + `reserved_stock`, consume at `PROCESSING` entry, restock increases `current_stock`), BR-40 | Synchronization and data conversion are implementation notes (IN-09) |
| ~~DN-03~~ | Whether `reserved_stock` is used. | BR-43 (`reserved_stock` holds the allocations of `PENDING` Orders) | none |
| ~~DN-05~~ | Detailed Cancel vs Refund boundary. | BR-35 (Cancel only in `PENDING`; money return after `PROCESSING` is Refund), BR-37 | none |
| ~~DN-06~~ | Cancellation policy for `PROCESSING` and later. | BR-35 (not allowed) | none (the Admin-created Refund request, former DN-46, decided in Phase 9) |
| ~~DN-07~~ | Partial cancellation policy. | BR-36 (not supported in the initial v3) | none |
| ~~DN-08~~ | Mixed cancel/refund policy. | BR-36 (status ranges do not overlap) | none |
| ~~DN-09~~ | Multi-Ware allocation priority. | BR-48 (deterministic order in the initial v3; explicit priority is a later policy) | none |
| ~~DN-10~~ | Point spending and Point refund/restore policy. | BR-49 (Point payment excluded from the initial v3) | Fate of the existing top-up (DN-49) |
| ~~DN-11~~ | Final client-pwa feature scope. | BR-49 (product list/detail, Cart, Order creation/lookup; no separate PG UI; no full parity) | PWA Order creation vs BR-05 (DN-48) |
| ~~DN-13~~ | Database representation of SOLD_OUT / sale disabled. | BR-46 (`is_active` kept; Variant `is_sold_out` boolean) | none |
| ~~DN-15~~ | How Refund and Restock treat OrderItems with unallocated quantity. | BR-40, BR-42 | none |
| ~~DN-16~~ | Stage 1 → Stage 2 data handoff. | BR-44 (Client holds checkout data; the server records only the Payment; the Client resubmits items/address at finalize) | Orphan detection (DN-38) |
| ~~DN-17~~ | Stage 2 trigger. | BR-45 (server confirm primary, webhook auxiliary) | Production PG endpoints and signature verification are implementation (IN-10) |
| ~~DN-18~~ | Finalize idempotency key. | BR-45 (one Order per `payment_id`) | The structure that guarantees it is implementation (IN-10) |
| ~~DN-21~~ | Role of the `PAID` status in v3. | BR-24 (`PAID` removed from the Order lifecycle) | none |
| ~~DN-22~~ | Whether Admin may mark an Order paid manually. | BR-24 (manual `PENDING → PAID` is a removal target; no default path without payment evidence) | Exceptional reconciliation channel (DN-40) |
| ~~DN-26~~ | Orderability of a Variant with no linked Ware. | BR-47 (orderable; the whole quantity is shortage) | none |
| ~~DN-28~~ | Refund eligibility statuses. | BR-37 (`PROCESSING`, `SHIPPED`, `DELIVERED`; not `PENDING`, `CANCELLED`) | none (no window initially, former DN-42, decided in Phase 9) |
| ~~DN-29~~ | Payment reversal when a `PENDING` Order is cancelled or rejected. | BR-26 (Order `CANCELLED`, allocation release, payment reversal, eventual consistency, idempotent) | none |
| ~~DN-30~~ | Admin cancel scope beyond `PENDING`. | BR-35 (Cancel exists only in `PENDING`) | Actor/reason recording and concurrent-cancel display (DN-12) |
| ~~DN-31~~ | Effect of cancellation on allocation and where freed stock goes. | BR-28 (released stock is not auto-allocated; treated like new stock), BR-43 | none |
| ~~DN-32~~ | Consumer-visible status for a `PENDING` Order that has shortage. | BR-23 (shown as an ordinary `PENDING` Order) | none |
| ~~DN-33~~ | Price-change policy at Stage 2. | BR-45 (a mismatch rejects the finalize and reverses the full payment) | Client-facing behavior (DN-19) |
| ~~DN-35~~ | Exact Payment refund/reversal status model. | BR-29 (`payments.status` stays `PENDING` / `SUCCEEDED` / `FAILED`), BR-31 (reversal statuses `PENDING` / `SUCCEEDED` / `FAILED`) | Detailed reversal states are implementation design (IN-04) |
| ~~DN-36~~ | Payment representation: single status vs a separate refund/payment-event ledger. | BR-29, BR-30, BR-33 (original payment plus a `payment_reversals` child table; no generic event ledger as the core model), BR-34 (amount invariant) | Retry history and raw callback log are implementation notes (IN-01, IN-02) |
| ~~DN-37~~ | Whether production PG uses authorize/capture, and the meaning of "PG completion". | BR-49 (authorize/capture excluded; PG success means approved and captured) | none |

DN-27 was reduced, not resolved: the parts settled by BR-39 to BR-41 moved into those rules, and only the amount derivation with discount/shipping remains open.

Also resolved when the rules were first approved: representation of unallocated/shortage quantity (BR-08), initial handling of new stock (BR-13), Stage 2 allocation of currently securable stock only (BR-09). The former "queue-jumping" candidate (whether a newer Order may take freed stock before Admin allocates) was never registered and is approved as part of BR-28. The former candidate about whether the reversal amount limit also counts `PENDING` reversals is approved as BR-34.

### 7.3 Implementation notes (not business decisions)

Items that the user has assigned to implementation/audit design. They are recorded here so they are not lost; they do not block business rules.

| ID | Note | Related rules |
|---|---|---|
| IN-01 | Retry history of a reversal: accumulate on the same row or keep a separate attempt table. **Decided in Phase 3**: a retry reuses the existing `payment_reversals` row (`FAILED` to `PENDING`) and increments `attempt_count`; the initial v3 has no separate attempt history table. | BR-26, BR-31, BR-39 |
| IN-02 | Whether to keep PG callback/webhook raw records in an append-only audit / de-duplication log. | BR-33, BR-45 |
| IN-03 | Database enforcement of the reversal invariants: row lock, RPC transaction, constraint/check, idempotency key uniqueness. **Decided in Phase 3**: the Phase 1 database trigger stays the final guard (amount limit, `SUCCEEDED` Payment only); the reversal creation RPC takes the Payment row lock first, so concurrent requests are serialized and a repeated idempotency key returns the existing reversal. | BR-32, BR-34 |
| IN-04 | Detailed reversal states beyond `PENDING` / `SUCCEEDED` / `FAILED`. | BR-31 |
| IN-05 | Exact table and enum names (`payment_reversals` and the reason-type values are provisional). | BR-30 |
| IN-06 | How the derived payment-level refund display is computed (query/view vs a maintained column) and what the Consumer may see. | BR-29 |
| IN-07 | Database enforcement of the cumulative Refund quantity invariant under concurrency: row lock on the Order/OrderItems, RPC transaction, or constraint. | BR-38 |
| IN-08 | Transaction structure of Refund approval together with the linked reversal creation, so that both commit or neither does. | BR-39 |
| IN-09 | Keeping `reserved_stock` synchronized with the allocation rows of `PENDING` Orders in the same transactions (allocate, additional allocation, cancel, `PROCESSING` entry), a verification query, and conversion of existing v2 stock values (net remainder) to physical values plus reservations. **Decided in Phase 2**: allocation rows and `reserved_stock` change together inside the same database transaction (allocate, additional allocation, release, consume); there is no separate asynchronous synchronization. Consistency is verified by the invariants (`0 <= reserved_stock <= current_stock`, `reserved_stock` = allocations of `PENDING` Orders) and by the cutover verification (`supabase/cutover/v3_stock_consistency_check.sql`); the conversion of v2 stock values is `supabase/cutover/v3_stock_and_sellability.sql`, applied only at cutover. | BR-43 |
| IN-10 | The structure that guarantees one Order per `payment_id` (unique link or lock-and-check), webhook signature verification and de-duplication, production PG confirm/cancel endpoints, and keeping the PG Test adapter as a development-only adapter. **Decided in Phase 4**: one Order per Payment is guaranteed by the Payment row lock plus the unique `orders.payment_id`; `payments.order_id` is set in the same transaction so the two directions never disagree (its fate is decided in Phase 8); the auxiliary webhook route is not built because no PG webhook contract exists, and duplicate notifications are already safe through this database-level idempotency; production PG endpoints and signature verification remain open for the production integration. | BR-45 |
| IN-11 | The job that detects orphan Payments and starts the reversal (trigger mechanism, schedule, locking against a late finalize). **Decided in Phase 4**: a database function (`reverse_orphan_payments`) scans for orphan Payments and creates the `ORPHAN_PAYMENT` reversals under the Payment row lock (`SKIP LOCKED`), so a finalize in flight is never raced; the scheduling mechanism is decided in Phase 9. | BR-44 |
| IN-12 | **Known limitation of the Stage 1 / Stage 2 handoff structure (BR-44)**: because the server stores only the Payment, it verifies a resubmitted checkout only by its recomputed total. A Client can therefore resubmit a different combination of items with the same total as the paid amount and receive an Order for it. This is accepted for the initial v3 and is not a Phase 4 blocker; closing it would need the server to keep a digest of the checked-out items, which is a change to BR-44 and needs its own decision. | BR-44, BR-45 |

### 7.4 Non-policy verification items (not counted as decisions)

| ID | Item | Evidence |
|---|---|---|
| ~~VF-01~~ | `request_refund` takes no row lock, so concurrent requests may exceed the ordered quantity. Promoted to a conflict with the approved invariant BR-38 (CF-17). | `[CODE]` |
| VF-02 | Over-restock rejection has never been exercised in production. | `[CODE]` only |
| VF-03 | Payment success leaves Ware stock unchanged: stock was not recorded before that payment, so this is unverified. | v2 step 13 |
| VF-04 | Order `ORD-20260925165934-EBA4C2DF` could not be opened on `/payment`; cause not determined (suspected different account or expired session). | v2 Phase 8 |
| VF-05 | user-web calls RPC `complete_onboarding`; no definition was found in the migrations or design SQL read. | `[CODE]` |
| VF-06 | Behavior of a concurrent double `confirm` at the PG Test service (duplicate records) is unknown. | not verified |
| VF-07 | `refund_requests.status` has no database CHECK; `CANCELLED` is referenced by `request_refund` and `COMPLETED` by the shared type, but nothing sets either. | `[CODE]` |
| VF-08 | No typecheck, lint, test, or build was run for this document. | this session |

---

## 8. v2 Conflict Matrix

### 8.1 CONFLICT registry

| ID | Conflict | Violates | Evidence | Affected |
|---|---|---|---|---|
| CF-01 | Numeric stock shortage rejects Order creation (`Insufficient stock`, transaction rollback, Order not created, Cart kept). Consumer UIs turn it into a shortage message. | BR-04, BR-09, BR-11, BR-20 | `[CODE]` `remote_schema.sql:1104-1108`, `docs/mall1/v2/sql/05_rpc_order.sql:699`; client-web `toOrderErrorMessage`, client-pwa `toMessage`; `[LEGACY]` `prd/1_Inventory.md` 3.4 ("재고 부족 시 차감 거부"); `product-schema.md` §10 (stock check then deduct) | RPC `create_order_from_cart`; client-web and client-pwa order error handling |
| CF-02 | v2 guarantees full allocation by failing creation; there is no shortage computation and no constraint bounding the allocation total by `OrderItem.quantity`. | BR-07, BR-08 | `[CODE]` `create_order_from_cart`, `order_item_ware_allocations` (`quantity > 0`, unique pair only) | tables `order_item_ware_allocations`, `order_items`; RPC `create_order_from_cart`, `cancel_order`, `admin_restock_refund_item` |
| CF-03 | The Order is created before payment (Cart → `create_order_from_cart` → `PENDING` → pay), from the server Cart rather than from items resubmitted at finalize. | BR-01, BR-05, BR-25, BR-44, BR-45 | `[CODE]` `[E2E]`; `payment-contract.md` §2 | RPC `create_order_from_cart`; client-web `/order`, `/payment`; client-pwa order form |
| CF-04 | Payments are bound to an existing Order: `ORDER_PAYMENT` requires `order_id` (`payments_target_valid`); `create_payment` needs an owned `PENDING` Order and copies its total; `complete_payment` requires the Order. A Payment without an Order cannot be represented, and nothing enforces one Order per Payment. | BR-25, BR-45 | `[CODE]` `20260925140000_payments_and_points.sql` (`payments_target_valid`, `create_payment`, `complete_payment`) | table `payments`; RPC `create_payment`, `complete_payment`; client-web `/api/payments*` |
| CF-05 | `PENDING` means "awaiting payment" in v2 (and client-web offers "결제하기" on `PENDING`); v3 defines `PENDING` as a real, already-paid Order the seller must process. | BR-05, BR-24 | `[CODE]` `[E2E]`; `payment-contract.md` §12; `OrderStatusCard.tsx` | `orders.status` semantics, status labels in client-web and user-web |
| CF-06 | Availability is derived from numeric stock (`available_stock > 0`); zero stock or no linked Ware yields `OUT_OF_STOCK`; there is no explicit `is_sold_out`, and the Consumer status type is named after stock. | BR-04, BR-18, BR-19, BR-46, BR-47 | `[CODE]` `get_product_variant_availability` (`remote_schema.sql:1840`); `product_variants` has no sold-out column; `product-schema.md` §6, §9; `packages/types/src/product.ts` | RPC `get_product_variant_availability`, `list_product_posts`, `get_product_post_detail`, `get_cart`; shared types `cart.ts`, `product*.ts`; purchase and Cart UIs |
| CF-07 | `product-schema.md` §6 describes `LOW_STOCK` derived from stock and leaves raw stock disclosure to UI policy. | BR-20 | doc only; Consumer code exposes no `LOW_STOCK` `[CODE]` | `product-schema.md` §6; Consumer availability contract |
| CF-08 | `cancel_order` is Client-only, `PENDING`-only, and raises for any other status including an already `CANCELLED` Order (so a repeated cancel is an error). No Admin cancel RPC, Route Handler, or UI exists. (The `PENDING`-only boundary and the whole-Order scope themselves agree with BR-35 and BR-36.) | BR-16, BR-17, BR-26, BR-35 | `[CODE]` `remote_schema.sql:626`; Admin order route allows only `PAID..DELIVERED` transitions | RPC `cancel_order`; user-web Order inspector and `app/api/admin/orders/[orderId]/route.ts`; client-web cancel UI |
| CF-09 | The Order status RPC has no allocation check: the Order moves forward (`PENDING → PAID → PROCESSING …`) regardless of shortage, so full allocation before `PROCESSING` is not guaranteed by v2, and the premise of BR-42 (Refund-eligible OrderItems have no shortage) is not enforced. It also performs no reservation consume (BR-43). | BR-15, BR-42, BR-43 | `[CODE]` `admin_transition_order_status` (`remote_schema.sql:501`) | RPC `admin_transition_order_status`; user-web Order inspector |
| CF-10 | Admin Order APIs return orders and order items only; no allocation or shortage is exposed to Admin. | BR-12 | `[CODE]` `app/api/admin/orders/route.ts`, `orders/[orderId]/route.ts` (`select("*, order_items(*)")`) | user-web Order screens; Admin types; RPC/Route Handlers to be added by a later decision |
| CF-11 | The v2 production E2E checklist encodes the v2 model (Order before payment, `PENDING` unpaid, `PAID`, Client-only `PENDING` cancel, full-allocation stock arithmetic, no payment reversal on refund). Reusing it as v3 acceptance criteria would contradict BR-01, BR-05, BR-16, BR-24, BR-39. | BR-01, BR-05, BR-16, BR-24, BR-39 | `phase8-production-e2e.md` steps 11–13, 17–21; `phase8-handoff.md` | v3 E2E scenarios must be derived from section 6 instead |
| CF-12 | client-pwa shows the `orders.id` UUID as the "주문 번호" after creation and asks for the UUID on lookup. | BR-22 | `[E2E]` v2 step 24; `[CODE]` `app/page.tsx` | client-pwa `app/page.tsx` |
| CF-13 | The v2 Order lifecycle contains `PAID`: `orders_status_valid` includes it, `complete_payment` moves the Order to `PAID` and sets `payment_reference`, `admin_transition_order_status` allows `PENDING → PAID`, the Admin UI has "결제 완료 처리" (a manual path with no payment evidence), and client-web has a `PAID` status label. | BR-24 | `[CODE]` `remote_schema.sql` (`orders_status_valid`, `admin_transition_order_status`), `20260925140000_payments_and_points.sql` (`complete_payment`), `OrderInspectorController.tsx`, `OrderStatusCard.tsx`; `[E2E]` payment → `PAID` | tables `orders`; RPC `complete_payment`, `admin_transition_order_status`; user-web Order inspector and `app/api/admin/orders/[orderId]/route.ts`; client-web status labels; shared type `OrderStatus` |
| CF-14 | v2 has no payment reversal lifecycle: there is no `payment_reversals` record for cancel / refund / finalize-failure / orphan / administrative reversals and no reversal amount tracking; `cancel_order` does not touch `payments`; `request_refund` does not touch `payments`; `admin_transition_refund_status` approves a Refund without creating a linked reversal, let alone in the same transaction (BR-39); the PG Test service has no cancel/refund API. (The `payments.status` value set `PENDING` / `SUCCEEDED` / `FAILED` is not the conflict; BR-29 keeps it.) | BR-26, BR-27, BR-30, BR-31, BR-32, BR-34, BR-39 | `[CODE]` `20260925140000_payments_and_points.sql`, `remote_schema.sql:626`, `20260925150000_refund_item_restocks.sql` (`admin_transition_refund_status`); `payment-contract.md` §4, §13; `lib/payment/pgTest.ts` | table `payments` and the new reversal table; RPC `cancel_order`, `request_refund`, `admin_transition_refund_status`; client-web `/api/payments*` |
| CF-15 | v2 `complete_payment` marks a payment `FAILED` with `failure_reason` "Order is no longer payable" even though the PG succeeded, so `payments.status` / `failure_reason` mix the PG outcome with an Order-side failure and the original PG success is overwritten. | BR-29, BR-32 | `[CODE]` `20260925140000_payments_and_points.sql` (`complete_payment`) | RPC `complete_payment`; table `payments` (`status`, `failure_reason`) |
| CF-16 | The baseline RPC `restock_order_item` bypasses Policy B: it only checks the quantity against the ordered quantity, accepts any target Ware (not only the original allocation Wares), and keeps no restock record or Refund linkage. It is not used by any application but remains executable by the service role. | BR-40 | `[CODE]` `remote_schema.sql` (`restock_order_item`); `20260925150000_refund_item_restocks.sql` header (left untouched) | RPC `restock_order_item`; `admin_restock_refund_item` is the compliant path |
| CF-17 | `request_refund` does not guarantee the cumulative Refund quantity invariant under concurrency: it sums earlier requests without locking the Order/OrderItems, and the only database constraint is a unique (`refund_request_id`, `order_item_id`), so two concurrent valid requests can both pass the check and exceed `OrderItem.quantity`. Correct for a single sequential flow; concurrency was not exercised in production. (Promoted from the former verification item VF-01.) | BR-38 | `[CODE]` `remote_schema.sql:2283-2468` (no `FOR UPDATE` inside `request_refund`; `refund_items_request_order_item_unique`) | RPC `request_refund`; tables `refund_requests`, `refund_items` |
| CF-18 | v2 uses `current_stock` as a net remainder: `create_order_from_cart` decrements it at allocation, `cancel_order` and restock add to it, and `reserved_stock` plus the `reserve_ware_stock` / `release_ware_reservation` / `consume_reserved_ware_stock` RPCs are never used. Admin physical adjustments (`set_ware_stock`, `adjust_ware_stock`) therefore do not match the meaning of `current_stock` while Orders are `PENDING`. | BR-43 | `[CODE]` `remote_schema.sql:1074-1079` (`create_order_from_cart`), `:626` (`cancel_order`), `admin_restock_refund_item`; the reserve/release/consume RPCs have no callers in `apps/*` | tables `wares`; RPC `create_order_from_cart`, `cancel_order`, `admin_transition_order_status`, reserve/release/consume RPCs, `set_ware_stock`, `adjust_ware_stock`; user-web inventory screens |

### 8.2 Document-by-document matrix

v2 documents are not modified. "Handling" is a recommendation for how this document treats the source; it is not an edit.

| Document | Current rule | v3 approved rule | Judgment | Handling | Affected code / RPC / table / UI |
|---|---|---|---|---|---|
| `v2/PHASES.md` Core #9 | The server connects Variant to Ware to determine inventory availability. | Sellability and numeric shortage are separate (BR-18, BR-19, BR-46). | `CONFLICT` (CF-06) | rewrite in v3 | `get_product_variant_availability`, list/detail RPC, purchase/Cart UI |
| `v2/PHASES.md` Core #10–11 | Cart identity is Product + Variant; OrderItem is a snapshot. | none stated | `DECISION NEEDED` (DN-34) | keep as history; confirm carry-over | `cart_items`, `order_items` |
| `v2/PHASES.md` Phase 8 flow | Cart → Order → Ware stock deduction. | Order after PG (BR-05, BR-25, BR-44); stock model BR-43. | `CONFLICT` (CF-03, CF-18) | rewrite in v3; preserve for history | `create_order_from_cart`, `/order`, `/payment` |
| `v2/PHASES.md` Stock expectations | Order creation deducts allocated stock; `PENDING` cancel restores exactly; refund approval never changes stock; restock only into original allocation Wares; restock beyond the refunded quantity or the Ware allocation fails. | Allocation may be partial (BR-07) and is held as `reserved_stock` (BR-43); cancel by Admin, idempotent, with a payment reversal (BR-16, BR-17, BR-26); refund approval does not restore stock and restock is explicit within the allocation (BR-40). | Cancel and stock deduction parts `CONFLICT` (CF-01, CF-02, CF-08, CF-14, CF-18); refund/restock parts `CONFIRMED` (BR-40) | rewrite in v3; preserve for history | `cancel_order`, `admin_restock_refund_item`, `order_item_ware_allocations` |
| `v2/PHASES.md` Phase 6 client-web/pwa notes | `/order` orders the whole server Cart through `create_order_from_cart`. | Order is created at Stage 2 from resubmitted items (BR-44). | `CONFLICT` (CF-03) | rewrite in v3 | client-web `/order`, client-pwa Cart tab |
| `v2/product-schema.md` §5 | Ware/Warehouse never exposed to Consumers. | BR-20. | `CONFIRMED` | keep | Consumer contracts |
| `v2/product-schema.md` §6 | `stock <= 0` → sold out; stock below a threshold → `LOW_STOCK` may be shown; raw stock disclosure is a UI decision. | BR-18, BR-20, BR-46. | `CONFLICT` (CF-06, CF-07); the `LOW_STOCK` question is resolved: no `LOW_STOCK` (former DN-25) | rewrite in v3 | availability RPC; Consumer types |
| `v2/product-schema.md` §9 | Cart identity Product + Variant; the server checks stock through Ware. | Numeric stock is not a finalization gate (BR-04). | `CONFLICT` (CF-06) / `DECISION NEEDED` (DN-23) | rewrite in v3 | `add_cart_item`, `get_cart` |
| `v2/product-schema.md` §10 | Order creation: Variant → Ware → stock check → stock deduction. | Shortage never blocks (BR-04); allocation is partial and reserved (BR-07, BR-09, BR-43). | `CONFLICT` (CF-01, CF-02, CF-18) | rewrite in v3 | `create_order_from_cart` |
| `v2/product-schema.md` §11 | OrderItem snapshot. | none stated | `DECISION NEEDED` (DN-34) | keep; confirm carry-over | `order_items` |
| `v2/product-schema.md` §12 | History is based on Order. | Stage 1 is not an Order (BR-01); visibility of an in-progress Payment open. | `DECISION NEEDED` (DN-24) | keep as history | `get_order_history`, history UI |
| `v2/product-schema.md` §13 | Refund approval never restocks; Admin restocks explicitly within the original allocation, up to the refunded and allocated quantity; the restock record is Admin-only. | Refund approval does not restore stock; restock is explicit, based on the original allocation, never above the allocated quantity (BR-40). | `CONFIRMED` (BR-40); the refunded-quantity cap is carried over under `DECISION NEEDED` (DN-34) | keep as history | refund/restock RPC |
| `v2/payment-contract.md` §2 | Cart → Order(`PENDING`) → Payment step; stock deduction in the Order transaction. | Order after PG (BR-05, BR-25, BR-44). | `CONFLICT` (CF-03) | rewrite in v3 | `create_order_from_cart`, `/payment` |
| `v2/payment-contract.md` §11 | Payment amount comes from the existing Order total. | No Order exists at PG time; a Payment may exist without an Order; the server determines the amount and recomputes at finalize (BR-25, BR-44, BR-45). | `CONFLICT` (CF-04) | rewrite in v3 | `create_payment`, `payments` |
| `v2/payment-contract.md` §12 | `PENDING` = payment not confirmed; success → `PAID`. | `PENDING` = paid Order the seller must process; `PAID` removed (BR-05, BR-24). | `CONFLICT` (CF-05, CF-13) | rewrite in v3 | `complete_payment`, status labels |
| `v2/payment-contract.md` §3–7 | The PG Test service only records; Mall state changes only through the trusted server after the recorder confirms. | Server confirm is the primary path and a webhook is auxiliary (BR-45); authorize/capture excluded (BR-49). | `CONFIRMED` for "the server decides Mall state, the recorder never does"; the browser-triggered confirm with a Client-picked result is a development adapter (IN-10) | keep as history | `/api/payments/[id]/confirm`, `lib/payment/pgTest.ts` |
| `v2/payment-contract.md` §13 | Non-goals: payment cancellation, refund settlement, Point integration, webhooks. | Payment reversal on cancel, on finalize failure, and on Refund approval is required, kept in a `payment_reversals` child table (BR-26, BR-27, BR-29 to BR-34, BR-39); webhook is auxiliary (BR-45); Point payment excluded (BR-49). | `CONFLICT` (CF-14) / `DECISION NEEDED` (DN-40) | keep as history; rewrite in v3 | payment flow |
| `v2/payment-contract.md` §14–15 | Open items and reviewed sources; largely superseded by the implementation. | none | not applicable (stale) | keep as history | none |
| `v2/phase8-production-e2e.md` steps 11–13 | Order created `PENDING` (unpaid), pay later, then `PAID`. | Order after PG; no `PAID` (BR-05, BR-24). | `CONFLICT` (CF-11) | keep as history | v3 E2E |
| `v2/phase8-production-e2e.md` step 12 | After a failed payment the Order stays `PENDING`. | A failed PG attempt leaves a Payment record and no Order (BR-25, BR-29). | `CONFLICT` (CF-03, CF-04) / `DECISION NEEDED` (DN-20) | keep as history | payment failure UX |
| `v2/phase8-production-e2e.md` step 17 | Client cancels a `PENDING` Order. | Client and Admin cancel the whole `PENDING` Order, idempotent, with a payment reversal (BR-16, BR-17, BR-26, BR-35). | `CONFLICT` (CF-08, CF-11, CF-14) | keep as history | `cancel_order` |
| `v2/phase8-production-e2e.md` steps 18–21 | Refund, approval, restock, stock verification under the v2 policy (`[E2E]`: approval left stock unchanged; restock 0 → 4). | Refund approval does not restore stock; restock explicit (BR-40); Order status unchanged (BR-41); approval creates a linked reversal (BR-39). | `CONFIRMED` for stock and Order-status behavior (BR-40, BR-41); `CONFLICT` (CF-14, CF-11) for the missing reversal | keep as history | refund/restock RPC |
| `v2/phase8-handoff.md` architecture follow-up | Partial cancel, multi-allocation, cancel after payment, refund + cancel, repeated cancel/restock, idempotency, restore history need a clearer design. | Resolved: `PENDING` cancellation (BR-26, BR-28), Cancel/Refund boundary and partial cancel (BR-35, BR-36, BR-37), stock model (BR-43), Multi-Ware initial order (BR-48). | `DECISION NEEDED` for the rest (DN-02) | keep as history; feeds section 7 | cancel/refund/restock |
| `v2/sql/01_tables.sql` / `02_indexes_constraints.sql` | `wares.current_stock >= 0` and `reserved_stock <= current_stock`; allocation `quantity > 0`, unique pair; `orders_status_valid` includes `PAID`; no `is_sold_out`. | `current_stock` non-negative and `reserved_stock` bounded (BR-06, BR-43); allocation may be partial (BR-07); no `PAID` (BR-24); Variant `is_sold_out` (BR-46). | `CONFIRMED` for the stock CHECKs; `CONFLICT` (CF-13, CF-06); `DECISION NEEDED` (DN-14) | keep as history | `wares`, `order_item_ware_allocations`, `orders`, `product_variants` |
| `v2/sql/04_rpc_product.sql` | Availability and post RPCs use stock-derived availability. | BR-18, BR-19, BR-46, BR-47. | `CONFLICT` (CF-06) | rewrite in v3 | availability, list, detail RPC |
| `v2/sql/05_rpc_order.sql` | `create_order_from_cart` fails on insufficient stock, assumes full allocation, and deducts `current_stock`; `cancel_order` Client-only and untouched Payment; `admin_transition_order_status` includes `PENDING → PAID` and has no allocation check or consume; `request_refund` without locks. | BR-04, BR-07, BR-09, BR-15, BR-16, BR-17, BR-24, BR-26, BR-38, BR-42, BR-43. | `CONFLICT` (CF-01, CF-02, CF-08, CF-09, CF-13, CF-14, CF-17, CF-18) | rewrite in v3 (as new forward migrations later, not edits of applied ones) | Order RPCs |
| `v2/sql/06_rpc_warehouse.sql` | Reserve/release/consume RPCs exist but are unused; the baseline `restock_order_item` RPC accepts any Ware. | The reserve/release/consume model is BR-43; restock is explicit and allocation-based (BR-40). | `CONFIRMED` (the RPC set matches BR-43; using it is the change); `CONFLICT` (CF-18, CF-16) | keep as history | `wares`, reserve RPCs, `restock_order_item` |
| `v2/sql/03_rls.sql`, `07_triggers.sql`, `09_user_domain.sql` | Owner RLS, OrderItem immutability trigger, role model. | none stated | `DECISION NEEDED` (DN-34) | keep as history | RLS, triggers |
| applied migration `20260925140000_payments_and_points.sql` (not under `v2/sql/`) | `payments` bound to an Order (`payments_target_valid`); statuses `PENDING/SUCCEEDED/FAILED`; `complete_payment` sets `PAID` and marks a PG-succeeded payment `FAILED` when the Order is no longer payable. | Payment may exist without an Order (BR-25); Order and Payment separate, no `PAID` (BR-24); `payments.status` set unchanged and reversals in a child table (BR-29 to BR-34); one Order per Payment (BR-45). | `CONFLICT` (CF-04, CF-13, CF-14, CF-15); the `payments.status` value set is compatible (`CONFIRMED`) | rewrite in v3 (a later forward migration, not an edit of the applied one) | `payments`, `create_payment`, `complete_payment` |
| applied migration `20260925150000_refund_item_restocks.sql` | `admin_restock_refund_item` enforces the original allocation Ware and the allocation/refund quantity caps; `admin_transition_refund_status` stamps `processed_at` and creates no reversal. | Policy B (BR-40); Refund approval creates the linked reversal in the same transaction (BR-39). | `CONFIRMED` (BR-40); `CONFLICT` (CF-14) | keep; extend by a later forward migration | `admin_restock_refund_item`, `admin_transition_refund_status`, `refund_item_restocks` |
| legacy `prd/3_2_1_Order_Client_Auth.md` §1, §5 | The Order is created after payment completes; unpaid → no Order. | Order created from PG completion (BR-05, BR-25, BR-45). | `CONFIRMED` (direction only) | reference only (`legacy intent`) | none |
| legacy `prd/3_2_1_Order_Client_Auth.md` §2, §4 | Select part of the Cart or buy now; Client confirms delivery. | none stated | `DECISION NEEDED` (DN-23, DN-14) | reference only | Cart/Checkout, status set |
| legacy `prd/3_1_Order_Admin.md` §4 | Admin may cancel `PENDING` Orders; `SHIPPING`/`COMPLETED` are excluded from cancellation; stock restored through Inventory; payment handling belongs to the Payment module. | Admin may cancel `PENDING` only (BR-16, BR-35); payment reversal (BR-26). | `CONFIRMED` (direction only) | reference only | none |
| legacy `prd/3_0_Order_Summary.md` | Statuses `PENDING`, `SHIPPING`, `COMPLETED`, `CANCELLED`; `PENDING` = payment and Order creation complete (no separate paid status); delivery info (carrier, tracking). | No `PAID`; `PENDING → PROCESSING → SHIPPED → DELIVERED`, `CANCELLED` (BR-24). | `CONFIRMED` (direction only: no separate paid status); remaining set and delivery data `DECISION NEEDED` (DN-14) | reference only | Order status set, delivery data |
| legacy `prd/1_Inventory.md` §3.4 | Deduction is refused when stock is insufficient. | Shortage never blocks Order creation (BR-04). | `CONFLICT` (CF-01) | reference only | inventory/Order logic |
| legacy `prd/6_1_Point_System.md` | Points as a payment method, accrual, restoration; Point deduction in the final Order-creation transaction. | Point payment excluded from the initial v3 (BR-49). | `CONFLICT` for Point payment as a v3 feature (excluded); existing top-up `DECISION NEEDED` (DN-49) | reference only | Point ledger, Order finalization |

---

## 9. Implementation Impact Index

List only. This is not an implementation plan and does not order or schedule any work.

### 9.1 Tables and constraints

- `orders` (`orders_status_valid`, which includes `PAID`; `order_number`; `payment_reference`)
- `order_items` (`prevent_order_item_update` trigger; `quantity_positive`)
- `order_item_ware_allocations` (`quantity_positive`; unique (`order_item_id`, `ware_id`); no allocation-total bound)
- `wares` (`current_stock_nonnegative`; `reserved_stock_nonnegative`; `reserved_stock_not_over_current`; the meaning of both columns changes to BR-43)
- `warehouses`, `product_variant_wares`
- `products`, `product_variants` (`is_active`; new `is_sold_out` on `product_variants`), `product_posts`, `product_post_products`
- `carts`, `cart_items`
- `payments` (`payments_target_valid`, which requires `order_id` for `ORDER_PAYMENT`; `payments_order_succeeded_uidx`; `payments_status_valid`, whose value set stays; `payments_completed_state`; `payments_amount_positive`; no reversal table, no PG transaction identifiers)
- `point_balances`, `point_ledger` (`point_ledger_type_valid`; `point_ledger_payment_unique`)
- `refund_requests` (no status CHECK; the shared type lists `COMPLETED` and `CANCELLED`), `refund_items` (unique per request and OrderItem only, no cross-request quantity bound), `refund_item_restocks`
- `client_addresses`, `wishlist_items`, `user_profiles`
- Do not exist yet: `product_variants.is_sold_out` (BR-46); the `payment_reversals` child table (provisional name) with its reason type, status, idempotency key, PG reference, optional `order_id` / `refund_request_id`, and the amount limit of BR-34; a link from a Payment created without an Order to the Order created at Stage 2 with one Order per Payment (BR-25, BR-45); database enforcement of the cumulative Refund quantity (BR-38).

### 9.2 RPC

- Order/Stock: `create_order_from_cart` (to be replaced by a finalize from resubmitted items), `cancel_order`, `admin_transition_order_status`, `get_order_history`
- Stock/Ware: `adjust_ware_stock`, `set_ware_stock`, `transfer_ware_stock`, `reserve_ware_stock`, `release_ware_reservation`, `consume_reserved_ware_stock` (these three match BR-43 and are currently unused), `restock_order_item` (baseline, not Policy B compliant, CF-16), `get_ware_snapshot`, `create_ware`, `update_ware`, `create_warehouse`, `update_warehouse`, `link_product_variant_ware`, `unlink_product_variant_ware`
- Availability/Product: `get_product_variant_availability`, `list_product_posts`, `get_product_post_detail`, `get_product_detail`, `admin_create_product`, `admin_update_product`, `admin_save_product_post`
- Cart: `get_cart`, `get_or_create_cart`, `add_cart_item`, `update_cart_item_quantity`, `remove_cart_item`
- Payment/Point: `create_payment`, `complete_payment`
- Refund/Restock: `request_refund` (no lock, CF-17), `admin_transition_refund_status` (no reversal, CF-14), `admin_restock_refund_item`
- Not defined anywhere found: `complete_onboarding` (VF-05)
- Do not exist yet: the Stage 2 finalize (one Order per Payment), payment reversal creation/processing, Refund approval that creates the linked reversal in one transaction (BR-39), orphan-Payment handling, Admin allocation/shortage RPCs, a seller-initiated Refund or seller-failure path (DN-46).

### 9.3 Route Handlers

- client-web: `app/api/payments/route.ts`, `app/api/payments/[paymentId]/confirm/route.ts`; `lib/payment/server.ts`, `lib/payment/pgTest.ts`
- user-web: `app/api/admin/orders`, `orders/[orderId]` (includes the `PENDING → PAID` transition); `app/api/admin/refunds`, `refunds/[refundId]`, `refunds/[refundId]/restocks`; `app/api/admin/wares`, `wares/[wareId]`; `app/api/admin/warehouses`; `app/api/admin/overview`; `app/api/admin/products`, `products/[productId]`, `products/[productId]/variant-wares`; `app/api/admin/product-posts`
- Do not exist yet: a Stage 2 finalize endpoint, a production PG webhook endpoint, a PG reversal/cancel path and its retry mechanism (implementation design), the orphan-Payment detection job.

### 9.4 Shared types (`packages/types/src`)

`order.ts` (`OrderStatus` includes `PAID`), `cart.ts`, `payment.ts` (a reversal type does not exist yet), `point.ts`, `refund.ts` (`RefundStatus` includes `COMPLETED` and `CANCELLED`), `adminRefund.ts`, `inventory.ts`, `adminOverview.ts`, `adminVariantWare.ts`, `product.ts` (`ProductVariantStockStatus` is named after stock), `productPost.ts`, `history.ts`, `clientAddress.ts`, `wishlist.ts`

### 9.5 client-web

- Pages: `app/order/page.tsx`, `app/payment/page.tsx`, `app/success/page.tsx`, `app/cart/page.tsx`, `app/mypage/history/page.tsx`, `app/mypage/order-history/[id]/page.tsx`, `app/mypage/point/page.tsx`, `app/wishlist/page.tsx`
- Components: `components/order/*`, `components/payment/*`, `components/cart/*`, `components/history/*`, `components/mypage/history/order/*` (`OrderStatusCard` with its `PAID` label and "결제하기" on `PENDING`, `OrderRefundCard` with its `COMPLETED`/`CANCELLED` labels), `components/mypage/point/*`, `components/wishlist/*`
- Hooks: `hooks/order/useClientOrder.ts`, `hooks/order/useOrderSection.tsx`, `hooks/payment/usePaymentApi.ts`, `hooks/user/useCart.ts`, `hooks/user/useWishlist.ts`, `hooks/history/*` (`useOrderAfterSales.ts` holds the cancel/refund eligibility helpers), `hooks/point/usePoint.ts`, `hooks/useProductPost.ts`

### 9.6 user-web

- Orders: `app/(admin)/orders/page.tsx`, `component/order/*` (Order inspector and transition controls, including "결제 완료 처리")
- Refunds: `app/(admin)/refund/page.tsx`
- Inventory: `app/(admin)/inventory/page.tsx`, `component/inventory/*` (physical stock adjustment and the `reserved_stock` view)
- Dashboard: `app/(admin)/page.tsx` (low-stock alert, threshold 5)
- Products: `app/(admin)/products/*` (the new `is_sold_out` setting)

### 9.7 client-pwa

`app/page.tsx` (list, detail, Cart, Order, lookup), `lib/api.ts`, `lib/auth.ts`, `app/auth/callback/route.ts`, Service Worker `public/sw.js`

---

## Document maintenance

- Approved rules (section 3) change only by explicit user decision.
- A `DECISION NEEDED` item moves into section 3 only when the user approves it; then the matching registry row moves to section 7.2.
- Implementation notes (section 7.3) are not business decisions; they record design choices the user assigned to implementation.
- v2 documents are not edited to reflect this document.

### Revision history

- Draft 0.1 (2026-09-26): initial capture (BR-01 to BR-22, CF-01 to CF-12, DN-01 to DN-34).
- Draft 0.2 (2026-09-26): added BR-23 to BR-28 (shortage Orders look ordinary to the Consumer; Order/Payment separation and removal of `PAID`; Payment without an Order; Payment reversal on `PENDING` cancellation; reversal on finalize failure; no auto-allocation of available stock); reinforced BR-21 and BR-22; added CF-13 and CF-14; resolved DN-21, DN-22, DN-29, DN-31, DN-32; added DN-35 to DN-41; added scenarios S-26 to S-28.
- Draft 0.3 (2026-09-26): added BR-29 to BR-34 (original payment vs `payment_reversals`, `payments.status` unchanged, reversal causes/fields/states/invariants, no generic event ledger, reversal amount invariant `SUM(PENDING + SUCCEEDED) <= payments.amount`); corrected BR-26 and BR-27 from "Payment `REFUND_PENDING` → `REFUNDED`" to "`payments.status` stays `SUCCEEDED` plus a reversal `PENDING` → `SUCCEEDED`"; resolved DN-35 and DN-36; added section 7.3 implementation notes IN-01 to IN-06; reworded CF-14 and added CF-15; narrowed DN-19, DN-27, DN-37 to DN-40; added scenario S-29.
- Draft 0.4 (2026-09-26): added BR-35 to BR-42 (Cancel only in `PENDING` and whole Order only; Refund eligibility and partial Refund; cumulative Refund quantity invariant; Refund approval and linked reversal in one transaction; Policy B; Refund does not change the Order status; no allocation decrease after `PROCESSING`); resolved DN-05, DN-06, DN-07, DN-08, DN-15, DN-28, DN-30; reduced DN-27; added DN-42 to DN-47; added IN-07 and IN-08; promoted VF-01 to CF-17 and added CF-16; updated CF-08, CF-09, CF-11, CF-14; added scenarios S-30 to S-36 and reworked S-18 to S-23; updated terminology, lifecycle, transitions, matrix, and impact index.
- Draft 0.5 (2026-09-26): added BR-43 to BR-49 (stock model physical `current_stock` + `reserved_stock` with consume at `PROCESSING` entry; Stage 1 data stays with the Client and the server records only the Payment; finalize contract with server confirm primary, webhook auxiliary, one Order per `payment_id`, price mismatch rejected and reversed; Variant `is_sold_out` with `is_active` kept; Ware-less Variants orderable with full shortage; deterministic Multi-Ware order; initial v3 scope with Point payment and authorize/capture excluded and PWA limited to the core scope); resolved DN-01, DN-03, DN-09, DN-10, DN-11, DN-13, DN-16, DN-17, DN-18, DN-26, DN-33, DN-37; narrowed DN-02, DN-23, DN-24, DN-38, DN-39, DN-41; added DN-48 and DN-49; added IN-09 to IN-11; added CF-18 and updated CF-03, CF-04, CF-06, CF-09; added scenario S-37 and reworked S-01 to S-06, S-10, S-11, S-16, S-17, S-20, S-23 to S-26, S-30; updated terminology, audit, lifecycle, transitions (T-26), matrix, and impact index.
- Draft 0.6 (2026-09-26): recorded the Phase 2 implementation decisions: resolved DN-25 (Consumer sellability `AVAILABLE` / `SOLD_OUT` / `UNAVAILABLE`, no `LOW_STOCK`, no numeric stock level to the Consumer) and noted the decided synchronization approach on IN-09; no rule was added or changed.
- Draft 0.7 (2026-09-26): recorded the Phase 3 implementation decisions: resolved DN-40 (retry and `MANUAL_RECONCILIATION` creation only at the `service_role` boundary, actor in `requested_by`, Admin UX later) and noted the decided approaches on IN-01 (retry reuses the row, `attempt_count`, no attempt table) and IN-03 (Phase 1 trigger as final guard, Payment row lock in the creation RPC); no rule was added or changed.
- Draft 0.8 (2026-09-26): recorded the Phase 4 implementation decisions: resolved DN-38 (orphan detection by scan job, default window 30 minutes), DN-39 (rollback, Client retry, orphan fallback), DN-41 (no zero-amount Orders in the initial v3); narrowed DN-23 (finalize does not touch the Cart); DN-19, DN-20, DN-24 stay open for Phase 8; noted the decided approaches on IN-10 and IN-11; added IN-12 (the known limitation that the server verifies a resubmitted checkout only by its total); no rule was added or changed.
- Draft 0.9 (2026-09-27): recorded the Phase 5 implementation decisions: resolved DN-12 (actor and reason in `order_cancellations`, one row per Order, first cancel kept); narrowed DN-19 (the Cancel API/domain contract is fixed in Phase 5, Consumer display and wording go to Phase 8); no rule was added or changed.
- Draft 0.10 (2026-09-27): recorded the Phase 6 implementation decisions: resolved DN-14 (Admin-only, one-step transitions, `UNCHANGED` on repeat, `PROCESSING` needs full allocation and payment evidence), DN-02 (explicit Admin additional allocation reusing the Phase 2 functions, never automatic), DN-04 (no automatic `PENDING` expiry); no rule was added or changed.
- Draft 0.11 (2026-09-27): recorded the Phase 7 implementation decisions: resolved DN-47 (status set `REQUESTED` / `APPROVED` / `REJECTED`, valid = `REQUESTED` or `APPROVED`), DN-43 (no partial approval), DN-44 (no withdrawal), DN-45 (`ALREADY_*` on the same decision, refusal on the opposite, no duplicate reversal); narrowed DN-27 (snapshot unit price times quantity, review when discount/shipping exists); DN-42 carried to Phase 9 and DN-46 carried to Phase 8/9; no rule was added or changed.
- Draft 0.12 (2026-09-27): recorded the Phase 8 implementation decisions: resolved DN-20 (a failed Payment ends there, a retry is a new Payment), DN-24 (an in-progress Payment is not shown, a reload resumes from the held data), DN-19 (only a general message, no reversal detail / actor / reason), DN-23 (finalize does not touch the Cart, the Client removes the purchased lines, no selected-item order or buy-now), DN-48 (PWA ordering handed off to client-web), DN-49 (Point UI hidden, data and RPCs kept); DN-46 carried to Phase 9; no rule was added or changed.
- Draft 0.13 (2026-09-27): Phase 9 preparation: added the recommendations for DN-42 (no window at release) and DN-46 (Admin-created Refund, implemented) as pending the user's approval; the production/cutover decisions (legacy unpaid Orders, orphan window, reversal reprocessing, PG adapter, Point legacy, `payments.order_id`) are in CUTOVER.md; no approved rule was changed.
- Draft 0.14 (2026-09-27): recorded the Phase 9 user decisions: resolved DN-42 (no Refund window after `DELIVERED` in the initial v3, re-reviewed later) and DN-46 (the Admin creates the Refund request on behalf of the Client; approval, reversal, and explicit restock reuse the Refund flow; the Admin-initiated fact is kept for audit). No approved rule was changed. The production cutover decisions (legacy unpaid Orders and the rest) are in CUTOVER.md.
