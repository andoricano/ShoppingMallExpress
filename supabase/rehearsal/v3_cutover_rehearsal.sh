#!/usr/bin/env bash
# ============================================================
# Mall v3 cutover REHEARSAL (LOCAL database only)
#
#   bash supabase/rehearsal/v3_cutover_rehearsal.sh [--skip-e2e]
#
# Rehearses the production cutover order on the local Supabase stack:
#   0. reset to the v2 baseline (migrations up to 20260925150000)
#   1. seed a realistic v2 dataset through the real v2 RPCs
#   2. READ-ONLY precheck (supabase/cutover/v3_precheck_v2_baseline.sql)
#   3. backup + restore check into a scratch database (proves the backup works)
#   4. apply the additive v3 migrations (supabase migration up --local)
#   5. the contraction must REFUSE while unpaid legacy Orders exist
#   6. resolve unpaid legacy Orders, stock conversion (+ consistency), contraction
#   7. read-only post-check: every row must be ok
#   8. the legacy data used through the v3 paths
#   9. the v3 end-to-end suites (HTTP + concurrency) on the cut-over database
#
# Every command targets the LOCAL database (--local / the local DB container);
# nothing here can reach a linked or production project. The database is left in
# the post-cutover state; run `pnpm supabase db reset --local` to return.
# ============================================================
set -uo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
SKIP_E2E=0; [ "${1:-}" = "--skip-e2e" ] && SKIP_E2E=1
FAILED=0
STEP_T0=$(date +%s)

psqld() { docker exec -i "$DB_CONTAINER" psql -U postgres -d "${DB:-postgres}" -qtA -v ON_ERROR_STOP=1 "$@"; }
psqlf() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"; }
val()   { psqld -c "$1" | head -n1 | tr -d '[:space:]'; }
pass()  { echo "PASS  $1"; }
fail()  { echo "FAIL  $1"; FAILED=1; }
check() { if [ "$2" = "$3" ]; then pass "$1 (got $2)"; else fail "$1 (expected $3, got $2)"; fi; }
step()  { local now; now=$(date +%s); echo; echo "== $1  (+$((now - STEP_T0))s)"; }

step "0. reset the LOCAL database to the v2 baseline"
pnpm --silent supabase db reset --local --version 20260925150000 2>&1 | grep -E "ERROR|Finished" 
check "v2 baseline: the v3 objects do not exist yet" "$(val "select to_regprocedure('public.finalize_order(uuid, uuid, jsonb, jsonb)') is null")" t
check "v2 baseline: the v2 order paths exist" "$(val "select to_regprocedure('public.create_order_from_cart(jsonb, text)') is not null and to_regprocedure('public.cancel_order(uuid)') is not null")" t

step "1. seed the v2 dataset through the v2 RPCs"
psqlf -q < supabase/rehearsal/v2_baseline_seed.sql >/dev/null && pass "seeded" || fail "seed failed"
check "seed: 6 Orders (CANCELLED 1, DELIVERED 1, PAID 2, PENDING 1, PROCESSING 1)" \
  "$(val "select string_agg(status || n, ',' order by status) from (select status, count(*) n from public.orders group by status) s")" "CANCELLED1,DELIVERED1,PAID2,PENDING1,PROCESSING1"
STOCK_BEFORE="$(val "select sum(current_stock) from public.wares")"

step "2. read-only precheck on the v2 database"
psqlf < supabase/cutover/v3_precheck_v2_baseline.sql | grep -E "BLOCKER|ACTION" | cut -c1-170
check "precheck: no BLOCKER" "$(psqlf -qtA < supabase/cutover/v3_precheck_v2_baseline.sql | awk -F'|' '$2=="BLOCKER" && $3!="0"' | wc -l | tr -d ' ')" 0
check "precheck: exactly 2 ACTION Orders (unpaid PENDING + manual PAID)" "$(psqlf -qtA < supabase/cutover/v3_precheck_v2_baseline.sql | awk -F'|' '$2=="ACTION" {print $3}')" 2

step "3. backup and verify it by restoring into a scratch database"
docker exec "$DB_CONTAINER" sh -c "pg_dump -U postgres -d postgres -Fc -f /tmp/v2_backup.dump" && pass "backup taken (pg_dump -Fc)" || fail "backup failed"
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -qtA -c "drop database if exists rehearsal_scratch" >/dev/null
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -qtA -c "create database rehearsal_scratch" >/dev/null
docker exec "$DB_CONTAINER" sh -c "pg_restore -U postgres -d rehearsal_scratch --no-owner /tmp/v2_backup.dump >/dev/null 2>&1"
DB=rehearsal_scratch check "restore check: the scratch copy has the same Orders, payments and stock" \
  "$(DB=rehearsal_scratch val "select (select count(*) from public.orders) || '/' || (select count(*) from public.payments) || '/' || (select sum(current_stock) from public.wares)")" \
  "$(val "select (select count(*) from public.orders) || '/' || (select count(*) from public.payments) || '/' || (select sum(current_stock) from public.wares)")"
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -qtA -c "drop database rehearsal_scratch" >/dev/null

