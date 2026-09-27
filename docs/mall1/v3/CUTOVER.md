# Mall v3 — Production cutover plan and release readiness

> **On hold (V4-D03, 2026-09-27):** the v3 production cutover is **not executed** until V4 Phase 1 and the Phase 1.5 Data Protection Gate are complete. This plan is re-issued at V4 Phase 2 together with the Phase 1 migrations (`docs/mall1/v4/PHASES.md`). Everything below stays as the record of the v3 plan and of what was verified; nothing in it has been applied to production.

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
| Scheduler for the reconcile job | **prepared, not scheduled**: Supabase Cron (`pg_cron`) runs the orphan job in the database and, through `pg_net` with the secret in Supabase Vault, calls the reversal sweeper route (section 3.3). The migration schedules nothing; the jobs are created by a separate cutover script (step 8). Verified on the local stack only (`local rehearsal`); GitHub Actions and Vercel Cron are not used |
| Backup gate (step 0) | **procedure verified** (`v3_backup_and_verify.sh`, `production read-only observed`: pg_dump of production, restore into a local scratch database, 53 tables with identical row counts, equal fingerprints). The Supabase platform has **no backup and PITR is off** (`supabase backups list`), so this dump is the only rollback data; it must be re-taken right before the window |

Verdict: **the Phase 9 gate is not PASS and the status is not `READY FOR CUTOVER`.** Nothing has been applied to production: no production migration, no cutover, no legacy Order resolution, no stock conversion, no scheduler activation, no production flag. Remaining before the PG test cutover: the run-time v3 flag check of the client-web and user-web Previews, the user's explicit cutover approval (section 8), and the promotion of the prepared Preview deployments at the cutover step. The exact read-only procedure is `docs/mall1/v3/PRECHECK.md`. A **real-money launch stays FAIL** until a real PG reversal adapter exists.

---

## 2. Decisions (Phase 9)

| # | Decision | Status | Where |
|---|---|---|---|
| 1 | Legacy PENDING/PAID Orders without payment evidence (unpaid v2 Orders, hand-marked PAID) are **cancelled** at the cutover with the v2 stock semantics (the allocated quantity returns to `current_stock`) and an internal note; **no Payment is created**. The target Orders and quantities are **shown to the user before anything is applied** (`v3_preview_unpaid_legacy_orders.sql`) | **approved 2026-09-27** | `v3_resolve_unpaid_legacy_orders.sql` |
| 2 | DN-42 Refund window: **none** in the initial v3 (as in v2); re-reviewed after operation as a separate policy | **approved 2026-09-27** | no code |
| 3 | DN-46 seller-initiated Refund: the **Admin creates the Refund request on behalf of the Client** (any status from PROCESSING on), then the ordinary approval + reversal + explicit restock. Cancel stays refused after PROCESSING. No separate seller-failure workflow. The Admin-initiated fact is kept (`refund_requests.initiated_by = 'ADMIN'`) | **approved 2026-09-27; implemented** | `admin_create_refund_request`, `POST /api/admin/orders/[id]/refund`, Admin panel button |
| 4 | Orphan window: **30 minutes**, fixed in the database function `reconcile_orphan_payments()` (no environment variable) | decided (operational) | reconcile scheduler migration |
| 5 | Reversal reprocessing: a **PENDING** reversal is executed automatically by the reversal sweeper (lease-guarded, at most 5 automatic attempts); a **FAILED** reversal is never retried automatically — an Admin retries it (actor recorded); reversals that need attention are listed by `GET /api/admin/reversals` | decided (operational); implemented | `POST /api/internal/reconcile` (called by Supabase Cron, section 3.3) |
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
| client-web | `RECONCILE_JOB_SECRET` | a random secret of at least 24 characters, server-only; **the same value as the Vault entry `reconcile_job_secret`** (section 3.3) | unset = the sweeper route returns 503 |
| client-web | existing `SUPABASE_SECRET_KEY`, `PG_TEST_ENDPOINT_URL`, `PG_TEST_API_KEY` | unchanged | |
| user-web | existing `SUPABASE_SECRET_KEY` | unchanged (user-web does not read `PG_TEST_*`; checked in the code) | |

Never put `RECONCILE_JOB_SECRET` or `SUPABASE_SECRET_KEY` in a `NEXT_PUBLIC_*` variable.

**Vercel state (2026-09-27, names and scopes only, values never read; `production Vercel observed` through the Vercel MCP).** A Preview deployment that is later promoted is not rebuilt, so its Preview-scope variables are what production will run: every variable of the table must exist in the **Preview** scope.

