# Mall v3 — Production cutover plan and release readiness

Status: Phase 9, prepared 2026-09-27. **Nothing in this document has been applied
to production.** Production DB migrations, the cutover, and the production flag
change run only on the user's explicit instruction. Results are labelled
`local rehearsal` (a local Supabase stack, the real scripts, the real v2 RPCs) or
`production E2E observed` (none yet).

---

## 1. Gate (short)

| Area | State |
|---|---|
| v3 domain paths (Phases 1 to 8) | verified locally; all suites pass |
| Cutover scripts, precheck, post-check, rehearsal | verified on the local stack (`local rehearsal`: every step check plus the v3 suites on the cut-over database) |
| Production data precheck | **not run** (needs the user to run `v3_precheck_v2_baseline.sql`, or an explicit instruction) |
| Decisions #1 to #3 (business/data) | recommended below, **awaiting the user's approval** |
| PG reversal adapter | **only the PG Test simulation exists.** Acceptable for PG test mode (no real money); **no real PG adapter**: a real-money launch is blocked |
| Scheduler for the reconcile job | not configured (deployment setting; needs the user) |

Verdict: the cutover into **PG test mode** is ready to be scheduled once the user approves decisions #1 to #3, runs the precheck, and configures the environment and scheduler in section 6. A **real-money launch is FAIL** until a real PG reversal adapter exists.

---

## 2. Decisions (Phase 9)

| # | Decision | Status | Where |
|---|---|---|---|
| 1 | Legacy PENDING/PAID Orders without payment evidence (unpaid v2 Orders, hand-marked PAID) are **cancelled** at the cutover with the v2 stock semantics (the allocated quantity returns to `current_stock`) and an internal note; nothing is paid or invented. The precheck lists them first. A different resolution (for example registering a manual payment) needs the user's decision before the cutover | **recommended; needs approval** | `v3_resolve_unpaid_legacy_orders.sql` |
| 2 | DN-42 Refund window: **none** in the initial v3 (as in v2); revisit after release | **recommended; needs approval** | no code |
| 3 | DN-46 seller-initiated Refund: the **Admin creates the Refund request on behalf of the Client** (any status from PROCESSING on), then the ordinary approval + reversal + explicit restock. Cancel stays refused after PROCESSING. No separate seller-failure workflow | **recommended; needs approval; implemented** | `admin_create_refund_request`, `POST /api/admin/orders/[id]/refund`, Admin panel button |
| 4 | Orphan window: **30 minutes** (`ORPHAN_MIN_AGE_MINUTES`, default 30) | decided (operational) | reconcile job |
| 5 | Reversal reprocessing: a **PENDING** reversal is executed automatically by the reconcile job (lease-guarded, at most 5 automatic attempts); a **FAILED** reversal is never retried automatically — an Admin retries it (actor recorded); reversals that need attention are listed by `GET /api/admin/reversals` | decided (operational); implemented | `POST /api/internal/reconcile` |
| 6 | Production PG reversal adapter: the only PG today is the **PG Test recorder** (no cancel API). The adapter is chosen by `PG_REVERSAL_ADAPTER`: `simulated` (PG test mode) settles reversals locally; **unset** selects the production placeholder, whose outcome is unknown, so reversals stay PENDING and nothing is marked settled by mistake. A real PG adapter is a prerequisite for real money | decided; **real adapter: not ready** | `lib/payment/reversal.ts` |
| 7 | Point: the UI stays hidden; the tables, `create_payment` / `complete_payment` (POINT_TOPUP only after the contraction), and existing balances are **kept**. Removal is decided after the release (not before 30 days of stability) | decided | contraction SQL |
| 8 | `payments.order_id`: **kept** as the mirrored direction of `orders.payment_id` (both are set in one transaction and a trigger forbids disagreement). Removal is a post-release migration, not part of the cutover | decided | migrations |
| 9 | `pg_callback_id` duplicates: a **BLOCKER** in the precheck; the unique index is created by the Phase 1 migration and would fail otherwise. Resolution if any: the user decides which duplicate keeps its reference | decided (gate) | `v3_precheck_v2_baseline.sql` |
| 10 | Cutover order and rollback criteria: sections 4 and 5 | decided | this document |

Legacy data rules that follow: historical v2 APPROVED Refunds stay as they are
(v2 created no reversal and moved no money; none is invented); open v2 REQUESTED
Refunds are approved the v3 way with a reversal; in-flight PENDING v2 payments
stay PENDING and cannot be completed through the v3 path.

---

## 3. Production readiness audit

### 3.1 Data (read-only, run on production BEFORE anything else)

