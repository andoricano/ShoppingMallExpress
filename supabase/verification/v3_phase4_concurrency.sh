#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 Phase 4 finalize under parallel sessions
# (migration 20260926160000_v3_phase4_order_finalization.sql)
#
# Run after `pnpm supabase db reset` against the LOCAL database:
#
#   bash supabase/verification/v3_phase4_concurrency.sh
#
# Covers what a single transaction cannot show:
#   A. N parallel finalizes of ONE Payment: one Order, one allocation
#   B. two Payments racing for the same Ware (6 + 6 on stock 10)
#   C. finalize racing the orphan job: an Order OR an ORPHAN_PAYMENT
#      reversal, never both, never two
#   D. a rejected finalize racing repeats and the orphan job: one closing
#      reversal
#   E. multi-item finalizes with opposite item order on shared Wares:
#      no deadlock
#
# Needs real concurrent sessions, so it COMMITS temporary fixtures
# (names start with "__v3p4conc") and removes them on exit. The orphan job
# (C, D) looks at every old succeeded Order-less Payment of the local
# database; run this on a clean local database (after `db reset`).
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

CLIENT="" WH="" PRODUCT_NAME="__v3p4conc product" POST=""
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
delete from public.payment_reversals where payment_id in
  (select id from public.payments where client_id = nullif('$CLIENT','')::uuid);
delete from public.order_item_ware_allocations where order_item_id in
  (select oi.id from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.client_id = nullif('$CLIENT','')::uuid);
delete from public.order_items where order_id in
  (select id from public.orders where client_id = nullif('$CLIENT','')::uuid);
update public.payments set order_id = null where client_id = nullif('$CLIENT','')::uuid;
delete from public.orders where client_id = nullif('$CLIENT','')::uuid;
delete from public.payments where client_id = nullif('$CLIENT','')::uuid;
delete from public.product_post_products where product_post_id = nullif('$POST','')::uuid;
delete from public.product_posts where id = nullif('$POST','')::uuid;
delete from public.product_variant_wares where ware_id in
  (select id from public.wares where warehouse_id = nullif('$WH','')::uuid);
delete from public.wares where warehouse_id = nullif('$WH','')::uuid;
delete from public.warehouses where id = nullif('$WH','')::uuid;
delete from public.products where name = '$PRODUCT_NAME';
delete from auth.users where id = nullif('$CLIENT','')::uuid;
SQL
  local leftovers
  leftovers="$(sql "select (select count(*) from public.wares where name like '__v3p4conc%') + (select count(*) from public.products where name like '__v3p4conc%') + (select count(*) from public.warehouses where name like '__v3p4conc%') + (select count(*) from public.payments where client_id = nullif('$CLIENT','')::uuid)")"
  if [ "$leftovers" != "0" ]; then
    echo "WARN  cleanup left $leftovers fixture rows; run 'pnpm supabase db reset'"
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

# run_parallel <statement>...  -> outputs in $TMP/out.N, exit codes in $TMP/res.N
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
ok_count() { local f ok=0; for f in "$TMP"/res.*; do [ "$(cat "$f")" = "0" ] && ok=$((ok + 1)); done; echo "$ok"; }
count_out() { cat "$TMP"/out.* | grep -c "$@"; }

