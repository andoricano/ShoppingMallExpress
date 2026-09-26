# CLAUDE.md

## Repository

ShoppingEx / Mall monorepo.

This repository is transitioning from Mall v2 to Mall v3.

Mall v2 completed the main architecture migration:

- legacy Express/API runtime removed
- Next.js applications retained
- Supabase Auth / RLS / RPC used as the main data boundary
- privileged operations use narrow server-side boundaries where required
- consumer/admin applications are deployed and have been exercised in production

Mall v3 is not yet an implementation phase.

The immediate goal is to re-define and freeze the business rules that were partially distorted or left ambiguous during v2 migration.

Do not assume the current implementation is the desired v3 behavior.

---

## Required Reading Order

Before any non-trivial v3 work, read in this order:

1. `/AGENTS.md`
2. `/CLAUDE.md`
3. `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md` once it exists
4. relevant `docs/mall1/v3/*`
5. current schema / migrations / RPC
6. relevant application code
7. `docs/mall1/v2/*` as v2 implementation history
8. legacy PRD only as historical intent

If the requested work touches Order / Stock / Payment / Cancel / Refund, inspect the whole lifecycle rather than only the named file.

---

## Core Workflow

For substantial work, use:

`Analyze -> Plan -> Implement -> Validate -> Review`

Do not skip analysis.

When the user requests analysis only:

- inspect,
- report,
- do not edit.

When the user requests planning only:

- produce the plan,
- do not edit.

When implementation depends on unresolved business policy:

- stop at `DECISION NEEDED`,
- explain the conflict,
- do not silently invent a rule.

---

## Classification Rules

When comparing code, docs and intended behavior, use:

- `CONFIRMED`
  - current implementation and approved policy agree

- `CONFLICT`
  - code/docs/approved policy disagree

- `DECISION NEEDED`
  - no approved rule exists yet

Do not convert `DECISION NEEDED` into an implementation choice on your own.

---

## Source of Truth

For v3 work, use this authority order:

1. explicit user-approved business decisions
2. `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md`
3. approved v3 domain contracts
4. current DB/schema/RPC and application code as evidence of existing behavior
5. `docs/mall1/v2/*`
6. legacy PRD

Important:

- current code is not automatically correct
- existing v2 SQL is not automatically correct
- legacy PRD is not automatically correct
- old E2E success proves observed v2 behavior, not necessarily desired v3 policy

When sources disagree, report the disagreement.

---

<!-- BEGIN SAFETY RULES (mirrored verbatim in AGENTS.md and CLAUDE.md) -->
## Safety Rules (non-negotiable)

### Working tree and scope