Preview scope, re-read after the user entered the secrets: **all required variables have the Preview scope** (client-web: `RECONCILE_JOB_SECRET`, `NEXT_PUBLIC_MALL_V3`, `PG_REVERSAL_ADAPTER`, `SUPABASE_SECRET_KEY`, `PG_TEST_ENDPOINT_URL`, `PG_TEST_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; client-pwa: `NEXT_PUBLIC_CLIENT_WEB_URL`, `NEXT_PUBLIC_MALL_V3`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; user-web: `NEXT_PUBLIC_MALL_V3`, `PG_REVERSAL_ADAPTER`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). The Preview env blocker is resolved.

**Incident (2026-09-27): the Production scope had been extended on the v3 switches, and the production PWA was rebuilt with the v3 flag on. Both are fixed.**

1. `NEXT_PUBLIC_MALL_V3=true` (all three projects), `PG_REVERSAL_ADAPTER` (client-web, user-web) and client-pwa `NEXT_PUBLIC_CLIENT_WEB_URL`, created Preview-only, were edited to also carry the Production scope. `NEXT_PUBLIC_MALL_V3` is read at build time, so any production build made while it has the Production scope compiles the v3 code paths against the still-v2 database. On the user's instruction only the Production scope of those six variables was removed (values untouched, no other variable edited); the re-read showed the six Preview-only and `NEXT_PUBLIC_MALL_V3` absent from the Production scope of all three projects (`production Vercel observed`).
2. Before that fix, a client-pwa **production** deployment `dpl_EJnE6sjYm5dvFoy3wEc2sXGpjtkk` (source `redeploy` of commit `c69891f`) was built and aliased to the production domains. Its public bundle contained the v3 hand-off UI and no v2 order text (`production observed`, public GET of the bundle): the production PWA ran with the v3 flag on, its order form replaced by a link to the client-web `/order`. No database write path is involved. The client-web redeploy `dpl_5Q77pdp2Uz5kddN8a9jdnRYBgzqG` was created before client-web `NEXT_PUBLIC_MALL_V3` got the Production scope (env timeline only; **not bundle-verified**). No user-web production build was made.
3. **Rollback (on the user's instruction):** client-pwa production was rolled back to the earlier good deployment `dpl_5w35LXi6xoamjrYBXpFxSymzispr` (no new build, no redeploy). Re-read: its aliases (`…-teal`, `…-andoricano`, `…-git-main-andoricano`.vercel.app) point to it, and no production deployment was created after the rollback. The public production bundle changed (chunk `0c2jcwfs8t2ce.js` to `2f13ik8yujrhv.js`), reads the flag at run time (`"true"===process.env.NEXT_PUBLIC_MALL_V3`, unset in the browser, so false) and contains the v2 order text again: **v2 bundle restored** (`production observed`, bundle check only; no screen was clicked through). client-web and user-web production were not touched.

Rule that follows: never redeploy or push `main` while `NEXT_PUBLIC_MALL_V3` has the Production scope; it is added to production only at the cutover, by decision. (`RECONCILE_JOB_SECRET` with Production scope is expected: it is the server secret and has no effect until the sweeper is scheduled.)


**Preview deployments (2026-09-27, branch `v3-preview`, commit `f8a6ccb`, pushed as a non-`main` branch; `main` is not pushed; `production Vercel observed`).** All three were created by the Git integration (source `git`, target none = Preview) and are **not promoted**:

| Project | Deployment | State | What is verified about the v3 flag |
|---|---|---|---|
| client-pwa | `dpl_FDY1tBc5BRximZ6Cs9HbgLrXD1ED` | READY | **applied**: the Preview bundle contains the v3 hand-off UI and no v2 order text (bundle check) |
| client-web | `dpl_CcNxX6fCUg2EKnFQQYizMZn5adGC` | READY | **not verified at run time**: READY and the Preview env variables (section above) are set; `route.ts` of `/api/internal/reconcile` is in the deployed commit (code level; the route was not called and the deployment file tree is not readable for a Git deployment) |
| user-web | `dpl_mACbFTcssbSeZbk3YGZWvuVAj5Cp` | READY | **not verified at run time**: READY and the Preview env variables are set; the URL answers 302 (treated as the authentication redirect, nothing more checked) |

No write E2E was run on any Preview. Which Supabase the Preview builds point at is not read (`NEXT_PUBLIC_SUPABASE_URL` is a sensitive variable): treat a Preview as production-facing and keep it to smoke checks until the migrations are applied. The production `*.vercel.app` URL of client-web is publicly reachable (the reconcile route answers 405 to a GET), so `pg_net` can call it; Preview URLs are behind Vercel Authentication.


**Cleanup candidates (recorded, not done):** the client-pwa project holds `SUPABASE_SECRET_KEY`, `PG_TEST_API_KEY`, `PG_TEST_ENDPOINT_URL` in Production, although client-pwa reads none of them (code check); `PG_TEST_API_KEY` there is an `encrypted`-type variable that Vercel flags `readable-secret`. Decide after the release; nothing is deleted in this phase.

### 3.3 Scheduler (Supabase Cron)

Decided by the user (2026-09-27): **Supabase `pg_cron` + `pg_net` + Vault**. GitHub Actions and Vercel Cron are not used, and the earlier GitHub Actions workflow is removed. The reconcile work is two jobs of different kinds:

| Job (every 5 minutes) | What it runs | Where the work happens |
|---|---|---|
| `mall-v3-reconcile-orphans` | `select public.reconcile_orphan_payments()`: an Order-less SUCCEEDED `ORDER_PAYMENT` older than 30 minutes gets its full `ORPHAN_PAYMENT` reversal (`reverse_orphan_payments`) | the database only; no HTTP, no secret |
| `mall-v3-reconcile-sweeper` | `select public.call_reconcile_sweeper()`: `pg_net` POST to `<client-web base URL>/api/internal/reconcile` with `Authorization: Bearer <secret>` | the Next server executes PENDING reversals (lease-guarded, at most 5 automatic attempts). The PG adapter and the reversal logic stay in the Next server; nothing PG-related moves into the database |

`/api/internal/reconcile` is therefore kept: executing a reversal is a PG call, which must not live in a database function. The route no longer creates orphan reversals; the orphan job creates them and the next sweeper run executes them. The response carries counts only (`reversalsScanned`, `executed`).

**Secret handling.** The endpoint URL and the secret are Supabase Vault entries (`reconcile_endpoint_url`, `reconcile_job_secret`). The cron commands contain no secret; `call_reconcile_sweeper()` reads Vault inside the function, and the migration stores nothing. The secret is stored by `supabase/cutover/v3_reconcile_scheduler_vault.sql`, which reads `RECONCILE_ENDPOINT_URL` and `RECONCILE_JOB_SECRET` from the operator's shell environment (`\getenv`) and sends them as bind parameters (psql 16 or later): the values are not in a file, on a command line, echoed, or in a statement text that a server error log could hold. The same secret value is set as the `RECONCILE_JOB_SECRET` server variable of client-web; a mismatch makes the sweeper get 401 and execute nothing (verified locally). Rotation: run the Vault script again with the new value and update the Vercel variable; a run in between gets 401 and is retried by the next tick.

**Disabled until the cutover.** The migration `20260927110000_v3_phase9_reconcile_scheduler.sql` only creates the extensions (`pg_cron`, `pg_net`, `supabase_vault`) and three owner-only support functions (`reconcile_orphan_payments`, `call_reconcile_sweeper`, `reconcile_scheduler_status`; nothing is granted to `anon`, `authenticated`, or `service_role`). It calls `cron.schedule` nowhere. At step 8, on the user's instruction:

1. `v3_reconcile_scheduler_vault.sql` stores the two Vault entries.
2. `v3_reconcile_scheduler_activate.sql` refuses (and schedules nothing) unless `reconcile_scheduler_status()` is all ok and the endpoint is https, then creates the two jobs (`*/5 * * * *`; re-running replaces them, never duplicates).
3. Undo / rollback: `v3_reconcile_scheduler_deactivate.sql` calls `cron.unschedule` for both jobs (idempotent; Vault entries are kept, `-v drop_secrets=1` also deletes them).

Observability after activation: `select * from public.reconcile_scheduler_status();` (booleans and schedules, never a value); `cron.job_run_details` for the run outcome of each job; `net._http_response` for the HTTP status of each sweeper call (a 401 = the secrets differ, a 503 = `RECONCILE_JOB_SECRET` is not set on the server). pg_net keeps responses for a limited time.

**Verified locally (`local rehearsal`, the real scripts on the local stack, `v3_phase9_reconcile.sh` and the rehearsal):** the migration schedules nothing; missing Vault entries make the call raise and send nothing; the status function shows booleans only; the sweeper call through `pg_net` reaches the real route with the Vault secret, and a stuck PENDING reversal becomes SUCCEEDED; a wrong Vault secret gets 401 and executes nothing; the activate script refuses an http endpoint and (with the local-only `allow_http=1`) creates exactly the two jobs at `*/5 * * * *` without duplicating on a re-run; a temporary Supabase Cron job (5 seconds) ran the real sweeper function by itself; deactivate removes both jobs and is idempotent; the orphan job creates one full `ORPHAN_PAYMENT` reversal only after the window and is idempotent.

**Local versus production.** Locally the stack has pg_cron 1.6.4 and pg_net 0.20.4 (the `*/5 * * * *` schedule is accepted), and `pg_net` reaches the dev server through `host.docker.internal`. The differences are not rehearsable here: on the Supabase platform the extensions must be creatable by the migration role (read-only check: `supabase/cutover/v3_precheck_scheduler_extensions.sql`), `cron.database_name` must be the production database, and `pg_net` needs the public https URL of client-web. **Production read-only check (2026-09-27, `production read-only observed`, `v3_precheck_scheduler_extensions.sql` plus catalog and privilege reads in a `begin read only` session; nothing created):** `pg_cron` 1.6.4 and `pg_net` 0.20.4 are **available and not installed** (the scheduler migration creates them); `supabase_vault` 0.3.1 is installed (schema `vault`); `pg_cron` and `pg_net` are in `shared_preload_libraries`; `cron.database_name` = `postgres` = the production database; PostgreSQL 17.6. The connecting role is `postgres` (not a superuser, member of the `postgres` role, `CREATE` on the database), the same kind of role the local rehearsal uses (non-superuser `postgres`). Vault: `vault.decrypted_secrets` is readable by that role (what `call_reconcile_sweeper()` needs), `vault.create_secret` / `vault.update_secret` are executable, `DELETE` on `vault.secrets` is allowed (what the Vault script's replace step uses). The `cron` and `net` schemas do not exist yet, as expected. **Not provable by a read:** that `create extension pg_cron` / `pg_net` and `cron.schedule` succeed for this role on the platform. That is only observable by executing the migration and the activate script, so it stays a step-1 / step-8 verification (a failure at step 1 leaves v2 untouched; a failure at step 8 leaves the scheduler off). Nothing was scheduled, stored in Vault, or migrated in production.

### 3.4 What cannot be audited from here

Production row counts and anomalies are audited (section 3.1). Still not audited: the Vercel project settings (Vercel access is not yet authorized in this session), and a real PG cancel API. (Production `pg_cron` / `pg_net` / Vault availability was read on 2026-09-27: section 3.3.) Supabase backup availability was read: no platform backup, PITR off.

---

## 4. Cutover order (a maintenance window)

Prepared in advance (no customer impact): the three v3 **Preview** deployments of commit `f8a6ccb` on the branch `v3-preview` (client-web `dpl_CcNxX6fCUg2EKnFQQYizMZn5adGC`, client-pwa `dpl_FDY1tBc5BRximZ6Cs9HbgLrXD1ED`, user-web `dpl_mACbFTcssbSeZbk3YGZWvuVAj5Cp`), built with the Preview-scope variables of section 3.2, **not promoted**; the current v2 production deployments stay live and are the rollback targets (section 5.1). `v3-preview` is a strict fast-forward descendant of the local `main`, and `origin/main` is still at the older `c69891f`: **`main` is not pushed before step 6c.**

| Step | Action | Verify | Rehearsal time |
|---|---|---|---|
| T-1 | Read-only checks on production (`PRECHECK.md`: state, precheck, unpaid-Order preview); the scheduler prerequisites are read (`v3_precheck_scheduler_extensions.sql`); the user approves the cutover | BLOCKER = 0; the unpaid-Order list is shown and accepted | |
| 0 | **Mandatory gate.** `bash supabase/cutover/v3_backup_and_verify.sh`: pg_dump of production (read only), restore into a local scratch database, compare the row counts of every `public`/`auth` table and the orders/payments/stock fingerprints. The dump stays local (`~/mall-v3-backups`, `*.dump` is gitignored, never committed) | any restore error, count or fingerprint mismatch **stops the cutover** | seconds (dump ~0.5 MB) |
| 1 | Apply the additive migrations `20260926130000` to `20260927110000` (v2 keeps working; can be done days earlier). The last one creates `pg_cron` / `pg_net` and schedules nothing | v2 smoke passes; `v3_phase*` object checks; `cron.job` has no reconcile job | ~2 s |
| — | **Window opens.** Announce; no new v2 orders | | |
| 2 | `v3_resolve_unpaid_legacy_orders.sql` (the target list and quantities were shown at T-1 and re-run just before) | unpaid count 0; stock restored | < 1 s |
| 3 | `v3_stock_and_sellability.sql`, then `v3_stock_consistency_check.sql` | the check returns no row | < 1 s |
| 4 | `v3_legacy_contraction.sql` | refuses on any guard | < 1 s |
| 5 | `v3_postcheck.sql` | every row ok | < 1 s |
| 6a | **Production environment, only now (after step 5 passes).** Add to the **Production** scope: `NEXT_PUBLIC_MALL_V3=true` (client-web, user-web, client-pwa), `PG_REVERSAL_ADAPTER=simulated` (client-web, user-web), `NEXT_PUBLIC_CLIENT_WEB_URL` (client-pwa). Already in Production and unchanged: `RECONCILE_JOB_SECRET`, `SUPABASE_SECRET_KEY`, `PG_TEST_*`, `NEXT_PUBLIC_SUPABASE_*`. An environment edit builds nothing | re-read names and scopes: the three `NEXT_PUBLIC_MALL_V3` have the Production scope (section 4.1) | seconds |
| 6b | Promote the prepared v3 Preview deployments (all three apps), the fast switch. Record the promoted deployment ids | pages load; the v3 flag is on (bundle check on the production domains) | minutes |
| 6c | Fast-forward `main` to `v3-preview` and push `main` (Vercel then builds production automatically from `main`, with the Production scope of 6a). Never before 6a | each new production deployment is READY and has the flag (bundle check); the auto-assigned build replaces the promoted one | minutes |
| 7 | Production verification (section 7): read-only / safe smoke first (7.1), then the write smoke one scenario at a time on an explicit go (7.2) | 7.1 all as expected; each 7.2 scenario: before/after and I1 to I7 | |
| 8 | Enable the scheduler: `v3_reconcile_scheduler_vault.sql`, then `v3_reconcile_scheduler_activate.sql` (section 3.3) | `reconcile_scheduler_status()` all ok; the first sweeper call returns 200 in `net._http_response` | |
| — | **Window closes.** | | |

Steps 2 to 4 are single-transaction scripts; each refuses and changes nothing when a guard fails. From step 4 the v2 apps are broken until step 6b, so the gap between them is the ordering downtime.

### 4.1 Production environment and `main` auto-deploy: order and stop conditions

Every push to `main` builds production automatically, and a production build reads only the **Production** scope. `NEXT_PUBLIC_MALL_V3` is inlined at build time, so the flag of a production build is decided by the Production scope at the moment the build starts. (Learned on 2026-09-27: a production redeploy made while the flag had the Production scope shipped the v3 UI of the PWA; see section 3.2.)

Order, without exception:

1. Until step 5 has passed, `NEXT_PUBLIC_MALL_V3` has **no Production scope** in any project (the database is v2, or is being converted), and nothing is pushed to `main`, redeployed, or promoted.
2. The Production scope of step 6a is set only after step 5 (post-check all ok), before any new production build.
3. `main` is pushed (step 6c) only after 6a has been re-read. The push is a fast-forward to `v3-preview`: every commit between `origin/main` (`c69891f`) and the head of `v3-preview` (`39ea298`, `5fbd1fd`, `f8a6ccb`, and the documentation commits after them) goes together, so that `5fbd1fd` (which still holds the old workflow) never lands without `f8a6ccb` (which removes it).
4. After 6a the Production scope of `NEXT_PUBLIC_MALL_V3` **stays on**: every later fix reaches production through `main` and the automatic build, and must carry the flag. Removing it is a return to v2 and is only valid together with the database rollback of section 5.

**Stop conditions** (any one: stop the window, do not continue with the next step):

- a production build or deployment (automatic, manual redeploy, or a redeploy of an older deployment) is created from step 2 on while any of the three projects lacks the Production `NEXT_PUBLIC_MALL_V3`, or while the database is still v2 and the flag is on: a flag-less build on the v3 database (or a flagged build on the v2 database) is wrong;
- a production deployment that is live after step 4 was built without the flag (bundle check: the flag expression is still evaluated at run time, or the v2 order text is present, instead of the flag being inlined);
- the environment edit of 6a is not visible in the re-read.

Action on a stop: do not redeploy. Re-promote the prepared v3 deployment of that project (its id is recorded at 6b; before 6b, the ids of section 4), correct the Production scope, re-read it, and only then let a new build happen. Do not roll back to a v2 deployment for this: after step 4 the v2 apps do not work on the v3 database.

## 5. Rollback

**Before step 2** (only additive migrations applied): nothing to roll back; v2 keeps working. Leave the objects in place.

**Point of no return: the first real v3 order (or refund) after step 6.** Before it, a rollback is clean:
0. If the scheduler was enabled: `v3_reconcile_scheduler_deactivate.sql` (unschedule both jobs).
1. Promote the previous v2 deployments of section 5.1 (Vercel rollback), and remove the Production `NEXT_PUBLIC_MALL_V3` again *before* anything can rebuild them.
2. Restore the verified backup (the pg_dump of step 0 restored into production; the platform has no backup and PITR is off).
3. Re-run the v2 smoke set.

**After it**, restoring would lose real v3 orders; rollback then means a forward fix, decided by the user.

Rollback criteria (any one, during the window or the first hour):
- a guard refuses, or any `v3_postcheck.sql` row is false;
- a read-only smoke R1 to R4 of section 7.1 fails, or a write smoke of section 7.2 fails on a core path (checkout, finalize, cancel, PROCESSING, refund) or breaks an invariant I1 to I7;
- the Consumer boundary check (BR-20) finds stock, allocation, shortage, Ware, or reversal detail in a Consumer response;
- a stock invariant breaks (`reserved > current`, negative stock, a Payment reversed above its amount);
- the reversal sweeper or executor errors repeatedly (5xx) or settles a reversal in a mode that was not intended.

### 5.1 Rollback deployments (recorded 2026-09-27)

The current live v2 production deployments, the targets of step 1 above. Only valid together with the database rollback (step 2 above) once step 4 has run, because the v2 apps do not work on the contracted v3 database. Read the production aliases again at T-1: this table is the state of 2026-09-27.

| Project | Rollback deployment | Notes |
|---|---|---|
| client-pwa | `dpl_5w35LXi6xoamjrYBXpFxSymzispr` | Git build of `c69891f`, built before any v3 variable existed. It is the deployment the production PWA was rolled back to on 2026-09-27 (aliased, v2 bundle re-verified) |
| client-web | `dpl_5Q77pdp2Uz5kddN8a9jdnRYBgzqG` | Production redeploy of `c69891f`, aliased to the production domains; built before client-web had the Production `NEXT_PUBLIC_MALL_V3` (env timeline; not bundle-verified). It carries `RECONCILE_JOB_SECRET` |
| user-web | `dpl_Geax8YwckyrWaU2gbYp9sjHv5gbU` | Latest production deployment, Git build of `c69891f`; no user-web variable of the v3 switch existed at its build. Its production alias was not re-read on 2026-09-27 |

Not a rollback target: `dpl_EJnE6sjYm5dvFoy3wEc2sXGpjtkk` (client-pwa, built with the v3 flag on).

## 6. Local rehearsal (`local rehearsal`)

`bash supabase/rehearsal/v3_cutover_rehearsal.sh` — local database only (`--local`; nothing can reach a linked project). Result: **PASSED**.

Order rehearsed: v2 baseline reset → seed through the real v2 RPCs (a delivered + refunded Order, a paid Order in PROCESSING with an open Refund request, a cancelled Order, an unpaid PENDING Order, a hand-marked PAID Order, Point top-up, payments in every status) → precheck (0 BLOCKER, 2 ACTION) → backup + restore into a scratch database (counts equal) → additive migrations (existing data untouched) → the contraction refuses while unpaid Orders exist (nothing changed) → resolve → stock conversion (consistency check empty) → contraction → post-check (all rows ok) → the legacy data through the v3 paths (12 scenarios) → the v3 suites on the cut-over database (checkout flow, Phase 4/5/7 HTTP routes, the reconcile scheduler (sweeper route, Vault + pg_net, Supabase Cron), Phase 4 to 7 concurrency).

The scheduler is rehearsed on the local stack as described in section 3.3 (extensions prepared and nothing scheduled after the migrations, the Vault -> pg_net -> route path, activation and deactivation, a real Supabase Cron run). Not rehearsable locally: a Supabase platform restore (only the backup's validity is checked), Vercel promotion, the production Supabase Cron / pg_net / Vault environment, a real PG.

## 7. Production verification (after step 6; PG test mode)

Strategy (decided 2026-09-27): production is the verification target, not Preview. Only a function that **actually fails on production** is a blocker. Verification is split in two, and the second part is never started implicitly.

**Rules**

- Read-only and safe smoke first. A write smoke is run only after its scenario, the expected database before/after, and the invariants are written down, one scenario at a time, on the user's explicit go. A failure goes: cause analysis, fix, `main` (the fixed commit through the normal `main` -> production build of section 4.1), production re-verification.
- Test data is a production write too (a dedicated Admin, two Clients A and B, a test Product with 2 Variants: Variant 1 linked to a Ware with stock 10, Variant 2 with no Ware, a published ProductPost). Creating it needs its own explicit authorization that names it.
- Results are labelled `production E2E observed` (never `production read-only observed` for a write).

### 7.1 READ-ONLY / SAFE SMOKE (no write of any kind)

`POST /api/internal/reconcile` is **not** in this part: the route claims and executes a PENDING reversal when one exists, so it can write. It is in 7.2.

| # | Check | Expected |
|---|---|---|
| R1 | The three production deployments: state READY, the production aliases point to the promoted / built deployment, the v3 flag is inlined in the public bundle (client-web and client-pwa: public URL; user-web: as far as its access allows) | READY; aliases as recorded at 6b/6c; no v2 order text in the PWA bundle |
| R2 | `v3_postcheck.sql` in a `begin read only` session (`PRECHECK.md` wrapper) | every row ok |
| R3 | `select * from public.reconcile_scheduler_status();` and the read of `cron.job` / `net._http_response` (before step 8: extensions ok, no reconcile job; after: two jobs) | booleans and schedules only; no value; the Vault checks match the step (fail before step 8) |
| R4 | Public product list and detail (the Consumer network responses) | works; **no** `current_stock`, `reserved_stock`, Ware, allocation, shortage, or reversal field in any Consumer response (BR-20) |
| R5 | client-pwa order lookup by order number (with an existing order, or the empty state) | works; the v3 wording; no internal field |
| R6 | user-web access without authentication | redirect to the login / authentication page (a 302 is the expected state); no Admin data without a session |

A failure of R1 to R3 is a stop condition of section 4.1 or a rollback criterion of section 5. A failure of R4 (Consumer boundary) is a rollback criterion.

### 7.2 WRITE SMOKE (one at a time, on an explicit go)

Before every scenario: record the "before" (read-only SQL: Ware `current/reserved`, counts of orders, payments, payment_reversals, order_cancellations, refund_requests, refund_items, restock rows). After every scenario: check the "after" and the invariants I1 to I7 **immediately**, before the next scenario.

Invariants (read-only SQL, after every scenario):

- I1: for every Ware `0 <= reserved_stock <= current_stock`; `current_stock` is never negative
- I2: for every Ware `reserved_stock` = the sum of the allocation quantities of its `PENDING` Orders
- I3: exactly one Order per `payment_id`
- I4: per Payment, the sum of its `PENDING` + `SUCCEEDED` reversals is at most `payments.amount`; `payments.status` never leaves `SUCCEEDED`
- I5: per OrderItem, the cumulative valid Refund quantity is at most the ordered quantity
- I6: no Consumer response of the scenario carried stock, Ware, allocation, shortage, or reversal detail
- I7: `v3_postcheck.sql`, every row ok

Numbers below assume the test Ware starts at `current/reserved` = `10/0` with no `PENDING` reversal, and there is no other production traffic on the test Product.

| # | Scenario | Expected before -> after | Notes |
|---|---|---|---|
| W1 | `POST /api/internal/reconcile` with the server secret, operator only, **before any test Order exists** and after checking `count(*) from payment_reversals where status = 'PENDING'` (expected 0) | before: 0 PENDING reversals. After: response `reversalsScanned` 0, `executed` `{}`; every count and every Ware unchanged. If the count before was not 0: stop, the call would claim and execute those reversals (`attempt_count` +1, `SUCCEEDED` under the simulated adapter): decide first | needs the secret; the two cron jobs are not active yet (step 8 comes after this) |
| W2 | Client A: Cart 2 x Variant 1, checkout, PG test success, finalize (smoke 1, 2) | Ware `10/0` -> `10/2`; payments +1 (`SUCCEEDED`); orders +1 (`PENDING`, `payment_id` set); allocation rows sum 2, shortage 0; reversals unchanged; Cart line removed; a reload before finalize resumes and still yields one Order | I1 to I3, I6 |
| W3 | Read-only allocation check on the W2 Order | `allocated_quantity` = 2 = `OrderItem.quantity`; `reserved` 2 = the allocation sum | no write |
| W4 | Client A: cancel the W2 Order; then cancel it again (double click) | Ware `10/2` -> `10/0`; order `CANCELLED`; `order_cancellations` +1 (not +2); exactly one `ORDER_CANCEL` reversal, `PENDING` -> `SUCCEEDED` (simulated); payment still `SUCCEEDED`; the second cancel returns the final state with no new row and no stock change | I1, I2, I4 |
| W5 | Client B orders 6, Client A orders 6 (Ware 10); Admin `PROCESSING` on A's Order (refused: shortage 2), then on B's (accepted) | after the two orders `10/0` -> `10/10`; A's Order allocation 4, shortage 2, both `PENDING`. After B's `PROCESSING`: `10/10` -> `4/4` (both decrease by 6); A's Order stays `PENDING` | I1, I2; the refused transition changes nothing |
| W6 | Client: refund 2 of 6 on B's `PROCESSING` Order; Admin approves | `refund_requests` +1 `REQUESTED` -> `APPROVED`; `refund_items` qty 2 at the snapshot unit price; one `REFUND` reversal linked, `PENDING` -> `SUCCEEDED`; Order status unchanged; Ware unchanged `4/4` | I4, I5 |
| W7 | Admin: explicit restock of 2 into the original Ware; then a third restock attempt | Ware `4/4` -> `6/4` (`current` +2, `reserved` unchanged); one restock row of 2; the third attempt is refused and changes nothing | I1, I5 |

The remaining smoke items of the earlier list run in the same way when needed: additional allocation after restock (shortage to 0, then `PROCESSING`), and ownership (Client B cannot read or cancel Client A's Order: 404 / empty).

**Full set**: S-03 (Ware-less Variant orders, full shortage), S-04 / S-07 (sold-out before and after PG success: refused, then reversed), S-06 (price changed after payment: no Order, full reversal), S-08 (PG failure then retry as a new Payment), S-10 / S-11 (double click / reload: one Order), S-14 (Client and Admin cancel together: one cancel), S-19 (partial refunds and the cumulative limit), S-26 (orphan: stop after PG success, the orphan job creates the reversal after 30 minutes and the sweeper executes it), S-27 (reversal failure and Admin retry), the seller-initiated Refund on a `SHIPPED` Order, PWA hand-off and lookup by order number, Admin overview counts.

## 8. Remaining blockers

Done (2026-09-27): the production precheck (BLOCKER 0, WARN 0) and the unpaid legacy Order target check (3 Orders, approved; section 3.1).

Done (2026-09-27): the backup gate procedure is verified (step 0; the platform itself has no backup and PITR is off, so the pre-window dump is the only rollback data).

Done (2026-09-27, `local rehearsal` only): the scheduler is redesigned onto Supabase Cron, implemented, and verified on the local stack (section 3.3). The GitHub Actions workflow and its secrets/variable are removed from the plan; there is no GitHub blocker any more.

Before the PG test cutover (open; the procedure is `PRECHECK.md`):
1. ~~The Preview environment variables~~ **done 2026-09-27** (section 3.2): every required variable has the Preview scope, and the Production scope of the six Preview-only variables was removed again (verified by a re-read). `RECONCILE_JOB_SECRET` is also the source value of the Vault entry.
2. ~~The v3 Preview deployments~~ **created 2026-09-27**, READY, not promoted (section 3.2). Verified: client-pwa applies the v3 flag (bundle). **Not verified: the v3 flag at run time in client-web and user-web** (READY plus Preview env variables only); it needs a smoke check that does not write to the production database, decided before the promotion.
3. ~~Production scheduler prerequisites~~ **done 2026-09-27 (`production read-only observed`)**: `pg_cron` and `pg_net` available (not installed), Vault installed, `cron.database_name` is the production database (section 3.3). No DB scheduler blocker remains; that the extensions can actually be created and scheduled by the role is verified when the migration (step 1) and the activate script (step 8) run.
4. The user's explicit cutover approval (which also names the scheduler activation time, step 8).

The Phase 9 status is **not** `READY FOR CUTOVER` until the client-web / user-web flag check (item 2) is done and the user approves the cutover (item 4). Not executed in production so far: the migrations, the cutover scripts, the legacy Order resolution, the stock conversion and contraction, the scheduler (Vault entries and cron jobs), the production `NEXT_PUBLIC_MALL_V3`, and any promotion.

For a real-money production release only: **a real PG reversal adapter**. It is not a blocker for the PG test cutover.