ADDR="{\"recipient\":\"__v3p4conc\",\"address\":\"Seoul\"}"
items() { # variant qty [variant qty ...]
  local out="" first=1
  while [ $# -ge 2 ]; do
    [ $first -eq 0 ] && out="$out,"
    out="$out{\"productId\":\"$PRODUCT\",\"productVariantId\":\"$1\",\"quantity\":$2}"
    first=0; shift 2
  done
  echo "[$out]"
}
paid() { # items-json -> payment id (Stage 1 + PG success)
  local id
  id="$(sql "select id from public.create_checkout_payment('$CLIENT', '$1'::jsonb)")"
  psqlq -c "select public.complete_checkout_payment('$CLIENT', '$id', true, '__v3p4conc_cb_' || gen_random_uuid())" >/dev/null
  echo "$id"
}
finalize_sql() { echo "select public.finalize_order('$CLIENT', '$1', '$2'::jsonb, '$ADDR'::jsonb) ->> 'outcome'"; }

# ---------------- fixtures ----------------
CLIENT="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT')" >/dev/null
WH="$(sql "select public.create_warehouse('__v3p4conc warehouse')")"
W1="$(sql "select public.create_ware('$WH', '__v3p4conc W1', null, 'GENERAL', 10)")"
W2="$(sql "select public.create_ware('$WH', '__v3p4conc W2', null, 'GENERAL', 10)")"
W3="$(sql "select public.create_ware('$WH', '__v3p4conc W3', null, 'GENERAL', 10)")"
W4="$(sql "select public.create_ware('$WH', '__v3p4conc W4', null, 'GENERAL', 10)")"
PJ="$(sql "select public.admin_create_product('{\"name\":\"$PRODUCT_NAME\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__V3P4C-1\"},{\"price\":500,\"skuCode\":\"__V3P4C-2\"},{\"price\":300,\"skuCode\":\"__V3P4C-3\"},{\"price\":200,\"skuCode\":\"__V3P4C-4\"}]')")"
PRODUCT="$(sql "select ('$PJ'::jsonb ->> 'productId')")"
V1="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 0)")"
V2="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 1)")"
V3="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 2)")"
V4="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 3)")"
psqlq -c "select public.link_product_variant_ware('$V1','$W1')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V2','$W2')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V3','$W3')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$V4','$W4')" >/dev/null
POST="$(sql "insert into public.product_posts (title, status) values ('__v3p4conc post','PUBLISHED') returning id")"
psqlq -c "insert into public.product_post_products (product_post_id, product_id) values ('$POST','$PRODUCT')" >/dev/null

stock() { sql "select current_stock || '/' || reserved_stock from public.wares where id = '$1'"; }

# ---------------- A: one Payment, many finalizes ----------------
IT_A="$(items "$V1" 3)"
PAY_A="$(paid "$IT_A")"
stmts=(); for _ in 1 2 3 4 5 6 7 8; do stmts+=("$(finalize_sql "$PAY_A" "$IT_A")"); done
run_parallel "${stmts[@]}"
check "A: 8 parallel finalizes of one Payment all succeed" "$(ok_count)" 8
check "A: exactly one of them created the Order" "$(count_out '^CREATED')" 1
check "A: the other 7 returned the existing Order" "$(count_out '^EXISTING')" 7
check "A: exactly one Order exists for the Payment" "$(sql "select count(*) from public.orders where payment_id = '$PAY_A'")" 1
check "A: allocation total is 3 (once)" \
  "$(sql "select coalesce(sum(a.quantity),0) from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id join public.orders o on o.id = oi.order_id where o.payment_id = '$PAY_A'")" 3
check "A: the Ware is reserved once (10/3)" "$(stock "$W1")" "10/3"

# ---------------- B: two Payments race for one Ware ----------------
IT_B="$(items "$V2" 6)"
PAY_B1="$(paid "$IT_B")"; PAY_B2="$(paid "$IT_B")"
run_parallel "$(finalize_sql "$PAY_B1" "$IT_B")" "$(finalize_sql "$PAY_B2" "$IT_B")"
check "B: both Orders are created (shortage never blocks)" "$(count_out '^CREATED')" 2
check "B: the Ware is exactly fully reserved and never negative (10/10)" "$(stock "$W2")" "10/10"
ALLOC_B="$(sql "select coalesce(sum(a.quantity),0) from public.order_item_ware_allocations a join public.order_items oi on oi.id = a.order_item_id join public.orders o on o.id = oi.order_id where o.payment_id in ('$PAY_B1','$PAY_B2')")"
check "B: allocated 10 in total (so the shortage is 12 - 10 = 2)" "$ALLOC_B" 10