- Before modifying any file, run `git status` and read the files you will change.
- Preserve existing user changes. Never overwrite, revert, or reformat changes you did not make.
- Modify only files required by the requested task.
- Do not fix unrelated files or problems; report them instead.
- Do not scan the whole repository unless the task requires it.
  Avoid generated and dependency directories
  (`node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `.turbo/`).

### Git

- Never run `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git restore .`,
  or any equivalent command that discards work.
- Do not amend, squash, rebase, force-push, rewrite history, or create/move tags unless explicitly requested.
- Commit or push only when the user asks, or when the task explicitly includes it.
  Commit only task-related files.
- A Git push does NOT authorize any database or Supabase operation.

### Database and migrations

- Never run `supabase db push` (including `pnpm supabase db push`) unless the user explicitly
  instructs it in the current task.
- Never run `supabase db reset --linked`, or any reset against a remote or linked database.
- Any Supabase CLI command that targets the linked/remote project
  (`--linked`, a remote `--db-url`, `link`, `migration repair`, `db pull`, `functions deploy`, ...)
  requires an explicit instruction. If such a command is read-only, say so before running it.
- Applying a migration to production requires an explicit instruction that names the migration(s).
  Preparing and validating a migration locally is not an instruction to apply it.
- A successful local result (`pnpm supabase db reset`, local tests) is NOT approval to apply anything to production.
- Treat applied migrations as immutable. Make changes as a new forward migration,
  validate the full local chain with `pnpm supabase db reset`, then report the migration as ready.
- Use the local Docker Supabase (`pnpm supabase start|stop|status`, `db reset`, `migration new`)
  with local credentials only. Do not use the Dashboard SQL editor as the development workflow.

### Production

- No destructive or mutating production operation (data or schema) without explicit authorization.
  This includes deleting or updating rows, changing publication state, stock, user roles,
  or payment/refund records.
- Read-only production inspection only when requested. State what it reads.
- For destructive SQL: explain what it changes, scope it narrowly, and wait for approval.

### Secrets

- Never invent, print, log, quote in reports, or commit secrets, keys, or tokens.
- `NEXT_PUBLIC_*` variables hold browser-safe values only.
  Privileged Supabase credentials are server-only.
  Never create a privileged Supabase client in browser code.
  Never copy production privileged credentials into local or browser-safe configuration.

### Deployment

- Do not trigger or modify production deployment settings unless the task requires it.
<!-- END SAFETY RULES -->

---

## v2 Preservation

Do not rewrite v2 history to make it look like v3 rules were always intended.

Treat:

`docs/mall1/v2/*`

as historical/current-v2 documentation.

v3 rules belong under:

`docs/mall1/v3/*`

If useful, add a cross-reference later, but do not erase the v2 record.

---

## Current v3 Documentation Order

Before creating or executing `docs/mall1/v3/PHASES.md`, establish:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md`
4. major business decisions
5. then `docs/mall1/v3/PHASES.md`

PHASES must be derived from approved business logic.

Do not let implementation phases define business policy accidentally.

---

# Confirmed v3 Business Direction

The following rules are already approved.

## 1. Order creation is conceptually two-stage

### Stage 1: Client-side temporary checkout state

- Client holds temporary order/checkout information.
- A real `orders` row is not required yet.
- PG/payment interaction occurs in this stage.
- This stage may remain open for a long time.
- This stage is not yet an Admin fulfillment order.

Do not introduce a DB `CHECKOUT_PENDING` state unless a later decision explicitly requires it.

### Before Stage 2

The server must revalidate the selected sellable item before final Order creation.

Check things such as:

- ProductPost / Product / Variant still valid
- explicit sold-out state
- sale disabled state
- current server-side price
- other explicitly approved sellability constraints

Important:

Numeric stock shortage alone must not reject final Order creation.

### Stage 2: Real Order creation

After the PG/payment flow reaches the point where the order should be finalized:

- create the real Order
- initial real Order status is `PENDING`
- `PENDING` means the seller has a real Order to process

---

## 2. Sold-out state is NOT the same as numeric stock shortage

Do not implement:

`current_stock <= 0 => SOLD_OUT`

unless the user explicitly changes this policy.

Two separate concepts exist:

### Sellability state

Consumer-visible.

Examples:

- sellable
- sold out
- sale disabled
- unpublished

This may block checkout/order finalization.

### Operational stock shortage

Admin-side fulfillment concern.

Examples:

- 10 units physically available
- 15 valid Orders received

All 15 Orders may still be accepted if the item remains sellable.

The seller may later decide which unfulfillable Orders to reject/cancel.

---

## 3. Consumer must not receive internal stock/logistics detail

Normal Consumer responses must not expose internal data such as:

- Ware internals
- Warehouse internals
- raw `current_stock`
- raw `reserved_stock`
- allocation rows
- restock rows
- privileged inventory metadata

Consumer should see only approved sellability/order status information.

---

## 4. Overselling at Order intake is allowed

Example:

- numeric inventory = 10
- real incoming Orders = 15

Valid result:

- 15 Orders may exist
- seller later processes available stock
- seller may reject/cancel the excess Orders

Therefore do not assume:

- every OrderItem must be fully Ware-allocated at Order creation
- numeric shortage must fail Order creation
- allocation quantity must always equal OrderItem quantity immediately

The current v2 implementation may violate this policy.

Treat such behavior as a v3 conflict, not as the target rule.

---

## 5. PENDING cancellation

While an Order is `PENDING`:

- Client can cancel
- Admin/seller can cancel/reject

Cancellation must be idempotent from the caller perspective.

Examples:

- Client double-clicks cancel
- Client and Admin cancel at nearly the same time
- retry occurs after a timeout

The final state should safely remain cancelled without avoidable user-facing transition errors.

Do not expose unnecessary low-level state-transition failures when the requested final state has already been reached.

---

## 6. Stock / Allocation

### Numeric stock and allocation

- `current_stock` never becomes negative.
- Numeric shortage is never represented by a negative `current_stock`.
- Order quantity and Ware allocation quantity are separate concepts.
- The assumption that every OrderItem is fully Ware-allocated at Order creation is removed.
- Allocation is recorded in `order_item_ware_allocations`:

```text
allocated_quantity = SUM(order_item_ware_allocations.quantity)   -- per OrderItem
shortage_quantity  = OrderItem.quantity - allocated_quantity
```

- `allocated_quantity` may be less than `OrderItem.quantity`.
- Shortage is not stored in a mutable OrderItem column by default (OrderItem snapshots are immutable).
  It must be computable from the allocation records.
- Admin must be able to see shortage per Order and per OrderItem.
- Consumer never receives raw stock, allocation, or shortage numbers.

### Allocation when the real Order is created (Stage 2)

- When the real Order (`PENDING`) is created, only the stock that can currently be secured is allocated.
- Allocated quantity is held for that Order.
  A later Order cannot take stock that is already allocated.
- Insufficient stock does not fail Order creation.
  The part that could not be secured is shortage (unallocated quantity).

Example:

```text
stock 10
Order A x6 -> allocation 6, shortage 0
Order B x6 -> allocation 4, shortage 2
both Orders are created as PENDING
```

When several Wares are linked, the initial v3 uses a deterministic allocation order only;
an explicit Ware priority is a later policy (see section 14).

### New stock arrival

- New stock is not automatically allocated to any Order.
- Admin reviews the shortage Orders and decides which Order receives additional allocation,
  or cancels/rejects it.
- Automatic FIFO or priority allocation is not implemented for now.

### Processing / fulfillment gate

- An Order with shortage may exist as `PENDING`.
- Admin may add allocation, or cancel/reject the Order.
- While any OrderItem still has unallocated quantity, the Order cannot proceed to a real fulfillment stage.
  At minimum, full allocation must be complete before `PROCESSING` / `SHIPPED`.
- The exact status transition table is finalized in `BUSINESS_LOGIC_AND_SCENARIOS.md`.

### SOLD_OUT / sale disabled

- Explicit SOLD_OUT / sale-disabled state and numeric stock shortage are separate.
- SOLD_OUT is an explicit sellability state decided by Admin.
- `current_stock == 0` alone never means SOLD_OUT.
- The database representation is decided in section 14 (`is_sold_out` boolean on the Variant; `is_active` stays as sale disabled).

### reserved_stock

Decided in section 12: `reserved_stock` holds the quantity allocated to `PENDING` Orders.

---

## 7. Order and Payment are separate lifecycles

- Payment status is managed separately from Order status.
- `PAID` is removed from the v3 Order lifecycle.
- Base Order lifecycle: `PENDING -> PROCESSING -> SHIPPED -> DELIVERED`.
  `CANCELLED` is a separate terminal state.
- A real Order is created only after PG success (Stage 2), so an existing Order normally implies that its payment passed.
- The v2 Admin manual `PENDING -> PAID` action is a removal target in v3.
  Do not allow a default path that advances an Order without payment evidence.

The Payment status set stays `PENDING` / `SUCCEEDED` / `FAILED`; reversal history is kept separately (see section 10).

---

## 8. Payment records may exist before an Order

- Stage 1 Checkout is not a database Order, but the server may keep a verifiable Payment record
  of the PG transaction/attempt and its result even when no Order exists yet.
- After PG success, Stage 2 finalize creates the real Order and links the Payment to it.
- The v2 rule that an `ORDER_PAYMENT` requires an existing `order_id` conflicts with this direction.
- If Stage 2 cannot create the Order because of a business validation failure
  (for example SOLD_OUT, sale disabled, or a price-policy rejection), the Payment moves to
  automatic cancel/refund handling.
  Invariant: "PG success + Order not created + no follow-up" is not allowed.

---

## 9. PENDING cancellation and Payment reversal

- A `PENDING` Order has already passed payment.
  Cancelling it (Client or Admin) starts together: Order -> `CANCELLED`, allocation release,
  and Payment cancel/refund handling.
- An external PG call cannot be atomic with a database transaction.
  Order status and Payment status are therefore separate and consistency is eventual.
- Default direction: a payment reversal (cause `ORDER_CANCEL`) is created as `PENDING` and becomes `SUCCEEDED`
  when the PG cancellation succeeds. `payments.status` stays `SUCCEEDED` (see section 10).
- A PG failure or delay must not repeat the Order cancellation or the allocation release.
  Duplicate/concurrent cancellation stays idempotent (see section 5).

---

## 10. Payment model: original payment and reversals are separate

- `payments` is the record of the original payment.
  `payments.status` stays `PENDING` / `SUCCEEDED` / `FAILED`.
  Do not add `REFUNDED`, `PARTIALLY_REFUNDED`, or `REFUND_PENDING` to `payments.status`.
  The original payment success is preserved after any reversal.
- A child table (provisional name `payment_reversals`) holds the cancel / refund / reversal history.
  One Payment may have several reversal rows (partial and repeated refunds).
  Causes include at least: order cancel, refund, finalize failure, orphan payment,
  and administrative/manual reconciliation adjustment (enum names are decided at implementation design).
- Base reversal information: `payment_id` (required), amount, reason type, status
  (`PENDING` / `SUCCEEDED` / `FAILED`), idempotency key, PG reference, failure reason, created/updated time.
  Optional links: `order_id`, `refund_request_id`.
- Invariants:
  - `SUM(amount of PENDING + SUCCEEDED reversals) <= payments.amount`, always.
    A reversal in progress occupies refundable amount. A `FAILED` reversal does not.
    Enforcement (row lock, RPC transaction, constraint) is implementation design.
  - A duplicate reversal for the same business request is blocked by the idempotency key.
  - A refund-request-based reversal is linked to that refund request.
  - An Order-cancel reversal can exist without a refund request.
  - A finalize-failure or orphan-payment reversal can exist without an Order.
  - A reversal failure does not change the original payment success.
- Payment-level "refund in progress / partially refunded / fully refunded" is derived from reversals.
- A generic `payment_events` ledger is not the core payment model.
  A raw PG callback/webhook append-only log is a possible future implementation option.

---

## 11. Cancel and Refund boundary

Cancel:

- Order Cancel is allowed only in `PENDING`, for the whole Order, by the Client or the Admin.
  It is not allowed in `PROCESSING`, `SHIPPED`, or `DELIVERED`.
  A further Cancel of a `CANCELLED` Order keeps the final state idempotently.
- Money return after `PROCESSING` is handled by the Refund domain, not by Cancel.
- Partial Cancel (some OrderItems or some quantity) is not supported in the initial v3.
  Because the Cancel and Refund status ranges do not overlap, cancel and refund do not mix on one Order.

Refund:

- A Refund can be requested in `PROCESSING`, `SHIPPED`, or `DELIVERED`, not in `PENDING` or `CANCELLED`
  (`PENDING` uses Cancel). Partial Refund is supported per OrderItem quantity, priced at the snapshot unit price.
- Invariant: the cumulative valid Refund quantity of an OrderItem never exceeds `OrderItem.quantity`,
  including under concurrent requests. Enforcement (row lock, RPC) is implementation design.
- Approving a Refund (`REQUESTED -> APPROVED`) and creating its linked `payment_reversal` (`PENDING`)
  succeed or fail in one database transaction.
  If the reversal row cannot be created, the approval is not committed.
  A later failure of the actual PG reversal does not revert the approval;
  the reversal is reprocessed in the reversal domain.
- A rejected Refund creates no reversal and has no Payment or stock effect.
- Refund approval does not restore stock (Policy B). Restock is an explicit Admin action,
  based on the original allocation Ware, never above the actually allocated quantity;
  shortage/unallocated quantity is never restockable.
- Refund does not change the Order fulfillment status (no `CANCELLED` because of a Refund).
  Refund state and amount live in `refund_requests`, `refund_items`, and `payment_reversals`.

Allocation:

- After an Order enters `PROCESSING`, no ordinary allocation decrease/release path is allowed.
  Full allocation must be complete before `PROCESSING` (section 6).
  Stock recovery after that point is done by Refund/Restock, not Cancel.
  Therefore a refund-eligible OrderItem has no shortage/unallocated quantity in the normal lifecycle.

---

## 12. Stock model: physical stock plus reservation

- `current_stock` is the physical stock of a Ware and is never negative.
- `reserved_stock` is the quantity held by the allocations of `PENDING` Orders.
  Always `0 <= reserved_stock <= current_stock`.
  Stock available for a new allocation is `current_stock - reserved_stock`.
- Allocation (at Stage 2 or by an Admin additional allocation) increases `reserved_stock`, not `current_stock`.
- Cancelling a `PENDING` Order releases its allocation: `reserved_stock` decreases, `current_stock` is unchanged.
- Entering `PROCESSING` consumes the reservation: `current_stock` and `reserved_stock` both decrease
  by the allocated quantity.
- After that point stock is recovered only through Refund/Restock: an explicit Admin restock increases
  `current_stock`. This is the same for a Refund in `PROCESSING`, `SHIPPED`, or `DELIVERED`.
- Admin physical stock adjustments act on `current_stock` and cannot go below `reserved_stock`.
- Released or newly available stock is not auto-allocated to existing shortage Orders (section 6).

---

## 13. Stage 2 finalize contract

- Handoff: the checkout data (items, shipping address) stays with the Client.
  The server records only the Payment. At finalize the Client resubmits the items and address.
  The server never trusts a Client price: it determines the payment amount itself and recomputes at finalize.
- Trigger: the server confirm (the server verifies the result with the PG) is the primary path.
  A webhook is the auxiliary path (de-duplication, recording a success the browser did not report,
  orphan detection input, reversal result notification).
- Exactly one Order per `payment_id`. A repeated finalize returns the existing Order.
- A price mismatch at finalize rejects the finalize and reverses the full payment
  (reversal cause `FINALIZE_FAILURE`).
- An orphan Payment (PG success but no finalize) is handled by a reversal policy, not by a server-side finalize.
  Detection and the time window are not decided.
- Authorize/capture is not part of the initial v3.

---

## 14. Sellability schema, Ware linkage, and initial v3 scope

- `is_active` on Product and Variant stays as "sale disabled".
  The Variant gets a boolean `is_sold_out`, set by the Admin. No Product-level sold-out flag in the initial v3.
- A Variant with no linked Ware can still be ordered; its whole quantity is shortage
  (by section 6 it cannot enter `PROCESSING` until a Ware is linked and fully allocated).
- Multi-Ware: the initial v3 uses a deterministic allocation order only. An explicit priority is a later policy.
- Initial v3 scope:
  - Point payment is excluded.
  - Authorize/capture is excluded.
  - client-pwa keeps only product list/detail, Cart, and Order creation/lookup.
    A separate PG payment UI in the PWA and full parity with client-web are excluded.
  - Open: how PWA Order creation relates to the rule that a real Order exists only after PG success.

---

# Unresolved v3 Decisions

Do not decide these without explicit approval:

- Admin additional-allocation workflow details (screen/RPC semantics, partial allocation,
  what happens when several Orders are short)
- PENDING expiration policy
- seller rejection reason/state model
- remaining Order status transition details (the base lifecycle is approved in section 7 and Cancel is limited to `PENDING` in section 11)
- Refund window after `DELIVERED`
- whether the Admin may approve only part of the requested Refund quantity
- whether the Client may withdraw a Refund request
- idempotency policy for repeated Refund approval/rejection requests
- Refund amount derivation when discounts or shipping fees exist
- seller-initiated Refund / seller-failure workflow when an Order must be stopped after `PROCESSING`
  (re-allowing Cancel after `PROCESSING` is not a preferred candidate)
- Refund request status set and the meaning of `COMPLETED` / `CANCELLED`
- orphan Payment detection and time window, transient finalize failures, and any exceptional payment reconciliation path
- zero-amount Orders and the "an Order implies a passed payment" invariant
- how PWA Order creation relates to "a real Order exists only after PG success" when the PWA has no PG payment UI
- fate of the existing Point top-up feature now that Point payment is excluded from the initial v3

Resolved by "Confirmed v3 Business Direction, 6. Stock / Allocation":

- representation of unallocated / shortage quantity (computed from allocation records)
- initial handling of new stock (Admin allocates manually; no automatic allocation)
- Stage 2 allocation of currently securable stock only

Resolved by "Confirmed v3 Business Direction, 7-10":

- role of `PAID` (removed from the Order lifecycle) and the Admin manual `PENDING -> PAID` action (removal target)
- Payment records without an Order and their linkage at Stage 2
- direction of Payment reversal for `PENDING` cancellation and for finalize failure
- payment model: original payment (`payments`) vs reversal history (child table), `payments.status` set,
  and the reversal amount invariant

Resolved by "Confirmed v3 Business Direction, 12-14":

- stock model (physical `current_stock` plus `reserved_stock` reservation, consume at `PROCESSING` entry),
  including the stock effect of a pre-shipment Refund (explicit restock)
- Stage 1 -> Stage 2 handoff, finalize trigger roles, one Order per `payment_id`, price-mismatch policy
- SOLD_OUT representation, Ware-less Variant orderability, Multi-Ware initial order
- initial v3 scope: Point payment excluded, authorize/capture excluded, PWA limited to the core scope

Resolved by "Confirmed v3 Business Direction, 11":

- Cancel/Refund boundary, Cancel after `PROCESSING` (not allowed), partial Cancel (not supported initially),
  mixed cancel/refund (not possible by construction), Admin Cancel scope (`PENDING` only)
- Refund eligibility by Order status
- Refund and Restock for unallocated OrderItems (not possible in the normal lifecycle)

Implementation design (not business decisions): synchronization of `reserved_stock` with the allocation rows and
conversion of existing v2 stock data, the structure that guarantees one Order per `payment_id`,
production PG endpoints and webhook signature verification, the orphan-Payment detection job,
retry history of a reversal (same row or an attempt table),
whether to keep a raw PG callback/webhook log, database enforcement of the reversal invariants
and of the cumulative Refund quantity invariant, the transaction structure of Refund approval + reversal creation,
detailed reversal states beyond `PENDING` / `SUCCEEDED` / `FAILED`.

Record these in `BUSINESS_LOGIC_AND_SCENARIOS.md`.

---

# Domain Coupling Rules

Treat these as one connected lifecycle:

- Product / ProductPost / Variant
- Cart
- Checkout
- PG / Payment
- Order
- OrderItem
- Warehouse / Ware
- stock / allocation
- Cancel
- Refund
- Refund approval
- Restock
- Point

Do not change one of these domains in isolation without tracing the effect on the others.

Examples:

Changing Order creation can affect:

- stock allocation
- cancellation restoration
- refund quantity limits
- refund restock
- payment retry
- seller processing
- Client status display

Changing allocation semantics can affect:

- cancel
- restock
- shortage handling
- Multi-Ware
- refund safety

---

# Current Known v2 Conflicts

These are known examples. Re-check current code before editing.

## Inventory shortage

Current v2 behavior historically observed:

- `create_order_from_cart` can fail when stock is insufficient
- transaction rolls back
- Order is not created

v3 approved policy:

- numeric stock shortage alone must not block real Order creation

Classification:

`CONFLICT`

## Full allocation assumption

Current v2 behavior was designed around fully allocated OrderItems.

v3 allows:

- ordered quantity > immediately allocated quantity

Classification:

`CONFLICT`

The replacement model is approved in "Confirmed v3 Business Direction, 6. Stock / Allocation"
(`shortage_quantity = OrderItem.quantity - allocated_quantity`). Implementation details remain open.

## PENDING cancellation

Current v2 has Consumer PENDING cancellation.

v3 additionally requires:

- Admin/seller PENDING cancellation/rejection
- duplicate/concurrent cancellation safety

Classification:

`CONFLICT / DECISION NEEDED`

---

# Supabase Architecture Rules

The current architecture uses:

- Supabase Auth
- RLS
- RPC
- Next.js Route Handlers for privileged server operations where needed

General rules:

- prefer owner-scoped direct Supabase access when RLS is sufficient
- keep service-role/secret usage server-only
- never expose `SUPABASE_SECRET_KEY` to browser code
- do not bypass RLS to simplify UI work
- inspect RPC grants and RLS before permission changes
- do not reintroduce broad legacy Express/API architecture

Before adding a privileged Route Handler, verify that direct RLS/RPC is insufficient.

---

# Environment Rules

Do not copy env sets blindly between apps.

Search actual code usage first.

Known current example:

## client-pwa

Uses:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Does not currently use:

- `SUPABASE_SECRET_KEY`
- `PG_TEST_ENDPOINT_URL`
- `PG_TEST_API_KEY`

The PWA previously had incorrect Vercel Production Supabase env values. That was a deployment configuration issue, not a reason to add unused secrets.

For `client-web` and `user-web`, inspect actual code paths before changing env.

---

# Production Data Rules

Do not mutate production data unless explicitly authorized.
The "Safety Rules" section above also applies to production schema and migrations.

This includes:

- deleting test Orders
- deleting test Products
- changing ProductPost publication
- changing Ware stock
- changing user roles
- changing payment/refund records

Analysis and read-only SQL are allowed when requested.

For destructive SQL:

- explain what it changes
- scope it narrowly
- require explicit approval when appropriate

---

# Migration Rules

For DB/RPC changes:

1. inspect current schema
2. inspect applied migrations
3. inspect relevant design SQL
4. identify v3 policy requirement
5. create a forward migration
6. do not rewrite applied production migrations as new truth
7. inspect grants/RLS
8. consider concurrency and locking
9. validate failure behavior
10. document only after verification

Validate the full local migration chain with `pnpm supabase db reset`, then report the migration as ready.
Do not apply it to the linked/production database; that requires an explicit instruction
(see "Safety Rules" above).

Pay special attention to concurrency for:

- final Order creation
- cancel/reject
- payment completion
- refund request
- restock
- Point ledger operations

Known concern from v2 audit:

- concurrent refund requests may require stronger row locking

Do not assume it is fixed unless verified.

---

# Application Editing Rules

Before editing:

- inspect relevant call path
- identify UI -> API/RPC -> DB path
- identify current business rule
- compare with approved v3 rule
- list affected files
- make the smallest coherent change

Avoid:

- unrelated refactors
- broad renames
- formatting entire files unnecessarily
- deleting code only because it looks old
- lockfile changes without dependency changes
- modifying all three apps when only one is affected

---

# client-pwa

The current client-pwa is known to be less production-polished than client-web.

Known follow-ups include:

- UUID shown as "order number"
- development/test-oriented messages
- one-page/tab architecture
- limited order flow
- duplicate submission UX
- final feature scope not decided

Do not broadly rewrite client-pwa until the v3 business logic and final PWA scope are approved.

---

# Validation Rules

Run the narrowest useful verification first.

Possible validation:

- targeted typecheck
- lint
- focused unit/integration tests
- SQL/RPC verification
- `git diff --check`
- app production build
- focused E2E

Never claim:

- typecheck passed
- build passed
- E2E passed
- production verified

unless that exact verification was actually performed.

When a test is inferred from code only, say:

`code-level verification only`

When observed in production, distinguish it as:

`production E2E observed`

---

# Documentation Rules

Documentation must distinguish:

- approved business policy
- current implementation
- observed E2E result
- code-only inference
- unresolved policy

Do not mark a checkbox PASS from indirect evidence unless the document explicitly allows that.

Do not rewrite v2 historical docs to match v3.

For v3 docs:

- approved policy goes in `docs/mall1/v3/*`
- implementation status must follow actual code
- test status must follow actual verification

---

# Commit Rules

Do not commit unless asked or unless the task explicitly includes commit/push.
A Git push never authorizes a database operation (see "Safety Rules" above).

Before commit:

- review diff
- run relevant checks
- ensure unrelated user changes are preserved

When reporting a commit, include:

- changed files
- validation actually run
- commit hash
- push status

---

# Reporting Format

For substantial analysis, prefer:

## Inspected
- files / RPC / migrations / routes

## Findings
- `CONFIRMED`
- `CONFLICT`
- `DECISION NEEDED`

## Impact
- affected DB/RPC/UI

## Proposed next step
- smallest next action

For implementation:

## Changed
- file
- purpose

## Validation
- exact commands
- result

## Remaining
- unresolved items
- unverified behavior

---

# Immediate Project Sequence

Do not start broad v3 implementation yet.

Current sequence:

1. finalize `AGENTS.md`
2. finalize `CLAUDE.md`
3. create `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md`
4. resolve major business decisions
5. create `docs/mall1/v3/PHASES.md`
6. perform code/schema impact analysis
7. implement v3 phase by phase
8. run clean production E2E from approved scenarios

The next major task after this file is:

`docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md`
