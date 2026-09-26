#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 Phase 5 Cancel under parallel sessions
# (migration 20260926170000_v3_phase5_order_cancel.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/v3_phase5_concurrency.sh
#
# Covers what a single transaction cannot show:
#   A. a double click / retry storm: N parallel cancels of one Order
#   B. Client and Admin cancelling at the same moment
#   C. cancel racing the PROCESSING transition (consume + status update)
#   D. parallel cancels of many multi-item Orders on shared Wares
#   E. cancel racing repeated finalize calls of the same Payment
#
# Needs real concurrent sessions, so it COMMITS temporary fixtures (names start
# with "__v3p5conc") and removes them on exit.
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

CLIENT="" ADMIN="" WH="" POST="" PRODUCT_NAME="__v3p5conc product"
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
  leftovers="$(sql "select (select count(*) from public.wares where name like '__v3p5conc%') + (select count(*) from public.products where name like '__v3p5conc%') + (select count(*) from public.warehouses where name like '__v3p5conc%') + (select count(*) from public.payments where client_id = nullif('$CLIENT','')::uuid)")"
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

ADDR="{\"recipient\":\"__v3p5conc\",\"address\":\"Seoul\"}"
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
  psqlq -c "select public.complete_checkout_payment('$CLIENT', '$id', true, '__v3p5conc_cb_' || gen_random_uuid())" >/dev/null
  sql "select public.finalize_order('$CLIENT', '$id', '$1'::jsonb, '$ADDR'::jsonb) ->> 'order_id'"
}
payment_of() { sql "select payment_id from public.orders where id = '$1'"; }
stock() { sql "select current_stock || '/' || reserved_stock from public.wares where id = '$1'"; }
cancel_sql() { echo "select public.cancel_pending_order('$1', '$2', '$3', 'concurrency') ->> 'outcome'"; }

# ---------------- fixtures ----------------
CLIENT="$(sql "select gen_random_uuid()")"; ADMIN="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT'), ('$ADMIN')" >/dev/null
WH="$(sql "select public.create_warehouse('__v3p5conc warehouse')")"
W1="$(sql "select public.create_ware('$WH', '__v3p5conc W1', null, 'GENERAL', 10)")"
W2="$(sql "select public.create_ware('$WH', '__v3p5conc W2', null, 'GENERAL', 10)")"
W3="$(sql "select public.create_ware('$WH', '__v3p5conc W3', null, 'GENERAL', 100)")"
W4="$(sql "select public.create_ware('$WH', '__v3p5conc W4', null, 'GENERAL', 100)")"
PJ="$(sql "select public.admin_create_product('{\"name\":\"$PRODUCT_NAME\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__V3P5C-1\"},{\"price\":500,\"skuCode\":\"__V3P5C-2\"},{\"price\":300,\"skuCode\":\"__V3P5C-3\"},{\"price\":200,\"skuCode\":\"__V3P5C-4\"}]')")"
PRODUCT="$(sql "select ('$PJ'::jsonb ->> 'productId')")"
V1="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 0)")"; V2="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 1)")"
V3="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 2)")"; V4="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 3)")"
psqlq -c "select public.link_product_variant_ware('$V1','$W1')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V2','$W2')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V3','$W3')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V4','$W4')" >/dev/null
POST="$(sql "insert into public.product_posts (title, status) values ('__v3p5conc post','PUBLISHED') returning id")"
psqlq -c "insert into public.product_post_products (product_post_id, product_id) values ('$POST','$PRODUCT')" >/dev/null

# ---------------- A: double click / retry storm ----------------
O_A="$(new_order "$(items "$V1" 3)")"
stmts=(); for _ in 1 2 3 4 5 6 7 8; do stmts+=("$(cancel_sql "$O_A" "$CLIENT" CLIENT)"); done
run_parallel "${stmts[@]}"
check "A: 8 parallel cancels of one Order all succeed (no transition error)" "$(ok_count)" 8
check "A: exactly one cancelled it" "$(count_out '^CANCELLED')" 1
check "A: the other 7 got ALREADY_CANCELLED" "$(count_out '^ALREADY_CANCELLED')" 7
check "A: the allocation was released once (Ware 10/0)" "$(stock "$W1")" "10/0"
check "A: exactly one ORDER_CANCEL reversal, full amount" \
  "$(sql "select count(*) || '/' || coalesce(sum(amount)::bigint,0) from public.payment_reversals where order_id = '$O_A' and reason_type = 'ORDER_CANCEL'")" "1/3000"
check "A: exactly one cancellation record" "$(sql "select count(*) from public.order_cancellations where order_id = '$O_A'")" 1

# ---------------- B: Client and Admin at the same moment ----------------
O_B="$(new_order "$(items "$V2" 4)")"
stmts=(); for _ in 1 2 3 4; do stmts+=("$(cancel_sql "$O_B" "$CLIENT" CLIENT)" "$(cancel_sql "$O_B" "$ADMIN" ADMIN)"); done
run_parallel "${stmts[@]}"
check "B: 4 Client + 4 Admin cancels all succeed" "$(ok_count)" 8
check "B: one CANCELLED, seven ALREADY_CANCELLED" "$(count_out '^CANCELLED')/$(count_out '^ALREADY_CANCELLED')" "1/7"
check "B: exactly one release (Ware 10/0), one reversal, one actor record" \
  "$(stock "$W2") $(sql "select count(*) from public.payment_reversals where order_id = '$O_B'") $(sql "select count(*) from public.order_cancellations where order_id = '$O_B'")" "10/0 1 1"