`supabase/cutover/v3_precheck_v2_baseline.sql` — one SELECT on v2 tables only.

| Check | Level | Expected before the cutover |
|---|---|---|
| duplicate `pg_callback_id` | BLOCKER | 0 |
| Refund requests outside REQUESTED/APPROVED/REJECTED | BLOCKER | 0 |
| OrderItems refunded above their quantity | BLOCKER | 0 |
| Wares with `reserved_stock <> 0` | BLOCKER | 0 |
| PENDING/PAID Orders without a succeeded Payment | ACTION | listed; resolved by step 3 (decision #1) |
| allocation not equal to quantity, PENDING payments, paid-but-cancelled, Point mismatch | WARN | look at each |
| Orders by status, historical APPROVED Refunds, open Refunds, Wares, Ware-less Variants | INFO | context |

Result on production: **not run.** The local rehearsal dataset produced 0 BLOCKER and 2 ACTION rows, as designed.

### 3.2 Environment (per app)

| App | Variable | Value at cutover | Note |
|---|---|---|---|
| client-web, user-web, client-pwa | `NEXT_PUBLIC_MALL_V3` | `true` **only in the prepared v3 deployment**; unset in the current production | build-time |
| client-pwa | `NEXT_PUBLIC_CLIENT_WEB_URL` | the client-web production URL | order hand-off |
| client-web, user-web | `PG_REVERSAL_ADAPTER` | `simulated` (PG test mode) | unset = reversals stay PENDING |
| client-web | `RECONCILE_JOB_SECRET` | a random secret of at least 24 characters, server-only | unset = the job returns 503 |
| client-web | `ORPHAN_MIN_AGE_MINUTES` | optional, default 30 | |
| client-web, user-web | existing `SUPABASE_SECRET_KEY`, `PG_TEST_*` | unchanged | |

Never put `RECONCILE_JOB_SECRET` or `SUPABASE_SECRET_KEY` in a `NEXT_PUBLIC_*` variable.

### 3.3 Scheduler

`POST /api/internal/reconcile` with `Authorization: Bearer <RECONCILE_JOB_SECRET>` every 5 minutes (a Vercel Cron or any external scheduler; a deployment setting, not created here). It reverses orphan payments and executes PENDING reversals. Not scheduled = orphan payments and unsettled reversals wait for a manual call.

### 3.4 What cannot be audited from here

Production row counts and anomalies (section 3.1), the Vercel project settings, the scheduler, backup availability (Supabase plan / PITR), and a real PG cancel API.

---

## 4. Cutover order (a maintenance window)

Prepared in advance (no customer impact): the v3 deployment of `main` built with `NEXT_PUBLIC_MALL_V3=true` and the server variables above, **not promoted**; the current v2 deployment stays live and is the rollback target.

| Step | Action | Verify | Rehearsal time |
|---|---|---|---|
| T-1 | Precheck on production; the user approves decisions #1 to #3; the scheduler and secrets are ready | BLOCKER = 0 | |
| 0 | Backup; restore it into a scratch database and compare counts | counts equal | ~2 s locally |
| 1 | Apply the additive migrations (v2 keeps working; can be done days earlier) | v2 smoke passes; `v3_phase*` object checks | ~2 s |
| — | **Window opens.** Announce; no new v2 orders | | |
| 2 | `v3_resolve_unpaid_legacy_orders.sql` (review the printed Orders first) | unpaid count 0; stock restored | < 1 s |
| 3 | `v3_stock_and_sellability.sql`, then `v3_stock_consistency_check.sql` | the check returns no row | < 1 s |
| 4 | `v3_legacy_contraction.sql` | refuses on any guard | < 1 s |
| 5 | `v3_postcheck.sql` | every row ok | < 1 s |
| 6 | Promote the prepared v3 deployment (all three apps) | pages load; `NEXT_PUBLIC_MALL_V3` is on | minutes |
| 7 | Production E2E (section 7), smoke set first | | |
| 8 | Enable the scheduler | first run returns counts | |
| — | **Window closes.** | | |

Steps 2 to 4 are single-transaction scripts; each refuses and changes nothing when a guard fails. From step 4 the v2 apps are broken until step 6, so the gap between them is the ordering downtime.

## 5. Rollback

**Before step 2** (only additive migrations applied): nothing to roll back; v2 keeps working. Leave the objects in place.

**Point of no return: the first real v3 order (or refund) after step 6.** Before it, a rollback is clean:
1. Promote the previous v2 deployment (Vercel rollback).
2. Restore the verified backup (Supabase restore / PITR to the time before step 2).
3. Re-run the v2 smoke set.

**After it**, restoring would lose real v3 orders; rollback then means a forward fix, decided by the user.

Rollback criteria (any one, during the window or the first hour):
- a guard refuses, or any `v3_postcheck.sql` row is false;
- any smoke E2E step in section 7 fails on a core path (checkout, finalize, cancel, PROCESSING, refund);
- the Consumer boundary check (BR-20) finds stock, allocation, shortage, Ware, or reversal detail in a Consumer response;
- a stock invariant breaks (`reserved > current`, negative stock, a Payment reversed above its amount);
- the reconcile job or executor errors repeatedly (5xx) or settles a reversal in a mode that was not intended.

## 6. Local rehearsal (`local rehearsal`)

`bash supabase/rehearsal/v3_cutover_rehearsal.sh` — local database only (`--local`; nothing can reach a linked project). Result: **PASSED**.

Order rehearsed: v2 baseline reset → seed through the real v2 RPCs (a delivered + refunded Order, a paid Order in PROCESSING with an open Refund request, a cancelled Order, an unpaid PENDING Order, a hand-marked PAID Order, Point top-up, payments in every status) → precheck (0 BLOCKER, 2 ACTION) → backup + restore into a scratch database (counts equal) → additive migrations (existing data untouched) → the contraction refuses while unpaid Orders exist (nothing changed) → resolve → stock conversion (consistency check empty) → contraction → post-check (all rows ok) → the legacy data through the v3 paths (12 scenarios) → the v3 suites on the cut-over database (checkout flow, Phase 4/5/7 HTTP routes, the reconcile job, Phase 4 to 7 concurrency).

Not rehearsable locally: a Supabase platform restore (only the backup's validity is checked), Vercel promotion, the scheduler, a real PG.

## 7. Production E2E checklist (to run after step 6; PG test mode)

Accounts: 1 Admin and 2 Clients (A, B). Data: a test Product with 2 Variants (Variant 1 linked to a Ware with stock 10, Variant 2 with no Ware), a published ProductPost. Record the Ware's `current/reserved` before and after every step. Mark each result `production E2E observed`.

**Smoke set (run first; any failure is a rollback signal)**

| # | Step | Expected |
|---|---|---|
| 1 | Client A: Cart 2 × Variant 1, checkout, pay (test success), finalize | Order `PENDING`, order number `ORD-…`, Ware `10/2`; Cart line removed |
| 2 | Client A: reload `/payment` before finalize (repeat once with a paid Payment) | resumes; still one Order |
| 3 | Client A: cancel that Order | `CANCELLED`; Ware `10/0`; one `ORDER_CANCEL` reversal reaches `SUCCEEDED` (simulated), Payment still `SUCCEEDED` |
| 4 | Client B: order 6, Client A: order 6 on a Ware of 10 | both `PENDING`; second has shortage 2 (Admin sees it), Ware `10/10` |
| 5 | Admin: `PROCESSING` on the shortage Order | refused; on the full Order accepted: Ware `4/4` |
| 6 | Admin: additional allocation after restock/adjust | shortage 0; then `PROCESSING` |
| 7 | Client: refund 2 of 6 after `PROCESSING`; Admin approves | request `REQUESTED`→`APPROVED`, one `REFUND` reversal, Order status unchanged, Ware unchanged until the explicit restock |
| 8 | Admin: restock 2 into the original Ware | `current` +2 only; a third restock refused |
| 9 | Consumer network check | no stock / Ware / allocation / shortage / reversal fields in any Client response (BR-20) |
| 10 | Client B cannot read or cancel Client A's Order | 404 / empty |

**Full set**: S-03 (Ware-less Variant orders, full shortage), S-04 / S-07 (sold-out before and after PG success: refused, then reversed), S-06 (price changed after payment: no Order, full reversal), S-08 (PG failure then retry as a new Payment), S-10 / S-11 (double click / reload: one Order), S-14 (Client and Admin cancel together: one cancel), S-19 (partial refunds and the cumulative limit), S-26 (orphan: stop after PG success, the reconcile job reverses it after 30 minutes), S-27 (reversal failure and Admin retry), the seller-initiated Refund on a `SHIPPED` Order, PWA hand-off and lookup by order number, Admin overview counts.

## 8. Remaining blockers

1. The user's approval of decisions #1 to #3.
2. The production precheck result (section 3.1).
3. Environment and scheduler set up (sections 3.2, 3.3) and the v3 deployment prepared, not promoted.
4. **A real PG reversal adapter** for any real-money launch (test-mode cutover does not need it).
5. Backup availability confirmed on the Supabase plan.
