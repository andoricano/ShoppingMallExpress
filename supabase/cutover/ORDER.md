# Mall v3 cutover: what is applied, in which order

Nothing in this directory is a migration and nothing here is applied by
`supabase db push`. Each file is applied **once, at the v3 cutover, on the
user's explicit instruction** (docs/mall1/v3/CUTOVER.md), together with the
matching application deployment. Every file is validated locally by the
rehearsal `supabase/rehearsal/v3_cutover_rehearsal.sh` (local database only).

| Step | What | File | Local validation |
|---|---|---|---|
| 0 | Read-only precheck of production (v2 schema); every BLOCKER must be 0 | `v3_precheck_v2_baseline.sql` | rehearsal step 2 |
| 1 | Backup, and verify it by restoring into a scratch database | | rehearsal step 3 |
| 2 | Additive migrations `20260926130000` to `20260927100000` (v2 keeps working) | `supabase/migrations/` | `pnpm supabase db reset --local` + all `v3_phase*` scripts, rehearsal step 4 |
| 3 | Resolve unpaid legacy Orders (cancel, v2 stock semantics) | `v3_resolve_unpaid_legacy_orders.sql` | rehearsal step 6 |
| 4 | Stock conversion and sellability switch (check: `v3_stock_consistency_check.sql`) | `v3_stock_and_sellability.sql` | `v3_phase2_cutover.sh`, rehearsal step 6 |
| 5 | Legacy contraction (PAID, v2 order paths, Refund status set) | `v3_legacy_contraction.sql` | `v3_phase8_contraction.sh`, rehearsal steps 5-6 |
| 6 | Read-only post-check; every row must be ok | `v3_postcheck.sql` | rehearsal step 7 |
| 7 | Promote the v3 application deployment (`NEXT_PUBLIC_MALL_V3=true`) and set the server environment | | rehearsal step 9 (E2E on the cut-over database) |

Steps 3 to 5 are single-transaction scripts with guards: they refuse to run,
and change nothing, when their preconditions fail. After step 5 the v2
applications no longer work (they call the removed objects), so steps 3 to 7 are
one maintenance window; step 7 is prepared in advance (a built, unpromoted
deployment). The release artifact is `main` with the flag on; the code-level
contraction (`v3-contraction`) is a later cleanup, after the release is stable.

Notes

- What happens to unpaid legacy Orders (step 3) is a data decision recorded in
  docs/mall1/v3/CUTOVER.md; the script cancels them, it never invents payments.
- Rollback: see docs/mall1/v3/CUTOVER.md. Steps 3 to 5 are not reversible by a
  script; the rollback is the verified backup plus the previous deployment.
