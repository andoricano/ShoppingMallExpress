#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 Phase 1 constraints under parallel sessions
# (migration 20260926130000_v3_phase1_schema_foundation.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/v3_phase1_concurrency.sh
#
# Covers what a single transaction cannot show:
#   A. allocation total per OrderItem <= quantity (BR-07)
#   B. reversal total per Payment <= payment amount (BR-34)
#   C. one Order per Payment (BR-45)
#
# Needs real concurrent sessions, so it COMMITS temporary fixtures
# (names/keys start with "__v3conc") and removes them on exit.
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

CLIENT="" WH="" PRODUCT_NAME="__v3conc product"
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
delete from public.payment_reversals where idempotency_key like '__v3conc%';
delete from public.orders where client_id = nullif('$CLIENT','')::uuid and payment_id is not null;
delete from public.order_item_ware_allocations where order_item_id in
  (select oi.id from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.client_id = nullif('$CLIENT','')::uuid);
delete from public.order_items where order_id in
  (select id from public.orders where client_id = nullif('$CLIENT','')::uuid);
delete from public.orders where client_id = nullif('$CLIENT','')::uuid;
delete from public.payments where client_id = nullif('$CLIENT','')::uuid;
delete from public.wares where warehouse_id = nullif('$WH','')::uuid;
delete from public.warehouses where id = nullif('$WH','')::uuid;
delete from public.products where name = '$PRODUCT_NAME';
delete from auth.users where id = nullif('$CLIENT','')::uuid;
SQL
  local leftovers
  leftovers="$(sql "select (select count(*) from public.wares where name like '__v3conc%') + (select count(*) from public.products where name like '__v3conc%') + (select count(*) from public.warehouses where name like '__v3conc%') + (select count(*) from public.payment_reversals where idempotency_key like '__v3conc%')")"
  if [ "$leftovers" != "0" ]; then
    echo "WARN  cleanup left $leftovers fixture rows; run 'pnpm supabase db reset'"
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

# run_parallel <statement>...  -> number of statements that succeeded
run_parallel() {
  local n=0 stmt f ok=0
  rm -f "$TMP"/res.*
  for stmt in "$@"; do
    n=$((n + 1))
    (
      psqlq -c "$stmt" >/dev/null 2>&1
      echo $? > "$TMP/res.$n"
    ) &
  done
  wait
  for f in "$TMP"/res.*; do
    [ "$(cat "$f")" = "0" ] && ok=$((ok + 1))
  done
  echo "$ok"
}

# ---------------- fixtures ----------------
CLIENT="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT')" >/dev/null

WH="$(sql "select public.create_warehouse('__v3conc warehouse')")"
WARES=()
for i in 1 2 3 4 5 6; do
  WARES+=("$(sql "select public.create_ware('$WH', '__v3conc W$i', null, 'GENERAL', 10)")")
done

PRODUCT_JSON="$(sql "select public.admin_create_product('{\"name\":\"$PRODUCT_NAME\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__V3CONC-1\"}]')")"
PRODUCT="$(sql "select ('$PRODUCT_JSON'::jsonb ->> 'productId')")"
VARIANT="$(sql "select ('$PRODUCT_JSON'::jsonb -> 'variantIds' ->> 0)")"

# ---------------- A: allocation bound ----------------
ORDER_A="$(sql "insert into public.orders (client_id, status, subtotal, total_amount) values ('$CLIENT','PENDING',4000,4000) returning id")"
OI="$(sql "insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot) values ('$ORDER_A','$PRODUCT','$VARIANT',4,1000,4000,'__v3conc item') returning id")"

stmts=()
for w in "${WARES[@]}"; do
  stmts+=("insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity) values ('$OI','$w',1)")
done
OK_A="$(run_parallel "${stmts[@]}")"
check "A: 6 parallel allocations of 1 into an OrderItem of 4 stop at 4" "$OK_A" 4
check "A: allocation total equals the OrderItem quantity" \
  "$(sql "select coalesce(sum(quantity),0) from public.order_item_ware_allocations where order_item_id = '$OI'")" 4

# ---------------- B: reversal limit ----------------
PAY_B="$(sql "insert into public.payments (client_id, purpose, amount, status, completed_at) values ('$CLIENT','ORDER_PAYMENT',10000,'SUCCEEDED',now()) returning id")"
stmts=()
for i in 1 2 3 4 5 6 7 8; do
  stmts+=("insert into public.payment_reversals (payment_id, amount, reason_type, idempotency_key) values ('$PAY_B',2000,'MANUAL_RECONCILIATION','__v3conc_rev_$i')")
done
OK_B="$(run_parallel "${stmts[@]}")"
check "B: 8 parallel reversals of 2000 against a 10000 Payment stop at 5" "$OK_B" 5
check "B: reversal total does not exceed the Payment amount" \
  "$(sql "select (coalesce(sum(amount),0) <= 10000)::text from public.payment_reversals where payment_id = '$PAY_B' and status in ('PENDING','SUCCEEDED')")" true

# ---------------- C: one Order per Payment ----------------
PAY_C="$(sql "insert into public.payments (client_id, purpose, amount, status, completed_at) values ('$CLIENT','ORDER_PAYMENT',3000,'SUCCEEDED',now()) returning id")"
ORDERS_C=()
for i in 1 2 3 4 5; do
  ORDERS_C+=("$(sql "insert into public.orders (client_id, status, subtotal, total_amount) values ('$CLIENT','PENDING',3000,3000) returning id")")
done
stmts=()
for o in "${ORDERS_C[@]}"; do
  stmts+=("update public.orders set payment_id = '$PAY_C' where id = '$o'")
done
OK_C="$(run_parallel "${stmts[@]}")"
check "C: 5 parallel Orders linking the same Payment: exactly 1 wins" "$OK_C" 1
check "C: exactly one Order references the Payment" \
  "$(sql "select count(*) from public.orders where payment_id = '$PAY_C'")" 1

if [ "$FAILED" -ne 0 ]; then
  echo "v3 phase 1 concurrency check FAILED"
  exit 1
fi
echo "v3 phase 1 concurrency check PASSED"
