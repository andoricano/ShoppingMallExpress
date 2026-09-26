#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 Phase 6 Admin fulfillment under parallel sessions
# (migration 20260926180000_v3_phase6_admin_fulfillment.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/v3_phase6_concurrency.sh
#
# Covers what a single transaction cannot show:
#   A. an Admin double click: N parallel PENDING -> PROCESSING on one Order
#   B. Client cancel racing the PROCESSING transition
#   C. Admin allocation racing new Orders for scarce stock
#   D. allocation racing the PROCESSING transition of the same Order
#   E. many Orders entering PROCESSING in parallel on shared Wares
#
# Needs real concurrent sessions, so it COMMITS temporary fixtures (names start
# with "__v3p6conc") and removes them on exit.
# If cleanup ever fails, `pnpm supabase db reset` restores the local DB.
#
# Uses the local Supabase DB container (no host psql required):
#   DB_CONTAINER=supabase_db_ShoppingEx (override via env)
# ============================================================
set -uo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
TMP="$(mktemp -d)"
FAILED=0

psqlq() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -qtA -v ON_ERROR_STOP=1 "$@"; }
sql() { psqlq -c "$1" | head -n1 | tr -d '[:space:]'; }

check() {
  local name="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "PASS  $name (got $actual)"
  else
    echo "FAIL  $name (expected $expected, got $actual)"
    FAILED=1
  fi
}

CLIENT="" ADMIN="" WH="" POST="" PRODUCT_NAME="__v3p6conc product"
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
begin;
alter table public.order_item_ware_allocations disable trigger order_item_ware_allocations_freeze_after_processing;
delete from public.order_cancellations where order_id in (select id from public.orders where client_id = nullif('$CLIENT','')::uuid);
delete from public.payment_reversals where payment_id in (select id from public.payments where client_id = nullif('$CLIENT','')::uuid);
delete from public.order_item_ware_allocations where order_item_id in
  (select oi.id from public.order_items oi join public.orders o on o.id = oi.order_id where o.client_id = nullif('$CLIENT','')::uuid);
delete from public.order_items where order_id in (select id from public.orders where client_id = nullif('$CLIENT','')::uuid);
update public.payments set order_id = null where client_id = nullif('$CLIENT','')::uuid;
delete from public.orders where client_id = nullif('$CLIENT','')::uuid;
delete from public.payments where client_id = nullif('$CLIENT','')::uuid;
delete from public.product_post_products where product_post_id = nullif('$POST','')::uuid;
delete from public.product_posts where id = nullif('$POST','')::uuid;
delete from public.product_variant_wares where ware_id in (select id from public.wares where warehouse_id = nullif('$WH','')::uuid);
delete from public.wares where warehouse_id = nullif('$WH','')::uuid;
delete from public.warehouses where id = nullif('$WH','')::uuid;
delete from public.products where name = '$PRODUCT_NAME';
delete from auth.users where id in (nullif('$CLIENT','')::uuid, nullif('$ADMIN','')::uuid);
alter table public.order_item_ware_allocations enable trigger order_item_ware_allocations_freeze_after_processing;
commit;
SQL
  local leftovers
  leftovers="$(sql "select (select count(*) from public.wares where name like '__v3p6conc%') + (select count(*) from public.products where name like '__v3p6conc%') + (select count(*) from public.warehouses where name like '__v3p6conc%') + (select count(*) from public.payments where client_id = nullif('$CLIENT','')::uuid)")"
  [ "$leftovers" != "0" ] && echo "WARN  cleanup left $leftovers fixture rows; run 'pnpm supabase db reset'"
  rm -rf "$TMP"
}
trap cleanup EXIT

run_parallel() {
  local n=0 stmt
  rm -f "$TMP"/res.* "$TMP"/out.*
  for stmt in "$@"; do
    n=$((n + 1))
    ( psqlq -c "$stmt" > "$TMP/out.$n" 2>&1; echo $? > "$TMP/res.$n" ) &
  done
  wait
}
ok_count() { local f ok=0; for f in "$TMP"/res.*; do [ "$(cat "$f")" = "0" ] && ok=$((ok + 1)); done; echo "$ok"; }
count_out() { cat "$TMP"/out.* | grep -c "$@"; }

