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
| Production data precheck | **run 2026-09-27, `production read-only observed`; approved by the user**: BLOCKER 0, WARN 0, the v2 baseline is as expected (section 3.1) |
| Decisions #1 to #3 (business/data) | **approved by the user (2026-09-27)**; #1 needs the target list shown before it is applied (`v3_preview_unpaid_legacy_orders.sql`) |
| PG reversal adapter | **only the PG Test simulation exists.** Not a blocker for the PG test cutover; **a blocker for a real-money production release** (no real PG adapter) |
| Scheduler for the reconcile job | **prepared, disabled**: `.github/workflows/reconcile.yml` (GitHub Actions, 5 minutes); skipped until the repository variable `RECONCILE_ENABLED` is `true` (section 3.3). Verified against a local mock only |
| Backup gate (step 0) | **procedure verified** (`v3_backup_and_verify.sh`, `production read-only observed`: pg_dump of production, restore into a local scratch database, 53 tables with identical row counts, equal fingerprints). The Supabase platform has **no backup and PITR is off** (`supabase backups list`), so this dump is the only rollback data; it must be re-taken right before the window |

Verdict: **the Phase 9 gate is not PASS.** Remaining production blockers before the PG test cutover (the production precheck and the unpaid-legacy-Order target check are done, section 3.1): the production environment variables, the reconcile scheduler, Supabase backup availability, the v3 deployment, and the user's explicit cutover approval. The exact read-only procedure is `docs/mall1/v3/PRECHECK.md`. A **real-money launch stays FAIL** until a real PG reversal adapter exists.

---

## 2. Decisions (Phase 9)

| # | Decision | Status | Where |
|---|---|---|---|
| 1 | Legacy PENDING/PAID Orders without payment evidence (unpaid v2 Orders, hand-marked PAID) are **cancelled** at the cutover with the v2 stock semantics (the allocated quantity returns to `current_stock`) and an internal note; **no Payment is created**. The target Orders and quantities are **shown to the user before anything is applied** (`v3_preview_unpaid_legacy_orders.sql`) | **approved 2026-09-27** | `v3_resolve_unpaid_legacy_orders.sql` |
| 2 | DN-42 Refund window: **none** in the initial v3 (as in v2); re-reviewed after operation as a separate policy | **approved 2026-09-27** | no code |
| 3 | DN-46 seller-initiated Refund: the **Admin creates the Refund request on behalf of the Client** (any status from PROCESSING on), then the ordinary approval + reversal + explicit restock. Cancel stays refused after PROCESSING. No separate seller-failure workflow. The Admin-initiated fact is kept (`refund_requests.initiated_by = 'ADMIN'`) | **approved 2026-09-27; implemented** | `admin_create_refund_request`, `POST /api/admin/orders/[id]/refund`, Admin panel button |
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

Result on production (`production read-only observed`, 2026-09-27; the three read-only scripts of `PRECHECK.md`, each inside `begin read only; ... commit;`; approved by the user):

| Item | Result |
|---|---|
| last migration | `20260925150000` (the expected v2 baseline); none of the 5 v3 objects exists; Wares with `reserved_stock <> 0`: 0 |
| BLOCKER | 0 (duplicate `pg_callback_id`, refund status, over-refund, reserved stock: all 0) |
| WARN | 0 (allocation mismatch, PENDING payments, paid-but-cancelled, Point mismatch: all 0) |
| ACTION | 3 unpaid PENDING Orders (no PAID Order without a Payment) |
| INFO | 7 Orders (CANCELLED 1, PAID 3, PENDING 3); 2 historical APPROVED Refunds, 0 open REQUESTED; 2 Wares, total `current_stock` 114; 0 Ware-less Variants; 2 Point top-ups |

