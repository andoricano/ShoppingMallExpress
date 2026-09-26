# Mall v3 — Production precheck: final checklist and read-only commands

Status: prepared 2026-09-27. **Read-only.** Nothing here changes production data,
schema, migrations, environment, or deployment. It does not apply any migration,
does not cut over, and does not turn `NEXT_PUBLIC_MALL_V3` on.

It is run by the user (or by an agent only on the user's explicit instruction, which
names that it reads production). The output is read with the levels in
`supabase/cutover/v3_precheck_v2_baseline.sql`. Results are labelled
`production read-only observed` once run; none has been run yet.

---

## 1. Rules for the session

- The connection string is a secret. Keep it in an environment variable in your own
  shell (`PROD_DB_URL`), never paste it into a chat, a document, or a commit, and
  never echo it.
- Every script runs inside `begin read only; ... commit;`, so the database itself
  refuses any write (the local rehearsal proves this: a write in such a session fails
  with "read-only transaction"). The wrapper works through the Supabase pooler too,
  unlike connection options.
- Prefer a read replica or a read-only database role if one exists. Otherwise the
  wrapper above is the protection.
- Do not use `supabase db push`, `supabase link`, `supabase migration repair`, or
  any `--linked` command for this. Plain `psql` with the scripts below is enough.

```sh
# once per shell; do not print it
read -rs PROD_DB_URL && export PROD_DB_URL

ro() { { echo "begin read only;"; cat "$1"; echo "commit;"; } | psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -X; }
```

## 2. Commands (in this order)

| # | Command | What it reads | Expected before the cutover |
|---|---|---|---|
| 1 | `ro supabase/cutover/v3_precheck_state.sql` | the migration history, the existence of v3 objects, `reserved_stock` | last version `20260925150000`; every v3 object `f`; `wares_with_reserved_stock` = 0 |
| 2 | `ro supabase/cutover/v3_precheck_v2_baseline.sql` | v2 tables only (Orders, OrderItems, Payments, Refunds, Wares, Points): counts, no personal data | every BLOCKER row count `0`; ACTION rows listed; read every WARN |
| 3 | `ro supabase/cutover/v3_preview_unpaid_legacy_orders.sql` | the unpaid legacy PENDING/PAID Orders: order number, status, product and variant snapshot, ordered and allocated quantity, the Ware and the stock that would return | the list and quantities are **shown to the user and accepted** before the resolve script is ever run |

If step 1 shows a v3 object or a non-zero `reserved_stock`, stop: production is not
at the expected v2 baseline, and the rest is not valid.

Result handling:

- **BLOCKER > 0**: stop; report it; the user decides how to resolve it (duplicate
  `pg_callback_id`: which reference stays; over-refund; a non-v2 status). No fix is
  applied by these scripts.
- **ACTION** (unpaid Orders): must equal the preview in step 3. The resolve script
  uses the same selection rule, so its target set is exactly the previewed set (run
  the preview again just before the window: new Orders may have appeared).
- **WARN**: read each; none blocks by itself, but each needs an explanation.

### Reading the precheck result (command 2)

Output columns: `check_name | level | count | detail`, sorted ACTION, BLOCKER, INFO, WARN.
Paste back only these columns (counts and the short detail), never other row data.

| Level | Row | Read it as | If not as expected |
|---|---|---|---|
| BLOCKER | duplicate `pg_callback_id` values | count must be 0 | stop; the user decides which duplicate keeps its reference; nothing is edited by the scripts |
| BLOCKER | Refund requests with a status outside REQUESTED/APPROVED/REJECTED | 0 | stop; the Refund status CHECK would fail at the contraction |
| BLOCKER | OrderItems whose valid cumulative refund quantity exceeds the ordered quantity | 0 | stop; a data error to decide first |
| BLOCKER | Wares with `reserved_stock <> 0` | 0 | stop; v2 never reserves, so production is not the expected v2 baseline |
| ACTION | PENDING/PAID Orders without a succeeded Payment | any count is allowed; `detail` lists up to 20 order numbers | must equal the preview (command 3); resolved at the cutover by decision #1 after the user has seen the list |
| WARN | non-cancelled OrderItems whose allocation does not sum to the quantity | expected 0 | explain each before the cutover (the stock conversion assumes v2 full allocation) |
| WARN | payments still PENDING | any count; `detail` shows the oldest | in flight at the cutover; they stay PENDING and are never finalized; note the number |
| WARN | succeeded ORDER_PAYMENTs whose Order is CANCELLED | expected 0 | money taken and Order cancelled in v2; the user decides (no reversal is invented) |
| WARN | Point balances that differ from their ledger | expected 0 | explain; Point data is kept as it is |
| INFO | APPROVED / REQUESTED Refunds, Orders by status, Wares and total stock, Wares-less Variants, Point top-ups | context only | REQUESTED Refunds are approved the v3 way after the cutover; Ware-less Variants are orderable and fully short in v3 |

