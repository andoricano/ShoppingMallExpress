#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 Phase 3 payment reversals under parallel sessions
# (migration 20260926150000_v3_phase3_payment_reversal_engine.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/v3_phase3_concurrency.sh
#
# Covers what a single transaction cannot show:
#   A. parallel reversals never exceed the Payment amount (BR-34)
#   B. parallel requests with one idempotency key create one reversal (BR-32)
#   C. parallel claims of one reversal: exactly one wins (lease)
#   D. parallel success/failure reports: a success is never lost
#   E. a retry and a new request compete for freed amount: exactly one wins,
#      no deadlock
#
# Needs real concurrent sessions, so it COMMITS temporary fixtures
# (keys start with "__v3p3conc") and removes them on exit.
# If cleanup ever fails, `pnpm supabase db reset` restores the local DB.
#
# Uses the local Supabase DB container (no host psql required):
#   DB_CONTAINER=supabase_db_ShoppingEx (override via env)
# ============================================================
set -uo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
TMP="$(mktemp -d)"
FAILED=0

psqlq() {
  docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -qtA -v ON_ERROR_STOP=1 "$@"
}

sql() {
  psqlq -c "$1" | head -n1 | tr -d '[:space:]'
}

check() {
  local name="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "PASS  $name (got $actual)"
  else
    echo "FAIL  $name (expected $expected, got $actual)"
    FAILED=1
  fi
}

CLIENT=""
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
delete from public.payment_reversals where idempotency_key like '__v3p3conc%';
delete from public.payments where client_id = nullif('$CLIENT','')::uuid;
delete from auth.users where id = nullif('$CLIENT','')::uuid;
SQL
  local leftovers
  leftovers="$(sql "select count(*) from public.payment_reversals where idempotency_key like '__v3p3conc%'")"
  if [ "$leftovers" != "0" ]; then
    echo "WARN  cleanup left $leftovers fixture rows; run 'pnpm supabase db reset'"
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

# run_parallel <statement>...  -> results in $TMP/out.N (stdout+stderr), $TMP/res.N (exit code)
run_parallel() {
  local n=0 stmt
  rm -f "$TMP"/res.* "$TMP"/out.*
  for stmt in "$@"; do
    n=$((n + 1))
    (
      psqlq -c "$stmt" > "$TMP/out.$n" 2>&1
      echo $? > "$TMP/res.$n"
    ) &
  done
  wait
}

ok_count() {
  local f ok=0
  for f in "$TMP"/res.*; do
    [ "$(cat "$f")" = "0" ] && ok=$((ok + 1))
  done
  echo "$ok"
}

new_payment() { # amount
  sql "insert into public.payments (client_id, purpose, amount, status, completed_at) values ('$CLIENT','ORDER_PAYMENT',$1,'SUCCEEDED',now()) returning id"
}

CLIENT="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT')" >/dev/null

# ---------------- A: amount limit ----------------
PAY_A="$(new_payment 100000)"
stmts=()
for i in 1 2 3 4 5 6 7 8; do
  stmts+=("select public.create_payment_reversal('$PAY_A', 20000, 'MANUAL_RECONCILIATION', '__v3p3conc_a$i')")
done
run_parallel "${stmts[@]}"
check "A: 8 parallel reversals of 20000 against 100000: exactly 5 succeed" "$(ok_count)" 5
check "A: reversed total never exceeds the Payment (100000)" \
  "$(sql "select coalesce(sum(amount),0)::bigint from public.payment_reversals where payment_id = '$PAY_A' and status in ('PENDING','SUCCEEDED')")" 100000
check "A: no deadlock" \
  "$(cat "$TMP"/out.* | grep -c -i 'deadlock')" 0

# ---------------- B: idempotency key ----------------
PAY_B="$(new_payment 50000)"
stmts=()
for _ in 1 2 3 4 5 6; do
  stmts+=("select public.create_payment_reversal('$PAY_B', 10000, 'MANUAL_RECONCILIATION', '__v3p3conc_b')")
done
run_parallel "${stmts[@]}"
check "B: 6 parallel requests with one key all succeed" "$(ok_count)" 6
check "B: exactly one reversal row exists for the key" \
  "$(sql "select count(*) from public.payment_reversals where idempotency_key = '__v3p3conc_b'")" 1

# ---------------- C: claim lease ----------------
REV_C="$(sql "select id from public.create_payment_reversal('$PAY_B', 10000, 'MANUAL_RECONCILIATION', '__v3p3conc_c')")"
stmts=()
for _ in 1 2 3 4 5 6; do
  stmts+=("select (public.claim_payment_reversal('$REV_C') ->> 'claimed')")
done
run_parallel "${stmts[@]}"
CLAIMED="$(cat "$TMP"/out.* | grep -c '^true')"
check "C: 6 parallel claims: exactly one is granted" "$CLAIMED" 1
check "C: the attempt was counted once" \
  "$(sql "select attempt_count from public.payment_reversals where id = '$REV_C'")" 1

# ---------------- D: success and failure reported in parallel ----------------
REV_D="$(sql "select id from public.create_payment_reversal('$PAY_B', 10000, 'MANUAL_RECONCILIATION', '__v3p3conc_d')")"
stmts=()
for i in 1 2 3 4; do
  stmts+=("select public.complete_payment_reversal('$REV_D', true, '__v3p3conc_pg_d')")
  stmts+=("select public.complete_payment_reversal('$REV_D', false, null, 'parallel failure $i')")
done
run_parallel "${stmts[@]}"
check "D: all 8 reports are accepted" "$(ok_count)" 8
check "D: a reported success is never lost (final SUCCEEDED)" \
  "$(sql "select status from public.payment_reversals where id = '$REV_D'")" SUCCEEDED
check "D: exactly one PG reference recorded" \
  "$(sql "select pg_reference from public.payment_reversals where id = '$REV_D'")" __v3p3conc_pg_d

# ---------------- E: retry vs new request for freed amount ----------------
PAY_E="$(new_payment 10000)"
REV_E="$(sql "select id from public.create_payment_reversal('$PAY_E', 10000, 'MANUAL_RECONCILIATION', '__v3p3conc_e1')")"
psqlq -c "select public.complete_payment_reversal('$REV_E', false, null, 'failed')" >/dev/null
run_parallel \
  "select public.retry_payment_reversal('$REV_E')" \
  "select public.create_payment_reversal('$PAY_E', 10000, 'MANUAL_RECONCILIATION', '__v3p3conc_e2')"
check "E: retry and a new request compete for the freed amount: exactly one wins" "$(ok_count)" 1
check "E: reversed total is exactly the payment amount" \
  "$(sql "select coalesce(sum(amount),0)::bigint from public.payment_reversals where payment_id = '$PAY_E' and status in ('PENDING','SUCCEEDED')")" 10000
check "E: no deadlock" "$(cat "$TMP"/out.* | grep -c -i 'deadlock')" 0

if [ "$FAILED" -ne 0 ]; then
  echo "v3 phase 3 concurrency check FAILED"
  exit 1
fi
echo "v3 phase 3 concurrency check PASSED"