Approved cutover targets (decision #1, approved by the user 2026-09-27; all three cancelled, no Payment created, the existing allocation returned to `current_stock`):

| Order | Status | Ordered | Allocated |
|---|---|---|---|
| `ORD-20260925165934-EBA4C2DF` | PENDING | 2 | 2 |
| `ORD-20260926055734-4DD4F73E` | PENDING | 3 | 3 |
| `ORD-20260926105646-D3B1D14E` | PENDING | 1 | 1 |

Expected stock effect: 6 returns to `P8-WARE-1`, `current_stock` 3 → 9. Scope of the approval: these three Orders only. The preview is run again just before the window; any other unpaid Order that appears then needs its own approval, and a result that differs from this table (Orders, quantities, stock) is a stop.

An earlier attempt failed on authentication because it used a credential from before the `.env` was updated; the current connection succeeded (not a data finding).

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

`POST /api/internal/reconcile` with `Authorization: Bearer <RECONCILE_JOB_SECRET>` every 5 minutes. It reverses orphan payments and executes PENDING reversals. Not scheduled = orphan payments and unsettled reversals wait for a manual call.

Decided by the user (2026-09-27): **GitHub Actions `schedule`**, not Vercel Cron. Vercel Cron only sends GET with its own `CRON_SECRET`, while the route is POST with `RECONCILE_JOB_SECRET`; no GET handler is added.

- Workflow: `.github/workflows/reconcile.yml` (`*/5 * * * *`, plus `workflow_dispatch`). GitHub runs schedules from the default branch on a best-effort clock, so a run can be a few minutes late.
- **Disabled by default:** the job runs only when the repository variable `RECONCILE_ENABLED` is exactly `true`. It is enabled at step 8 of the cutover and nowhere before.
- Secrets to set in the repository (values are never printed): `CLIENT_WEB_URL` (the client-web production base URL) and `RECONCILE_JOB_SECRET` (the same value as the server variable, at least 24 characters).
- Verified locally only (`local rehearsal`): the workflow YAML parses; its `run` script, executed against a local mock, returns the counts with the right secret, fails on a 401 with a wrong secret, and refuses to run with a missing secret. It has not run on GitHub.

### 3.4 What cannot be audited from here

Production row counts and anomalies are audited (section 3.1). Still not audited: the Vercel project settings (Vercel access is not yet authorized in this session), the GitHub repository secrets and variable, and a real PG cancel API. Supabase backup availability was read: no platform backup, PITR off.

---

## 4. Cutover order (a maintenance window)

Prepared in advance (no customer impact): the v3 deployment of `main` built with `NEXT_PUBLIC_MALL_V3=true` and the server variables above, **not promoted**; the current v2 deployment stays live and is the rollback target.

| Step | Action | Verify | Rehearsal time |
|---|---|---|---|
| T-1 | Read-only checks on production (`PRECHECK.md`: state, precheck, unpaid-Order preview); the scheduler and secrets are ready; the user approves the cutover | BLOCKER = 0; the unpaid-Order list is shown and accepted | |
| 0 | **Mandatory gate.** `bash supabase/cutover/v3_backup_and_verify.sh`: pg_dump of production (read only), restore into a local scratch database, compare the row counts of every `public`/`auth` table and the orders/payments/stock fingerprints. The dump stays local (`~/mall-v3-backups`, `*.dump` is gitignored, never committed) | any restore error, count or fingerprint mismatch **stops the cutover** | seconds (dump ~0.5 MB) |
| 1 | Apply the additive migrations (v2 keeps working; can be done days earlier) | v2 smoke passes; `v3_phase*` object checks | ~2 s |
| — | **Window opens.** Announce; no new v2 orders | | |
| 2 | `v3_resolve_unpaid_legacy_orders.sql` (the target list and quantities were shown at T-1 and re-run just before) | unpaid count 0; stock restored | < 1 s |
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

Done (2026-09-27): the production precheck (BLOCKER 0, WARN 0) and the unpaid legacy Order target check (3 Orders, approved; section 3.1).

Done (2026-09-27): the scheduler workflow is prepared and disabled (section 3.3); the backup gate procedure is verified (step 0; the platform itself has no backup and PITR is off, so the pre-window dump is the only rollback data).

Before the PG test cutover (open; the procedure is `PRECHECK.md`):
1. The production environment variables confirmed (section 3.2): needs Vercel access (not yet authorized here) or the user's own check.
2. The GitHub repository secrets `CLIENT_WEB_URL` and `RECONCILE_JOB_SECRET` set, and `RECONCILE_ENABLED` left unset.
3. The v3 deployment (`NEXT_PUBLIC_MALL_V3=true`, not promoted) prepared: needs Vercel access.
4. The user's explicit cutover approval.

The Phase 9 status is **not** `READY FOR CUTOVER` until items 1 to 3 are confirmed.

For a real-money production release only: **a real PG reversal adapter**. It is not a blocker for the PG test cutover.

Decisions #1 to #3 are approved (2026-09-27).
