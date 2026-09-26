#!/usr/bin/env bash
# ============================================================
# Mall v3 cutover, step 0 (MANDATORY GATE): backup + restore verification
#
# Takes a logical backup of the production database with pg_dump (a read-only
# operation), restores it into a scratch database of the LOCAL Supabase, and
# compares the row count of every public/auth table plus two data fingerprints.
# Any mismatch or restore failure exits non-zero: the cutover must STOP.
#
# The dump holds customer data. It is written outside the repository
# (BACKUP_DIR, default ~/mall-v3-backups), never committed (*.dump is
# gitignored), and kept until the release is stable.
#
# Needs: docker, the local Supabase running (`pnpm supabase start`), and the
# production connection string in PROD_DB_URL (the session pooler URL). If unset,
# DATABASE_POOLER_URL is read from the repository root .env. The value is never
# printed; the output is filtered.
#
#   bash supabase/cutover/v3_backup_and_verify.sh
#
# Applies nothing to production and does not use any Supabase CLI command.
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/mall-v3-backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_NAME="prod-${STAMP}.dump"
SCRATCH_DB="prod_restore_scratch"

if [ -z "${PROD_DB_URL:-}" ]; then
  line="$(grep -E '^(export )?DATABASE_POOLER_URL=' .env | head -1 || true)"
  v="${line#*=}"; v="${v%$'\r'}"; v="${v%\"}"; v="${v#\"}"; v="${v%\'}"; v="${v#\'}"
  PROD_DB_URL="$v"
fi
[ -n "$PROD_DB_URL" ] || { echo "FAIL: no production connection string (PROD_DB_URL or .env DATABASE_POOLER_URL)"; exit 1; }
export PROD_DB_URL
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || { echo "FAIL: local Supabase container $DB_CONTAINER is not running"; exit 1; }

HOST="$(node -e 'console.log(new URL(process.env.PROD_DB_URL).hostname)')"
export HOST
# Output filter: the connection string and host never appear.
red() { node -e 'let s=require("fs").readFileSync(0,"utf8");for(const k of [process.env.PROD_DB_URL,process.env.HOST])s=s.split(k).join("<redacted>");process.stdout.write(s)'; }
prodpsql() { docker run --rm -i -e PROD_DB_URL postgres:17 sh -c 'psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -X -qtA -F"|"' 2>&1 | red; }
ro() { { echo "begin read only;"; cat; echo "commit;"; } | prodpsql | grep -vE '^(BEGIN|COMMIT)$'; }
fail() { echo "FAIL: $1  -> STOP the cutover"; exit 1; }

mkdir -p "$BACKUP_DIR"; chmod 700 "$BACKUP_DIR"

echo "== 1. connection check (read only)"
echo "select 1;" | ro | grep -qx 1 || fail "cannot connect to production with the configured credentials"

echo "== 2. pg_dump (production, read only)"
docker run --rm -e PROD_DB_URL -v "$BACKUP_DIR:/out" postgres:17 sh -c \
  'pg_dump "$PROD_DB_URL" -Fc --no-owner --no-privileges \
     --exclude-schema=vault --exclude-schema=pgsodium --exclude-schema=realtime \
     --exclude-schema=supabase_functions --exclude-schema=_analytics --exclude-schema=_realtime \
     -f "/out/'"$DUMP_NAME"'"' 2>&1 | red
[ -s "$BACKUP_DIR/$DUMP_NAME" ] || fail "the dump is missing or empty"
echo "dump: $BACKUP_DIR/$DUMP_NAME ($(wc -c < "$BACKUP_DIR/$DUMP_NAME" | tr -d ' ') bytes)"

echo "== 3. restore into the LOCAL scratch database"
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -qtA -c "drop database if exists $SCRATCH_DB" -c "create database $SCRATCH_DB" >/dev/null
docker cp "$BACKUP_DIR/$DUMP_NAME" "$DB_CONTAINER:/tmp/$DUMP_NAME"
# The excluded vault schema makes exactly the supabase_vault extension statements fail; any other error is a stop.
docker exec "$DB_CONTAINER" sh -c "pg_restore -U postgres -d $SCRATCH_DB --no-owner --no-privileges /tmp/$DUMP_NAME 2>/tmp/restore.err || true"
UNEXPECTED="$(docker exec "$DB_CONTAINER" sh -c "grep 'error:' /tmp/restore.err | grep -v -e 'schema \"vault\" does not exist' -e 'extension \"supabase_vault\" does not exist' || true")"
docker exec "$DB_CONTAINER" rm -f "/tmp/$DUMP_NAME" /tmp/restore.err
[ -z "$UNEXPECTED" ] || { echo "$UNEXPECTED" | head -5; fail "unexpected restore errors"; }

echo "== 4. compare row counts (public + auth) and fingerprints"
COUNTS="select table_schema||'.'||table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint from information_schema.tables where table_type='BASE TABLE' and table_schema in ('public','auth') order by 1"
FP="select (select count(*) from public.orders)||'/'||(select count(*) from public.payments)||'/'||coalesce((select sum(current_stock) from public.wares),0)||'/'||coalesce((select md5(string_agg(x::text,'' order by x::text)) from (select id,status,order_number from public.orders) x),'-')||'/'||coalesce((select md5(string_agg(x::text,'' order by x::text)) from (select id,status,amount from public.payments) x),'-')"
P_COUNTS="$(echo "$COUNTS;" | ro)"
S_COUNTS="$(docker exec "$DB_CONTAINER" psql -U postgres -d "$SCRATCH_DB" -qtA -F'|' -c "$COUNTS")"
P_FP="$(echo "$FP;" | ro)"
S_FP="$(docker exec "$DB_CONTAINER" psql -U postgres -d "$SCRATCH_DB" -qtA -c "$FP")"
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -qtA -c "drop database $SCRATCH_DB" >/dev/null

TABLES="$(echo "$P_COUNTS" | grep -c '|')"
[ "$TABLES" -gt 0 ] || fail "no table counted in production"
[ "$P_COUNTS" = "$S_COUNTS" ] || { diff <(echo "$P_COUNTS") <(echo "$S_COUNTS") | head -10; fail "row counts differ between production and the restored copy"; }
[ "$P_FP" = "$S_FP" ] || fail "data fingerprints differ (orders/payments/stock)"

echo "OK: $TABLES tables have identical row counts; fingerprints equal (orders/payments/stock)"
echo "BACKUP VERIFIED: $BACKUP_DIR/$DUMP_NAME"