# ---------------- C: finalize races the orphan job ----------------
C_ORDER=0; C_REV=0; C_BOTH=0
for round in 1 2 3 4 5 6; do
  IT_C="$(items "$V3" 1)"
  PAY_C="$(paid "$IT_C")"
  psqlq -c "update public.payments set completed_at = now() - interval '1 hour' where id = '$PAY_C'" >/dev/null
  run_parallel \
    "$(finalize_sql "$PAY_C" "$IT_C")" "$(finalize_sql "$PAY_C" "$IT_C")" \
    "select count(*) from public.reverse_orphan_payments(interval '30 minutes')" \
    "select count(*) from public.reverse_orphan_payments(interval '30 minutes')"
  O="$(sql "select count(*) from public.orders where payment_id = '$PAY_C'")"
  R="$(sql "select count(*) from public.payment_reversals where payment_id = '$PAY_C' and reason_type = 'ORPHAN_PAYMENT'")"
  if [ "$O" = "1" ] && [ "$R" = "0" ]; then C_ORDER=$((C_ORDER + 1))
  elif [ "$O" = "0" ] && [ "$R" = "1" ]; then C_REV=$((C_REV + 1))
  else C_BOTH=$((C_BOTH + 1)); fi
done
check "C: in every round exactly one of {Order, ORPHAN reversal} exists (never both, never neither, never two)" "$C_BOTH" 0
echo "INFO  C: finalize won $C_ORDER round(s), the orphan job won $C_REV round(s)"
check "C: no Payment ended with both an Order and a closing reversal" \
  "$(sql "select count(*) from public.payments p where p.client_id = '$CLIENT' and exists (select 1 from public.orders o where o.payment_id = p.id) and exists (select 1 from public.payment_reversals r where r.payment_id = p.id and r.reason_type in ('FINALIZE_FAILURE','ORPHAN_PAYMENT'))")" 0
check "C: no deadlock" "$(count_out -i 'deadlock')" 0

# ---------------- D: a rejected finalize (price mismatch) races repeats and the orphan job ----------------
IT_D="$(items "$V4" 2)"
PAY_D="$(paid "$IT_D")"
psqlq -c "update public.payments set completed_at = now() - interval '1 hour' where id = '$PAY_D'" >/dev/null
BAD_D="$(items "$V4" 5)"
run_parallel \
  "$(finalize_sql "$PAY_D" "$BAD_D")" "$(finalize_sql "$PAY_D" "$BAD_D")" "$(finalize_sql "$PAY_D" "$BAD_D")" \
  "select count(*) from public.reverse_orphan_payments(interval '30 minutes')" \
  "select count(*) from public.reverse_orphan_payments(interval '30 minutes')"
check "D: no Order was created" "$(sql "select count(*) from public.orders where payment_id = '$PAY_D'")" 0
check "D: exactly one closing reversal exists (no duplicate money movement)" \
  "$(sql "select count(*) from public.payment_reversals where payment_id = '$PAY_D' and reason_type in ('FINALIZE_FAILURE','ORPHAN_PAYMENT')")" 1
check "D: the reversal is for the full Payment amount" \
  "$(sql "select (select amount from public.payment_reversals where payment_id = '$PAY_D')::bigint = (select amount from public.payments where id = '$PAY_D')::bigint")" t

# ---------------- E: multi-item finalizes, opposite item order, shared Wares ----------------
IT_E1="$(items "$V1" 1 "$V2" 1)"; IT_E2="$(items "$V2" 1 "$V1" 1)"
BEFORE_1="$(stock "$W1")"; BEFORE_2="$(stock "$W2")"
PAY_E1="$(paid "$IT_E1")"; PAY_E2="$(paid "$IT_E2")"; PAY_E3="$(paid "$IT_E1")"; PAY_E4="$(paid "$IT_E2")"
run_parallel "$(finalize_sql "$PAY_E1" "$IT_E1")" "$(finalize_sql "$PAY_E2" "$IT_E2")" \
             "$(finalize_sql "$PAY_E3" "$IT_E1")" "$(finalize_sql "$PAY_E4" "$IT_E2")"
check "E: 4 parallel multi-item finalizes all create their Order" "$(count_out '^CREATED')" 4
check "E: no deadlock" "$(count_out -i 'deadlock')" 0
check "E: reserved never exceeds current on the shared Wares" \
  "$(sql "select count(*) from public.wares where id in ('$W1','$W2') and (reserved_stock > current_stock or current_stock < 0)")" 0

if [ "$FAILED" -ne 0 ]; then
  echo "v3 phase 4 concurrency check FAILED"
  exit 1
fi
echo "v3 phase 4 concurrency check PASSED"