ADDR="{\"recipient\":\"__v3p6conc\",\"address\":\"Seoul\"}"
items() {
  local out="" first=1
  while [ $# -ge 2 ]; do
    [ $first -eq 0 ] && out="$out,"
    out="$out{\"productId\":\"$PRODUCT\",\"productVariantId\":\"$1\",\"quantity\":$2}"
    first=0; shift 2
  done
  echo "[$out]"
}
new_order() { # items-json -> order id (checkout Payment + PG success + finalize)
  local id
  id="$(sql "select id from public.create_checkout_payment('$CLIENT', '$1'::jsonb)")"
  psqlq -c "select public.complete_checkout_payment('$CLIENT', '$id', true, '__v3p6conc_cb_' || gen_random_uuid())" >/dev/null
  sql "select public.finalize_order('$CLIENT', '$id', '$1'::jsonb, '$ADDR'::jsonb) ->> 'order_id'"
}
payment_of() { sql "select payment_id from public.orders where id = '$1'"; }
stock() { sql "select current_stock || '/' || reserved_stock from public.wares where id = '$1'"; }
adv_sql() { echo "select public.admin_advance_order('$1', '$2') ->> 'outcome'"; }
paid_payment() { # items-json -> succeeded Payment id (Stage 1 + PG success)
  local id
  id="$(sql "select id from public.create_checkout_payment('$CLIENT', '$1'::jsonb)")"
  psqlq -c "select public.complete_checkout_payment('$CLIENT', '$id', true, '__v3p6conc_cb_' || gen_random_uuid())" >/dev/null
  echo "$id"
}
finalize_sql() { echo "select public.finalize_order('$CLIENT', '$1', '$2'::jsonb, '$ADDR'::jsonb) ->> 'outcome'"; }
cancel_sql() { echo "select public.cancel_pending_order('$1', '$2', '$3', 'concurrency') ->> 'outcome'"; }

# ---------------- fixtures ----------------
CLIENT="$(sql "select gen_random_uuid()")"; ADMIN="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT'), ('$ADMIN')" >/dev/null
WH="$(sql "select public.create_warehouse('__v3p6conc warehouse')")"
W1="$(sql "select public.create_ware('$WH', '__v3p6conc W1', null, 'GENERAL', 10)")"
W2="$(sql "select public.create_ware('$WH', '__v3p6conc W2', null, 'GENERAL', 10)")"
W3="$(sql "select public.create_ware('$WH', '__v3p6conc W3', null, 'GENERAL', 100)")"
W4="$(sql "select public.create_ware('$WH', '__v3p6conc W4', null, 'GENERAL', 100)")"
PJ="$(sql "select public.admin_create_product('{\"name\":\"$PRODUCT_NAME\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__V3P6C-1\"},{\"price\":500,\"skuCode\":\"__V3P6C-2\"},{\"price\":300,\"skuCode\":\"__V3P6C-3\"},{\"price\":200,\"skuCode\":\"__V3P6C-4\"}]')")"
PRODUCT="$(sql "select ('$PJ'::jsonb ->> 'productId')")"
V1="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 0)")"; V2="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 1)")"
V3="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 2)")"; V4="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 3)")"
psqlq -c "select public.link_product_variant_ware('$V1','$W1')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V2','$W2')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V3','$W3')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V4','$W4')" >/dev/null
POST="$(sql "insert into public.product_posts (title, status) values ('__v3p6conc post','PUBLISHED') returning id")"
psqlq -c "insert into public.product_post_products (product_post_id, product_id) values ('$POST','$PRODUCT')" >/dev/null

# ---------------- A: Admin double click ----------------
O_A="$(new_order "$(items "$V1" 3)")"
stmts=(); for _ in 1 2 3 4 5 6 7 8; do stmts+=("$(adv_sql "$O_A" PROCESSING)"); done
run_parallel "${stmts[@]}"
check "A: 8 parallel PROCESSING requests all succeed (no transition error)" "$(ok_count)" 8
check "A: exactly one performed the transition, seven were UNCHANGED" "$(count_out '^TRANSITIONED')/$(count_out '^UNCHANGED')" "1/7"
check "A: the reservation was consumed exactly once (Ware 7/0)" "$(stock "$W1")" "7/0"

# ---------------- B: Client cancel races PROCESSING ----------------
B_BAD=0; B_CANCELLED=0; B_PROCESSING=0
for round in 1 2 3 4 5 6 7 8; do
  O_B="$(new_order "$(items "$V3" 2)")"
  DELAY="0"; [ $((round % 2)) -eq 1 ] && DELAY="0.3"
  run_parallel \
    "$(cancel_sql "$O_B" "$CLIENT" CLIENT)" \
    "select pg_sleep($DELAY); $(adv_sql "$O_B" PROCESSING)"
  ST="$(sql "select status from public.orders where id = '$O_B'")"
  REV="$(sql "select count(*) from public.payment_reversals where order_id = '$O_B'")"
  ROWS="$(sql "select count(*) from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id where oi.order_id = '$O_B'")"
  if [ "$ST" = "CANCELLED" ] && [ "$REV" = "1" ] && [ "$ROWS" = "0" ]; then B_CANCELLED=$((B_CANCELLED + 1))
  elif [ "$ST" = "PROCESSING" ] && [ "$REV" = "0" ] && [ "$ROWS" = "1" ]; then B_PROCESSING=$((B_PROCESSING + 1))
  else B_BAD=$((B_BAD + 1)); fi
done
check "B: every round ends CANCELLED (released, one reversal) or PROCESSING (consumed, no reversal), never both" "$B_BAD" 0
echo "INFO  B: cancel won $B_CANCELLED round(s), PROCESSING won $B_PROCESSING round(s)"
check "B: Ware accounting is exact (current = 100 - consumed by PROCESSING Orders, reserved = 0)" \
  "$(sql "select current_stock || '/' || reserved_stock from public.wares where id = '$W3'")" "$((100 - 2 * B_PROCESSING))/0"

