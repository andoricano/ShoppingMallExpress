#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 Phase 7 Refund under parallel sessions
# (migration 20260926190000_v3_phase7_refund_and_restock.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/v3_phase7_concurrency.sh
#
# Covers what a single transaction cannot show:
#   A. parallel Refund requests never push the cumulative valid quantity of an
#      OrderItem above its quantity (BR-38)
#   B. a repeated / parallel approval of one request: one approval, one reversal
#   C. approve racing reject on one request: one final state, reversal iff APPROVED
#   D. parallel approvals of several requests of one Payment, racing another
#      reversal: approval and reversal stay paired and the Payment is never
#      reversed above its amount (BR-34, BR-39)
#
# Needs real concurrent sessions, so it COMMITS temporary fixtures (names start
# with "__v3p7conc") and removes them on exit.
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

CLIENT="" ADMIN="" WH="" POST="" PRODUCT_NAME="__v3p7conc product"
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
begin;
alter table public.order_item_ware_allocations disable trigger order_item_ware_allocations_freeze_after_processing;
delete from public.payment_reversals where payment_id in (select id from public.payments where client_id = nullif('$CLIENT','')::uuid);
delete from public.refund_item_restocks where refund_item_id in (select ri.id from public.refund_items ri join public.refund_requests rr on rr.id = ri.refund_request_id where rr.client_id = nullif('$CLIENT','')::uuid);
delete from public.refund_items where refund_request_id in (select id from public.refund_requests where client_id = nullif('$CLIENT','')::uuid);
delete from public.refund_requests where client_id = nullif('$CLIENT','')::uuid;
delete from public.order_cancellations where order_id in (select id from public.orders where client_id = nullif('$CLIENT','')::uuid);
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
  leftovers="$(sql "select (select count(*) from public.wares where name like '__v3p7conc%') + (select count(*) from public.products where name like '__v3p7conc%') + (select count(*) from public.warehouses where name like '__v3p7conc%') + (select count(*) from public.payments where client_id = nullif('$CLIENT','')::uuid)")"
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

ADDR="{\"recipient\":\"__v3p7conc\",\"address\":\"Seoul\"}"
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
  psqlq -c "select public.complete_checkout_payment('$CLIENT', '$id', true, '__v3p7conc_cb_' || gen_random_uuid())" >/dev/null
  sql "select public.finalize_order('$CLIENT', '$id', '$1'::jsonb, '$ADDR'::jsonb) ->> 'order_id'"
}
payment_of() { sql "select payment_id from public.orders where id = '$1'"; }
stock() { sql "select current_stock || '/' || reserved_stock from public.wares where id = '$1'"; }
ref_sql() { echo "select public.create_refund_request('$CLIENT', '$1', '[{\"orderItemId\":\"$2\",\"quantity\":$3}]'::jsonb) is not null"; }
dec_sql() { echo "select public.admin_decide_refund('$1', '$2', '$ADMIN') ->> 'outcome'"; }
adv_sql() { echo "select public.admin_advance_order('$1', '$2') ->> 'outcome'"; }
paid_payment() { # items-json -> succeeded Payment id (Stage 1 + PG success)
  local id
  id="$(sql "select id from public.create_checkout_payment('$CLIENT', '$1'::jsonb)")"
  psqlq -c "select public.complete_checkout_payment('$CLIENT', '$id', true, '__v3p7conc_cb_' || gen_random_uuid())" >/dev/null
  echo "$id"
}
finalize_sql() { echo "select public.finalize_order('$CLIENT', '$1', '$2'::jsonb, '$ADDR'::jsonb) ->> 'outcome'"; }
cancel_sql() { echo "select public.cancel_pending_order('$1', '$2', '$3', 'concurrency') ->> 'outcome'"; }

