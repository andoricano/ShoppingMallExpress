#!/usr/bin/env bash
# ============================================================
# Local verification: payment reversal executor + simulated PG adapter
# (apps/client-web/lib/payment/reversal.ts, Node type stripping; no new deps)
#
#   bash supabase/verification/v3_phase3_executor.sh
#
# Uses the LOCAL Supabase stack only. The local API URL and service key are
# read from `pnpm supabase status -o env` into variables and are never printed.
# Fixtures are committed (keys start with "__v3p3exec") and removed on exit;
# `pnpm supabase db reset` restores the local DB if cleanup ever fails.
# ============================================================
set -uo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

psqlq() {
  docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -qtA -v ON_ERROR_STOP=1 "$@"
}
sql() { psqlq -c "$1" | head -n1 | tr -d '[:space:]'; }

STATUS_ENV="$(cd "$ROOT" && pnpm --silent supabase status -o env 2>/dev/null)"
LOCAL_API_URL="$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^API_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' | head -n1)"
LOCAL_SERVICE_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^SERVICE_ROLE_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' | head -n1)"
unset STATUS_ENV
if [ -z "$LOCAL_API_URL" ] || [ -z "$LOCAL_SERVICE_KEY" ]; then
  echo "FAIL  local Supabase API URL / service key not available (is the local stack running?)"
  exit 1
fi
case "$LOCAL_API_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "FAIL  refusing to run against a non-local API URL"; exit 1 ;;
esac

CLIENT=""
cleanup() {
  psqlq >/dev/null 2>&1 <<SQL
delete from public.payment_reversals where idempotency_key like '__v3p3exec%';
delete from public.payments where client_id = nullif('$CLIENT','')::uuid;
delete from auth.users where id = nullif('$CLIENT','')::uuid;
SQL
}
trap cleanup EXIT

CLIENT="$(sql "select gen_random_uuid()")"
psqlq -c "insert into auth.users (id) values ('$CLIENT')" >/dev/null
PAYMENT="$(sql "insert into public.payments (client_id, purpose, amount, status, pg_callback_id, completed_at) values ('$CLIENT','ORDER_PAYMENT',100000,'SUCCEEDED','__v3p3exec_cb',now()) returning id")"

mk() { sql "select id from public.create_payment_reversal('$PAYMENT', 1000, 'MANUAL_RECONCILIATION', '__v3p3exec_$1')"; }
REVERSALS="{\"ok\":\"$(mk ok)\",\"refused\":\"$(mk refused)\",\"slow\":\"$(mk slow)\",\"error\":\"$(mk error)\",\"prod\":\"$(mk prod)\"}"

cd "$ROOT" && LOCAL_API_URL="$LOCAL_API_URL" LOCAL_SERVICE_KEY="$LOCAL_SERVICE_KEY" \
  FX_PAYMENT="$PAYMENT" FX_REVERSALS="$REVERSALS" \
  node --no-warnings supabase/verification/v3_phase3_executor.mts