# ---------------- C: Admin allocation races new Orders for scarce stock ----------------
# W2 has 10. Three short Orders hold nothing, then compete with new Orders.
psqlq -c "update public.wares set current_stock = 0 where id = '$W2' and reserved_stock = 0" >/dev/null
SHORT=()
for _ in 1 2 3; do SHORT+=("$(new_order "$(items "$V2" 4)")"); done
psqlq -c "select public.adjust_ware_stock('$W2', 6)" >/dev/null
stmts=()
for o in "${SHORT[@]}"; do stmts+=("select public.allocate_order_stock('$o')"); done
IT_NEW="$(items "$V2" 2)"
for _ in 1 2 3; do stmts+=("$(finalize_sql "$(paid_payment "$IT_NEW")" "$IT_NEW")"); done
run_parallel "${stmts[@]}"
check "C: 3 Admin allocations and 3 new Orders (12 + 6 units wanted, 6 in stock) all succeed" "$(ok_count)" 6
check "C: the Ware is exactly fully reserved and never over-reserved (6/6)" "$(sql "select current_stock || '/' || reserved_stock from public.wares where id = '$W2'")" "6/6"
check "C: allocation rows sum to 6; no OrderItem is allocated above its quantity" \
  "$(sql "select coalesce(sum(a.quantity),0) from public.order_item_ware_allocations a where a.ware_id = '$W2'")/$(sql "select count(*) from public.order_items oi where oi.product_variant_id = '$V2' and coalesce((select sum(quantity) from public.order_item_ware_allocations a where a.order_item_id = oi.id),0) > oi.quantity")" "6/0"
check "C: no deadlock" "$(count_out -i 'deadlock')" 0

# ---------------- D: allocation / new stock race the PROCESSING transition of one Order ----------------
D_BAD=0; D_PROC=0; D_PEND=0
for round in 1 2 3 4 5 6; do
  # only 1 unit is free on W4, so a 2-unit Order starts short by 1
  psqlq -c "update public.wares set current_stock = reserved_stock + 1 where id = '$W4'" >/dev/null
  O_D="$(new_order "$(items "$V4" 2)")"
  run_parallel "select public.adjust_ware_stock('$W4', 1)" "select public.allocate_order_stock('$O_D')" \
               "select pg_sleep(0.05); $(adv_sql "$O_D" PROCESSING)" "select public.allocate_order_stock('$O_D')"
  ST="$(sql "select status from public.orders where id = '$O_D'")"
  SHORT_Q="$(sql "select shortage_quantity from public.get_order_shortage('$O_D')")"
  if [ "$ST" = "PROCESSING" ] && [ "$SHORT_Q" = "0" ]; then D_PROC=$((D_PROC + 1))
  elif [ "$ST" = "PENDING" ]; then D_PEND=$((D_PEND + 1))
  else D_BAD=$((D_BAD + 1)); fi
done
check "D: an Order is never PROCESSING with shortage, whichever call wins" "$D_BAD" 0
echo "INFO  D: PROCESSING won $D_PROC round(s), the Order stayed PENDING (short) in $D_PEND round(s)"
check "D: reserved never exceeds current and never goes negative on the shared Ware" \
  "$(sql "select count(*) from public.wares where id = '$W4' and (reserved_stock > current_stock or reserved_stock < 0 or current_stock < 0)")" 0

# ---------------- E: many Orders enter PROCESSING in parallel on shared Wares ----------------
psqlq -c "update public.wares set current_stock = 100, reserved_stock = 0 where id in ('$W3') and reserved_stock = 0" >/dev/null
ORDERS_E=()
for i in 1 2 3 4 5 6; do
  if [ $((i % 2)) -eq 0 ]; then IT="$(items "$V3" 1 "$V4" 1)"; else IT="$(items "$V4" 1 "$V3" 1)"; fi
  ORDERS_E+=("$(new_order "$IT")")
done
BEFORE_CUR="$(sql "select current_stock from public.wares where id = '$W3'")"
FULL_E=0
for o in "${ORDERS_E[@]}"; do
  [ "$(sql "select shortage_quantity from public.get_orders_shortage(array['$o']::uuid[])")" = "0" ] && FULL_E=$((FULL_E + 1))
done
stmts=(); for o in "${ORDERS_E[@]}"; do stmts+=("$(adv_sql "$o" PROCESSING)"); done
run_parallel "${stmts[@]}"
check "E: parallel PROCESSING transitions: every fully allocated Order succeeds, the others refuse cleanly" "$(ok_count)" "$FULL_E"
check "E: no deadlock" "$(count_out -i 'deadlock')" 0
check "E: reserved never exceeds current on the shared Wares" \
  "$(sql "select count(*) from public.wares where id in ('$W3','$W4') and (reserved_stock > current_stock or current_stock < 0)")" 0
check "E: each entered Order consumed exactly its quantity from W3 (current dropped by the number of PROCESSING Orders)" \
  "$(sql "select $BEFORE_CUR - current_stock from public.wares where id = '$W3'")" "$FULL_E"

if [ "$FAILED" -ne 0 ]; then
  echo "v3 phase 6 concurrency check FAILED"
  exit 1
fi
echo "v3 phase 6 concurrency check PASSED"
