# Mall v3 cutover: what is applied, in which order

Nothing in this directory is a migration and nothing here is applied by
`supabase db push`. Each file is applied **once, at the v3 cutover, on the
user's explicit instruction** (docs/mall1/v3/PHASES.md 2.3), together with the
matching application deployment. Every file is validated locally by a script in
`supabase/verification/`, in a transaction that is rolled back.

| Step | What | File | Local validation |
|---|---|---|---|
| 1 | Migrations `20260926130000` to `20260926190000` (additive) | `supabase/migrations/` | `pnpm supabase db reset` + all `v3_phase*` scripts |
| 2 | Stock conversion and sellability switch | `v3_stock_and_sellability.sql` (check: `v3_stock_consistency_check.sql`) | `v3_phase2_cutover.sh` |
| 3 | Legacy contraction (PAID, v2 order paths, Refund status set) | `v3_legacy_contraction.sql` | `v3_phase8_contraction.sh` |
| 4 | Deploy the v3 applications (`NEXT_PUBLIC_MALL_V3=true`, or the contraction code branch) | | `v3_phase8_legacy_audit.sh` |

Notes

- Steps 2 and 3 are single-transaction scripts with guards: they refuse to run,
  and change nothing, when their preconditions fail.
- Step 3 refuses while any PENDING/PAID Order has no succeeded Payment (an
  unpaid v2 Order, or a manually marked PAID Order). What to do with those Orders
  is a production data decision for Phase 9; the script never decides it.
- Before step 1 on production, check `pg_callback_id` duplicates (see the header
  of `20260926130000_v3_phase1_schema_foundation.sql`).
- Rollback: take a database backup before step 2. Steps 2 and 3 are not
  reversible by a script (stock values are converted and functions are dropped).