# ---------------- C: cancel races the PROCESSING transition ----------------
C_BAD=0; C_CANCELLED=0; C_PROCESSING=0
for round in 1 2 3 4 5 6 7 8; do
  O_C="$(new_order "$(items "$V3" 2)")"
  # odd rounds: PROCESSING starts a little late, so the cancel can win; even rounds: no delay
  DELAY="0"; [ $((round % 2)) -eq 1 ] && DELAY="0.3"
  run_parallel \
    "$(cancel_sql "$O_C" "$CLIENT" CLIENT)" \
    "select pg_sleep($DELAY); begin; select public.consume_order_allocation('$O_C'); update public.orders set status = 'PROCESSING' where id = '$O_C'; commit;"
  ST="$(sql "select status from public.orders where id = '$O_C'")"
  REV="$(sql "select count(*) from public.payment_reversals where order_id = '$O_C'")"
  ROWS="$(sql "select count(*) from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id where oi.order_id = '$O_C'")"
  if [ "$ST" = "CANCELLED" ] && [ "$REV" = "1" ] && [ "$ROWS" = "0" ]; then C_CANCELLED=$((C_CANCELLED + 1))
  elif [ "$ST" = "PROCESSING" ] && [ "$REV" = "0" ] && [ "$ROWS" = "1" ]; then C_PROCESSING=$((C_PROCESSING + 1))
  else C_BAD=$((C_BAD + 1)); fi
done
check "C: every round ends either CANCELLED (released, one reversal) or PROCESSING (consumed, no reversal), never both" "$C_BAD" 0
echo "INFO  C: cancel won $C_CANCELLED round(s), PROCESSING won $C_PROCESSING round(s)"
check "C: Ware accounting is exact (current = 100 - consumed by PROCESSING Orders, reserved = 0)" \
  "$(sql "select current_stock || '/' || reserved_stock from public.wares where id = '$W3'")" "$((100 - 2 * C_PROCESSING))/0"

# ---------------- D: many multi-item Orders cancelled in parallel on shared Wares ----------------
ORDERS_D=()
for i in 1 2 3 4 5 6; do
  if [ $((i % 2)) -eq 0 ]; then IT="$(items "$V3" 1 "$V4" 1)"; else IT="$(items "$V4" 1 "$V3" 1)"; fi
  ORDERS_D+=("$(new_order "$IT")")
done
BEFORE_W4="$(stock "$W4")"
stmts=(); for o in "${ORDERS_D[@]}"; do stmts+=("$(cancel_sql "$o" "$CLIENT" CLIENT)"); done
run_parallel "${stmts[@]}"
check "D: 6 parallel cancels of multi-item Orders all succeed" "$(ok_count)" 6
check "D: no deadlock" "$(count_out -i 'deadlock')" 0
check "D: nothing stays reserved on the shared Ware (W4 back to 100/0)" "$(stock "$W4")" "100/0"
check "D: six reversals, one per Order" \
  "$(sql "select count(*) from public.payment_reversals where reason_type = 'ORDER_CANCEL' and order_id in ('$(IFS=,; echo "${ORDERS_D[*]}" | sed "s/,/','/g")')")" 6

# ---------------- E: cancel races repeated finalize of the same Payment ----------------
IT_E="$(items "$V1" 2)"
PAY_E="$(sql "select id from public.create_checkout_payment('$CLIENT', '$IT_E'::jsonb)")"
psqlq -c "select public.complete_checkout_payment('$CLIENT', '$PAY_E', true, '__v3p5conc_cb_' || gen_random_uuid())" >/dev/null
psqlq -c "select public.finalize_order('$CLIENT', '$PAY_E', '$IT_E'::jsonb, '$ADDR'::jsonb)" >/dev/null
O_E="$(sql "select id from public.orders where payment_id = '$PAY_E'")"
FIN="select public.finalize_order('$CLIENT', '$PAY_E', '$IT_E'::jsonb, '$ADDR'::jsonb) ->> 'outcome'"
run_parallel "$FIN" "$FIN" "$(cancel_sql "$O_E" "$CLIENT" CLIENT)" "$FIN" "$(cancel_sql "$O_E" "$ADMIN" ADMIN)" "$FIN"
check "E: all calls succeed" "$(ok_count)" 6
check "E: no deadlock" "$(count_out -i 'deadlock')" 0
check "E: the Order is CANCELLED once with one reversal; Ware back to 10/0" \
  "$(sql "select status from public.orders where id = '$O_E'") $(sql "select count(*) from public.payment_reversals where order_id = '$O_E'") $(stock "$W1")" "CANCELLED 1 10/0"

if [ "$FAILED" -ne 0 ]; then
  echo "v3 phase 5 concurrency check FAILED"
  exit 1
fi
echo "v3 phase 5 concurrency check PASSED"
