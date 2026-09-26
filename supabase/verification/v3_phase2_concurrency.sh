#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 Phase 2 allocation under parallel sessions
# (migration 20260926140000_v3_phase2_stock_allocation_core.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/v3_phase2_concurrency.sh
#
# Covers what a single transaction cannot show:
#   A. parallel Stage 2 allocations on one Ware never double-take or
#      over-reserve (BR-10, BR-43)
#   B. parallel releases of one Order release exactly once (BR-17)
#   C. parallel additional allocations of one OrderItem never exceed
#      its quantity or the available stock
#
# Needs real concurrent sessions, so it COMMITS temporary fixtures
# (names start with "__v3p2conc") and removes them on exit.
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

CLIENT="" WH="" PRODUCT_NAME="__v3p2conc product"
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
delete from public.order_item_ware_allocations where order_item_id in
  (select oi.id from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.client_id = nullif('$CLIENT','')::uuid);
delete from public.order_items where order_id in
  (select id from public.orders where client_id = nullif('$CLIENT','')::uuid);
delete from public.orders where client_id = nullif('$CLIENT','')::uuid;
delete from public.product_variant_wares where ware_id in
  (select id from public.wares where warehouse_id = nullif('$WH','')::uuid);
delete from public.wares where warehouse_id = nullif('$WH','')::uuid;
delete from public.warehouses where id = nullif('$WH','')::uuid;
delete from public.products where name = '$PRODUCT_NAME';
delete from auth.users where id = nullif('$CLIENT','')::uuid;
SQL
  local leftovers
  leftovers="$(sql "select (select count(*) from public.wares where name like '__v3p2conc%') + (select count(*) from public.products where name like '__v3p2conc%') + (select count(*) from public.warehouses where name like '__v3p2conc%')")"
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

stock() { sql "select current_stock || '/' || reserved_stock from public.wares where id = '$1'"; }

# ---------------- fixtures ----------------
CLIENT="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT')" >/dev/null

WH="$(sql "select public.create_warehouse('__v3p2conc warehouse')")"
WARE_A="$(sql "select public.create_ware('$WH', '__v3p2conc A', null, 'GENERAL', 10)")"
WARE_C="$(sql "select public.create_ware('$WH', '__v3p2conc C', null, 'GENERAL', 4)")"

PRODUCT_JSON="$(sql "select public.admin_create_product('{\"name\":\"$PRODUCT_NAME\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__V3P2CONC-1\"},{\"price\":1000,\"skuCode\":\"__V3P2CONC-2\"}]')")"
PRODUCT="$(sql "select ('$PRODUCT_JSON'::jsonb ->> 'productId')")"
V_A="$(sql "select ('$PRODUCT_JSON'::jsonb -> 'variantIds' ->> 0)")"
V_C="$(sql "select ('$PRODUCT_JSON'::jsonb -> 'variantIds' ->> 1)")"
psqlq -c "select public.link_product_variant_ware('$V_A','$WARE_A')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V_C','$WARE_C')" >/dev/null

new_order() { # variant qty -> "order_id item_id"
  local o i
  o="$(sql "insert into public.orders (client_id, status, subtotal, total_amount) values ('$CLIENT','PENDING',1000,1000) returning id")"
  i="$(sql "insert into public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot) values ('$o','$PRODUCT','$1',$2,1000,1000,'__v3p2conc item') returning id")"
  echo "$o $i"
}

# ---------------- A: parallel Stage 2 allocation ----------------
ORDERS=()
for _ in 1 2 3 4 5 6 7 8; do
  read -r O I <<<"$(new_order "$V_A" 2)"
  ORDERS+=("$O")
done
stmts=()
for o in "${ORDERS[@]}"; do stmts+=("select public.allocate_order_stock('$o')"); done
OK_A="$(run_parallel "${stmts[@]}")"
check "A: all 8 parallel allocations succeed (shortage never raises)" "$OK_A" 8
check "A: Ware ends 10/10 (16 demanded, 10 in stock, never over-reserved)" "$(stock "$WARE_A")" "10/10"
check "A: allocation rows sum to 10" \
  "$(sql "select coalesce(sum(a.quantity),0) from public.order_item_ware_allocations a where a.ware_id = '$WARE_A'")" 10
check "A: no OrderItem is allocated above its quantity" \
  "$(sql "select count(*) from public.order_items oi where oi.order_id in ('$(IFS=,; echo "${ORDERS[*]}" | sed "s/,/','/g")') and coalesce((select sum(quantity) from public.order_item_ware_allocations a where a.order_item_id = oi.id),0) > oi.quantity")" 0
check "A: reserved_stock equals the allocations of PENDING Orders" \
  "$(sql "select (select reserved_stock from public.wares where id = '$WARE_A') = (select coalesce(sum(a.quantity),0) from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id join public.orders o on o.id = oi.order_id where a.ware_id = '$WARE_A' and o.status = 'PENDING')")" t

# ---------------- B: parallel releases of one Order ----------------
FULL_ORDER="$(sql "select oi.order_id from public.order_items oi join public.order_item_ware_allocations a on a.order_item_id = oi.id where a.ware_id = '$WARE_A' and oi.order_id in ('$(IFS=,; echo "${ORDERS[*]}" | sed "s/,/','/g")') and a.quantity = 2 limit 1")"
stmts=()
for _ in 1 2 3 4 5; do stmts+=("select public.release_order_allocation('$FULL_ORDER')"); done
OK_B="$(run_parallel "${stmts[@]}")"
check "B: 5 parallel releases of one Order all succeed" "$OK_B" 5
check "B: reserved released exactly once (10 -> 8)" "$(stock "$WARE_A")" "10/8"

# ---------------- C: parallel additional allocation of one OrderItem ----------------
read -r O_C I_C <<<"$(new_order "$V_C" 6)"
stmts=()
for _ in 1 2 3 4 5; do stmts+=("select public.allocate_order_item_stock('$I_C')"); done
OK_C="$(run_parallel "${stmts[@]}")"
check "C: 5 parallel allocations of one OrderItem all succeed" "$OK_C" 5
check "C: allocated exactly the 4 in stock, Ware 4/4" "$(stock "$WARE_C")" "4/4"
check "C: OrderItem shortage is 2" \
  "$(sql "select shortage_quantity from public.get_order_shortage('$O_C')")" 2

if [ "$FAILED" -ne 0 ]; then
  echo "v3 phase 2 concurrency check FAILED"
  exit 1
fi
echo "v3 phase 2 concurrency check PASSED"