step "4. apply the additive v3 migrations (local only)"
pnpm --silent supabase migration up --local 2>&1 | grep -E "Applying|ERROR|error" | sed 's/^/    /'
check "the v3 objects exist" "$(val "select to_regprocedure('public.finalize_order(uuid, uuid, jsonb, jsonb)') is not null and to_regprocedure('public.admin_create_refund_request(uuid, jsonb, text, uuid)') is not null")" t
check "the v2 order paths still exist (additive only)" "$(val "select to_regprocedure('public.create_order_from_cart(jsonb, text)') is not null")" t
check "existing data untouched by the migrations (stock total)" "$(val "select sum(current_stock) from public.wares")" "$STOCK_BEFORE"

step "5. the contraction must REFUSE while unpaid legacy Orders exist"
psqlf --single-transaction -q < supabase/cutover/v3_legacy_contraction.sql >/dev/null 2>&1 \
  && fail "the contraction ran although unpaid Orders exist" || pass "the contraction refused"
check "the refused run changed nothing (PAID Orders still 2, v2 functions still there)" \
  "$(val "select (select count(*) from public.orders where status = 'PAID') || '/' || (to_regprocedure('public.create_order_from_cart(jsonb, text)') is not null)")" "2/true"

step "6. resolve unpaid legacy Orders, stock conversion, contraction (in this order)"
psqlf --single-transaction < supabase/cutover/v3_resolve_unpaid_legacy_orders.sql | grep -E "ORD-" | sed 's/^/    resolved: /'
check "resolve: both unpaid Orders are cancelled and their v2 stock returned (71 + 3 + 1 = 75)" \
  "$(val "select sum(current_stock) from public.wares")" 75
psqlf --single-transaction -q < supabase/cutover/v3_stock_and_sellability.sql >/dev/null && pass "stock conversion applied" || fail "stock conversion failed"
check "stock consistency check: no row after the conversion" "$(psqlf -qtA < supabase/cutover/v3_stock_consistency_check.sql | wc -l | tr -d ' ')" 0
psqlf --single-transaction -q < supabase/cutover/v3_legacy_contraction.sql >/dev/null && pass "contraction applied" || fail "contraction failed"

step "7. read-only post-check"
POST="$(psqlf -qtA < supabase/cutover/v3_postcheck.sql)"
echo "$POST" | cut -c1-150 | sed 's/^/    /'
check "post-check: no failing row" "$(echo "$POST" | awk -F'|' '$2=="f"' | wc -l | tr -d ' ')" 0

step "8. the legacy data through the v3 paths"
psqlf < supabase/rehearsal/v3_legacy_through_v3.sql 2>&1 | grep -E "\| f +\||NOTICE|ERROR" | sed 's/^/    /'
check "legacy-through-v3 scenarios all pass" "$(psqlf < supabase/rehearsal/v3_legacy_through_v3.sql 2>&1 | grep -c 'legacy-through-v3 check PASSED')" 1

if [ "$SKIP_E2E" -eq 0 ]; then
  step "9. v3 end-to-end suites on the cut-over database"
  for s in v3_phase8_checkout_flow v3_phase4_routes v3_phase5_routes v3_phase7_routes v3_phase9_reconcile v3_phase4_concurrency v3_phase5_concurrency v3_phase6_concurrency v3_phase7_concurrency; do
    OUT="$(timeout 590 bash "supabase/verification/$s.sh" 2>&1)"; RC=$?
    if [ "$RC" -eq 0 ] && ! echo "$OUT" | grep -q "^FAIL"; then pass "$s"; else fail "$s (rc=$RC)"; echo "$OUT" | grep -E "^FAIL" | head -3; fi
  done
  check "post-check still all ok after the suites" "$(psqlf -qtA < supabase/cutover/v3_postcheck.sql | awk -F'|' '$2=="f"' | wc -l | tr -d ' ')" 0
fi

echo
if [ "$FAILED" -eq 0 ]; then echo "cutover rehearsal PASSED"; else echo "cutover rehearsal FAILED"; exit 1; fi