# ---------------- fixtures ----------------
CLIENT="$(sql "select gen_random_uuid()")"; ADMIN="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT'), ('$ADMIN')" >/dev/null
WH="$(sql "select public.create_warehouse('__v3p7conc warehouse')")"
W1="$(sql "select public.create_ware('$WH', '__v3p7conc W1', null, 'GENERAL', 10)")"
W2="$(sql "select public.create_ware('$WH', '__v3p7conc W2', null, 'GENERAL', 10)")"
W3="$(sql "select public.create_ware('$WH', '__v3p7conc W3', null, 'GENERAL', 100)")"
W4="$(sql "select public.create_ware('$WH', '__v3p7conc W4', null, 'GENERAL', 100)")"
PJ="$(sql "select public.admin_create_product('{\"name\":\"$PRODUCT_NAME\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__V3P7C-1\"},{\"price\":500,\"skuCode\":\"__V3P7C-2\"},{\"price\":300,\"skuCode\":\"__V3P7C-3\"},{\"price\":200,\"skuCode\":\"__V3P7C-4\"}]')")"
PRODUCT="$(sql "select ('$PJ'::jsonb ->> 'productId')")"
V1="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 0)")"; V2="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 1)")"
V3="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 2)")"; V4="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 3)")"
psqlq -c "select public.link_product_variant_ware('$V1','$W1')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V2','$W2')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V3','$W3')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V4','$W4')" >/dev/null
POST="$(sql "insert into public.product_posts (title, status) values ('__v3p7conc post','PUBLISHED') returning id")"
psqlq -c "insert into public.product_post_products (product_post_id, product_id) values ('$POST','$PRODUCT')" >/dev/null

processing_order() { # items-json -> PROCESSING order id
  local o
  o="$(new_order "$1")"
  psqlq -c "select public.admin_advance_order('$o', 'PROCESSING')" >/dev/null
  echo "$o"
}
item_of() { sql "select id from public.order_items where order_id = '$1'"; }
valid_qty() { sql "select coalesce(sum(ri.quantity),0) from public.refund_items ri join public.refund_requests rr on rr.id = ri.refund_request_id where ri.order_item_id = '$1' and rr.status in ('REQUESTED','APPROVED')"; }

# ---------------- A: cumulative quantity under parallel requests ----------------
O_A="$(processing_order "$(items "$V3" 6)")"; I_A="$(item_of "$O_A")"
stmts=(); for _ in 1 2 3 4 5 6 7 8 9 10; do stmts+=("$(ref_sql "$O_A" "$I_A" 1)"); done
run_parallel "${stmts[@]}"
check "A: 10 parallel requests of 1 on an OrderItem of 6: exactly 6 succeed" "$(ok_count)" 6
check "A: the valid cumulative quantity is exactly 6 (never above)" "$(valid_qty "$I_A")" 6
check "A: the 4 refused requests left nothing behind (6 requests exist)" "$(sql "select count(*) from public.refund_requests where order_id = '$O_A'")" 6

O_A2="$(processing_order "$(items "$V3" 6)")"; I_A2="$(item_of "$O_A2")"
stmts=(); for _ in 1 2 3 4 5; do stmts+=("$(ref_sql "$O_A2" "$I_A2" 2)"); done
run_parallel "${stmts[@]}"
check "A: 5 parallel requests of 2 on an OrderItem of 6: exactly 3 succeed" "$(ok_count)" 3
check "A: the valid cumulative quantity is 6" "$(valid_qty "$I_A2")" 6
check "A: no deadlock" "$(count_out -i 'deadlock')" 0

# ---------------- B: repeated / parallel approval ----------------
O_B="$(processing_order "$(items "$V4" 2)")"; I_B="$(item_of "$O_B")"
R_B="$(sql "select public.create_refund_request('$CLIENT', '$O_B', '[{\"orderItemId\":\"$I_B\",\"quantity\":2}]'::jsonb)")"
stmts=(); for _ in 1 2 3 4 5 6 7 8; do stmts+=("$(dec_sql "$R_B" APPROVED)"); done
run_parallel "${stmts[@]}"
check "B: 8 parallel approvals all succeed (no error)" "$(ok_count)" 8
check "B: exactly one approved, seven ALREADY_APPROVED" "$(count_out '^APPROVED')/$(count_out '^ALREADY_APPROVED')" "1/7"
check "B: exactly one REFUND reversal for the request" "$(sql "select count(*) from public.payment_reversals where refund_request_id = '$R_B'")" 1