Verdict rule: **any BLOCKER > 0 = stop.** No BLOCKER = the cutover may be scheduled once
the ACTION list is accepted and every WARN is explained.

Short form to report back:

```text
state:   last migration <version>; v3 objects <none/list>; reserved_stock rows <n>
BLOCKER: dup-callback <n> | refund-status <n> | over-refund <n> | reserved-stock <n>
ACTION:  unpaid PENDING/PAID Orders <n>  (preview: <n> Orders, <q> ordered, <q> returning to stock)
WARN:    alloc-mismatch <n> | pending-payments <n> (oldest <ts>) | paid-but-cancelled <n> | point-mismatch <n>
```

---

## 3. Checklist (each line: the user confirms, with the evidence)

Data (read-only SQL above)

- [ ] 1. Schema state: baseline `20260925150000`, no v3 object, no reserved stock
- [ ] 2. Precheck: BLOCKER = 0 (paste only the counts, not row data with personal fields)
- [ ] 3. Unpaid legacy Orders: the preview list and quantities shown to and accepted by the user
- [ ] 4. Point balances match their ledger (a WARN row; the value is 0 or explained)
- [ ] 5. PENDING payments in flight: the number and the oldest time noted

Backup (dashboard; not scripted here)

- [ ] 6. Supabase backup available for the production project: the plan's daily backup, or PITR, and the newest restore point is recent
- [ ] 7. Who runs the restore, and where (a scratch project), is agreed; a restore check is scheduled before step 1 of the cutover
      (the cutover order in `CUTOVER.md` section 4)

Environment (dashboard; names and presence only, never values)

- [ ] 8. client-web, user-web, client-pwa production keep `NEXT_PUBLIC_MALL_V3` **unset**
- [ ] 9. The v3 deployment (a build of `main`, not promoted) has, per `CUTOVER.md` 3.2:
      `NEXT_PUBLIC_MALL_V3=true` (all three apps), `NEXT_PUBLIC_CLIENT_WEB_URL` (client-pwa),
      `PG_REVERSAL_ADAPTER=simulated` (client-web and user-web),
      `RECONCILE_JOB_SECRET` (client-web, server-only, at least 24 characters, not `NEXT_PUBLIC_*`),
      and the existing `SUPABASE_SECRET_KEY` and `PG_TEST_*` unchanged
- [ ] 10. Nothing privileged is in a `NEXT_PUBLIC_*` variable

Scheduler and deployment (dashboard / provider; nothing created by these scripts)

- [ ] 11. The reconcile scheduler is prepared but **disabled**: `POST /api/internal/reconcile` with `Authorization: Bearer <RECONCILE_JOB_SECRET>` every 5 minutes, enabled at step 8 of the cutover
- [ ] 12. The v3 deployment exists and is not promoted; the current v2 deployment is identified as the rollback target
- [ ] 13. A maintenance window and the announcement are agreed

## 4. Approvals the user gives before the cutover

None is given by these scripts; each is an explicit instruction in the current task.

1. The precheck result (BLOCKER = 0) and every WARN, accepted.
2. The unpaid legacy Order list and quantities (decision #1: cancel, v2 stock semantics, no Payment created), accepted **after** seeing the list.
3. The backup and its restore check, accepted.
4. The environment variables and the prepared v3 deployment, accepted.
5. The reconcile scheduler configuration and its enabling time, accepted.
6. The maintenance window (announced).
7. **The cutover itself**, naming what is applied: the additive migrations (`20260926130000` to `20260927100000`), the cutover scripts in the order of `supabase/cutover/ORDER.md`, then the promotion of the v3 deployment. Applying the migrations, running the cutover SQL, and turning `NEXT_PUBLIC_MALL_V3` on in production are three separate instructions unless the user says they are one.
8. The rollback criteria (`CUTOVER.md` section 5), including that the point of no return is the first real v3 order.

Not part of this checklist, and not a blocker for the PG test cutover: the real PG
reversal adapter (a blocker only for a real-money production release).
