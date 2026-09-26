#!/usr/bin/env bash
# ============================================================
# Local verification: admin_restock_refund_item() under parallel sessions
# (migration 20260925150000_refund_item_restocks.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/refund_item_restocks_concurrency.sh
#
# Unlike refund_item_restocks.sql (single rolled-back transaction),
# this needs real concurrent sessions, so it COMMITS temporary
# fixtures (names start with "__conc") and removes them on exit.
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

CLIENT="" WH="" ORDER=""
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
set session_replication_role = replica;
delete from public.refund_item_restocks where refund_item_id in
  (select ri.id from public.refund_items ri join public.refund_requests rr on rr.id = ri.refund_request_id
    where rr.client_id = nullif('$CLIENT','')::uuid);
delete from public.refund_items where refund_request_id in
  (select id from public.refund_requests where client_id = nullif('$CLIENT','')::uuid);
delete from public.refund_requests where client_id = nullif('$CLIENT','')::uuid;
delete from public.order_item_ware_allocations where order_item_id in
  (select id from public.order_items where order_id = nullif('$ORDER','')::uuid);
delete from public.order_items where order_id = nullif('$ORDER','')::uuid;
delete from public.orders where id = nullif('$ORDER','')::uuid;
delete from public.wares where warehouse_id = nullif('$WH','')::uuid;
delete from public.warehouses where id = nullif('$WH','')::uuid;
delete from public.products where name like '__conc%';
delete from auth.users where id = nullif('$CLIENT','')::uuid;
SQL
  local leftovers
  leftovers="$(sql "select (select count(*) from public.wares where name like '__conc%') + (select count(*) from public.products where name like '__conc%') + (select count(*) from public.warehouses where name like '__conc%')")"
  if [ "$leftovers" != "0" ]; then
    echo "WARN  cleanup left $leftovers fixture rows; run 'pnpm supabase db reset'"
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

# ---------------- fixtures ----------------
CLIENT="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT')" >/dev/null

WH="$(sql "select public.create_warehouse('__conc warehouse')")"
W1="$(sql "select public.create_ware('$WH', '__conc W1', null, 'GENERAL', 10)")"
W2="$(sql "select public.create_ware('$WH', '__conc W2', null, 'GENERAL', 10)")"
W3="$(sql "select public.create_ware('$WH', '__conc W3', null, 'GENERAL', 10)")"

PRODUCT_JSON="$(sql "select public.admin_create_product('{\"name\":\"__conc product\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__CONC-1\"}]')")"
PRODUCT="$(sql "select ('$PRODUCT_JSON'::jsonb ->> 'productId')")"
VARIANT="$(sql "select ('$PRODUCT_JSON'::jsonb -> 'variantIds' ->> 0)")"

ORDER="$(sql "insert into public.orders (client_id, status, subtotal, total_amount) values ('$CLIENT','DELIVERED',7000,7000) returning id")"

# OrderItem 1: quantity 4 = W1 2 + W2 2, two refund items of 2.
OI1="$(sql "insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot) values ('$ORDER','$PRODUCT','$VARIANT',4,1000,4000,'__conc item 1') returning id")"
# OrderItem 2: quantity 3 = W3 3, one refund item of 3.
OI2="$(sql "insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot) values ('$ORDER','$PRODUCT','$VARIANT',3,1000,3000,'__conc item 2') returning id")"
psqlq -c "insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity) values ('$OI1','$W1',2),('$OI1','$W2',2),('$OI2','$W3',3)" >/dev/null

new_refund() { # order_item quantity -> "refund_id item_id"
  local rr ri
  rr="$(sql "insert into public.refund_requests (order_id, client_id, status, requested_amount) values ('$ORDER','$CLIENT','REQUESTED',1000) returning id")"
  ri="$(sql "insert into public.refund_items (refund_request_id, order_item_id, quantity, refund_amount) values ('$rr','$1',$2,1000) returning id")"
  psqlq -c "select public.admin_transition_refund_status('$rr','APPROVED')" >/dev/null
  echo "$rr $ri"
}

read -r R1 RI1 <<<"$(new_refund "$OI1" 2)"
read -r R2 RI2 <<<"$(new_refund "$OI1" 2)"
read -r R3 RI3 <<<"$(new_refund "$OI2" 3)"

# ---------------- parallel runner ----------------
# run_parallel <label> <call>...   each call = "refund item ware"
run_parallel() {
  local label="$1"; shift
  local n=0 call rr ri ww
  rm -f "$TMP"/res.*
  for call in "$@"; do
    read -r rr ri ww <<<"$call"
    n=$((n + 1))
    (
      psqlq -c "select ${RESTOCK_FN:-public.admin_restock_refund_item}('$rr','$ri','$ww',1)" >/dev/null 2>&1
      echo $? > "$TMP/res.$n"
    ) &
  done
  wait
  local ok=0 f
  for f in "$TMP"/res.*; do
    [ "$(cat "$f")" = "0" ] && ok=$((ok + 1))
  done
  echo "$ok"
}

stock() { sql "select current_stock from public.wares where id = '$1'"; }
restocked_ware() { sql "select coalesce(sum(quantity),0) from public.refund_item_restocks where ware_id = '$1'"; }

# ---------------- Phase A ----------------
# 6 parallel calls into W1 across two refund items (2 each): W1 is allocated 2,
# so exactly 2 may succeed even though each refund item alone would allow 2.
calls=()
for _ in 1 2 3; do calls+=("$R1 $RI1 $W1" "$R2 $RI2 $W1"); done
OK_A="$(run_parallel A "${calls[@]}")"
check "A: parallel restocks across refund items stop at the Ware allocation" "$OK_A" 2
check "A: W1 stock = 10 + successes" "$(stock "$W1")" 12
check "A: W1 restock records sum to 2" "$(restocked_ware "$W1")" 2

# ---------------- Phase B ----------------
# Remaining refund capacity is 2 (4 refunded - 2 restocked); W2 is allocated 2.
calls=()
for _ in 1 2 3; do calls+=("$R1 $RI1 $W2" "$R2 $RI2 $W2"); done
OK_B="$(run_parallel B "${calls[@]}")"
check "B: parallel restocks stop at the remaining refunded quantity" "$OK_B" 2
check "B: W2 stock = 10 + successes" "$(stock "$W2")" 12

# ---------------- Phase C ----------------
# One refund item of 3 hammered by 10 identical parallel calls.
calls=()
for _ in $(seq 1 10); do calls+=("$R3 $RI3 $W3"); done
OK_C="$(run_parallel C "${calls[@]}")"
check "C: identical parallel calls cannot exceed the refunded quantity" "$OK_C" 3
check "C: W3 stock = 10 + 3" "$(stock "$W3")" 13

# ---------------- invariants ----------------
check "no refund item restocked beyond its quantity" \
  "$(sql "select count(*) from public.refund_items ri where ri.id in ('$RI1','$RI2','$RI3') and (select coalesce(sum(quantity),0) from public.refund_item_restocks r where r.refund_item_id = ri.id) > ri.quantity")" 0
check "no (OrderItem, Ware) restocked beyond its allocation" \
  "$(sql "select count(*) from public.order_item_ware_allocations a where a.order_item_id in ('$OI1','$OI2') and (select coalesce(sum(r.quantity),0) from public.refund_item_restocks r join public.refund_items ri on ri.id = r.refund_item_id where ri.order_item_id = a.order_item_id and r.ware_id = a.ware_id) > a.quantity")" 0

if [ "$FAILED" -ne 0 ]; then
  echo "refund restock concurrency check FAILED"
  exit 1
fi
echo "refund restock concurrency check PASSED"