# ---------------- C: approve races reject ----------------
C_BAD=0; C_APPROVED=0; C_REJECTED=0
for round in 1 2 3 4 5 6; do
  O_C="$(processing_order "$(items "$V4" 1)")"; I_C="$(item_of "$O_C")"
  R_C="$(sql "select public.create_refund_request('$CLIENT', '$O_C', '[{\"orderItemId\":\"$I_C\",\"quantity\":1}]'::jsonb)")"
  run_parallel "$(dec_sql "$R_C" APPROVED)" "$(dec_sql "$R_C" REJECTED)" "$(dec_sql "$R_C" APPROVED)" "$(dec_sql "$R_C" REJECTED)"
  ST="$(sql "select status from public.refund_requests where id = '$R_C'")"
  REV="$(sql "select count(*) from public.payment_reversals where refund_request_id = '$R_C'")"
  if [ "$ST" = "APPROVED" ] && [ "$REV" = "1" ]; then C_APPROVED=$((C_APPROVED + 1))
  elif [ "$ST" = "REJECTED" ] && [ "$REV" = "0" ]; then C_REJECTED=$((C_REJECTED + 1))
  else C_BAD=$((C_BAD + 1)); fi
done
check "C: every round ends APPROVED with exactly one reversal, or REJECTED with none - never both, never a mix" "$C_BAD" 0
echo "INFO  C: approval won $C_APPROVED round(s), rejection won $C_REJECTED round(s)"

# ---------------- D: parallel approvals of one Payment's requests, racing another reversal ----------------
D_BAD=0
for round in 1 2 3; do
  O_D="$(processing_order "$(items "$V3" 6)")"; I_D="$(item_of "$O_D")"
  PAY_D="$(sql "select payment_id from public.orders where id = '$O_D'")"
  RS=()
  for _ in 1 2 3; do RS+=("$(sql "select public.create_refund_request('$CLIENT', '$O_D', '[{\"orderItemId\":\"$I_D\",\"quantity\":2}]'::jsonb)")"); done
  run_parallel "$(dec_sql "${RS[0]}" APPROVED)" "$(dec_sql "${RS[1]}" APPROVED)" "$(dec_sql "${RS[2]}" APPROVED)" \
    "select public.create_payment_reversal('$PAY_D', 1000, 'MANUAL_RECONCILIATION', '__v3p7conc_manual_$round')"
  SUM="$(sql "select coalesce(sum(amount),0)::bigint from public.payment_reversals where payment_id = '$PAY_D' and status in ('PENDING','SUCCEEDED')")"
  APPR="$(sql "select count(*) from public.refund_requests where id in ('${RS[0]}','${RS[1]}','${RS[2]}') and status = 'APPROVED'")"
  REVS="$(sql "select count(*) from public.payment_reversals where refund_request_id in ('${RS[0]}','${RS[1]}','${RS[2]}')")"
  AMT="$(sql "select amount::bigint from public.payments where id = '$PAY_D'")"
  if [ "$SUM" -gt "$AMT" ] || [ "$APPR" != "$REVS" ]; then D_BAD=$((D_BAD + 1)); fi
done
check "D: the Payment is never reversed above its amount and every approval has its reversal (and vice versa), in every round" "$D_BAD" 0
check "D: no deadlock" "$(count_out -i 'deadlock')" 0

if [ "$FAILED" -ne 0 ]; then
  echo "v3 phase 7 concurrency check FAILED"
  exit 1
fi
echo "v3 phase 7 concurrency check PASSED"
