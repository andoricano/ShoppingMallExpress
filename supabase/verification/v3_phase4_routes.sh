#!/usr/bin/env bash
# ============================================================
# Local verification: Mall v3 checkout Route Handlers over HTTP
# (apps/client-web/app/api/checkout/*)
#
#   bash supabase/verification/v3_phase4_routes.sh
#
# Runs `next dev` for client-web on port 3999 against the LOCAL Supabase stack
# with a mock PG Test recorder (the real PG Test service is never called and no
# production value is used: every environment variable the app needs is passed
# explicitly). The local API URL and keys are read from
# `pnpm supabase status -o env` into variables and are never printed.
# Fixtures are committed (names start with "__v3p4routes", users are
# v3p4-*@example.test) and removed on exit; `pnpm supabase db reset` restores
# the local DB if cleanup ever fails.
# ============================================================
set -uo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

psqlq() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -qtA -v ON_ERROR_STOP=1 "$@"; }
sql() { psqlq -c "$1" | head -n1 | tr -d '[:space:]'; }

STATUS_ENV="$(cd "$ROOT" && pnpm --silent supabase status -o env 2>/dev/null)"
pick() { printf '%s\n' "$STATUS_ENV" | sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}$/\1/p" | head -n1; }
LOCAL_API_URL="$(pick API_URL)"
LOCAL_ANON_KEY="$(pick ANON_KEY)"
LOCAL_SERVICE_KEY="$(pick SERVICE_ROLE_KEY)"
unset STATUS_ENV
if [ -z "$LOCAL_API_URL" ] || [ -z "$LOCAL_ANON_KEY" ] || [ -z "$LOCAL_SERVICE_KEY" ]; then
  echo "FAIL  local Supabase API URL / keys not available (is the local stack running?)"
  exit 1
fi
case "$LOCAL_API_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "FAIL  refusing to run against a non-local API URL"; exit 1 ;;
esac

WH="" POST="" PRODUCT_NAME="__v3p4routes product"
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
create temp table _u as select id from auth.users where email like 'v3p4-%@example.test';
delete from public.payment_reversals where payment_id in (select id from public.payments where client_id in (select id from _u));
delete from public.order_item_ware_allocations where order_item_id in
  (select oi.id from public.order_items oi join public.orders o on o.id = oi.order_id where o.client_id in (select id from _u));
delete from public.order_items where order_id in (select id from public.orders where client_id in (select id from _u));
update public.payments set order_id = null where client_id in (select id from _u);
delete from public.orders where client_id in (select id from _u);
delete from public.payments where client_id in (select id from _u);
delete from public.product_post_products where product_post_id = nullif('$POST','')::uuid;
delete from public.product_posts where id = nullif('$POST','')::uuid;
delete from public.product_variant_wares where ware_id in (select id from public.wares where warehouse_id = nullif('$WH','')::uuid);
delete from public.wares where warehouse_id = nullif('$WH','')::uuid;
delete from public.warehouses where id = nullif('$WH','')::uuid;
delete from public.products where name = '$PRODUCT_NAME';
delete from auth.users where id in (select id from _u);
SQL
  pkill -f "next dev -p 3999" >/dev/null 2>&1 || true
  # `next dev` writes files into the app; undo what it generated.
  if ! git -C "$ROOT" ls-files --error-unmatch apps/client-web/AGENTS.md >/dev/null 2>&1; then
    rm -f "$ROOT/apps/client-web/AGENTS.md" "$ROOT/apps/client-web/CLAUDE.md"
  fi
  sed -i.bak 's#\./\.next/dev/types/#./.next/types/#' "$ROOT/apps/client-web/next-env.d.ts" && rm -f "$ROOT/apps/client-web/next-env.d.ts.bak"
}
trap cleanup EXIT

WH="$(sql "select public.create_warehouse('__v3p4routes warehouse')")"
W1="$(sql "select public.create_ware('$WH', '__v3p4routes W1', null, 'GENERAL', 10)")"
WS="$(sql "select public.create_ware('$WH', '__v3p4routes WS', null, 'GENERAL', 10)")"
PJ="$(sql "select public.admin_create_product('{\"name\":\"$PRODUCT_NAME\"}', '[]', '[{\"price\":1000,\"skuCode\":\"__V3P4R-1\"},{\"price\":500,\"skuCode\":\"__V3P4R-2\"},{\"price\":100,\"skuCode\":\"__V3P4R-S\"}]')")"
PRODUCT="$(sql "select ('$PJ'::jsonb ->> 'productId')")"
V1="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 0)")"
V2="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 1)")"
VS="$(sql "select ('$PJ'::jsonb -> 'variantIds' ->> 2)")"
psqlq -c "select public.link_product_variant_ware('$V1','$W1')" >/dev/null
psqlq -c "select public.link_product_variant_ware('$VS','$WS')" >/dev/null
POST="$(sql "insert into public.product_posts (title, status) values ('__v3p4routes post','PUBLISHED') returning id")"
psqlq -c "insert into public.product_post_products (product_post_id, product_id) values ('$POST','$PRODUCT')" >/dev/null

FX="{\"product\":\"$PRODUCT\",\"v1\":\"$V1\",\"v2\":\"$V2\",\"vs\":\"$VS\",\"ws\":\"$WS\"}"

cd "$ROOT" && LOCAL_API_URL="$LOCAL_API_URL" LOCAL_ANON_KEY="$LOCAL_ANON_KEY" LOCAL_SERVICE_KEY="$LOCAL_SERVICE_KEY" \
  FX="$FX" node --no-warnings supabase/verification/v3_phase4_routes.mts
