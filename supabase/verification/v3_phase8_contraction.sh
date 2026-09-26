#!/usr/bin/env bash
# ============================================================
# Local verification: v3 legacy contraction (stock cutover + contraction)
#
#   bash supabase/verification/v3_phase8_contraction.sh
#
# Builds a v2-style state, applies supabase/cutover/v3_stock_and_sellability.sql
# and supabase/cutover/v3_legacy_contraction.sql and checks the result, all in
# ONE transaction that is rolled back. The refused runs of the contraction
# script (unpaid Orders; a second run) are expected to print ERROR lines; they
# are part of the check.
#
# Uses the local Supabase DB container (no host psql required):
#   DB_CONTAINER=supabase_db_ShoppingEx (override via env)
# ============================================================
set -uo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOCK="$DIR/../cutover/v3_stock_and_sellability.sql"
CONTRACTION="$DIR/../cutover/v3_legacy_contraction.sql"
TEST="$DIR/v3_phase8_contraction.sql"

OUT="$(awk -v stock="$STOCK" -v contraction="$CONTRACTION" '
  /^-- @@STOCK_CUTOVER@@$/ { while ((getline line < stock) > 0) print line; close(stock); next }
  /^-- @@CONTRACTION@@$/   { while ((getline line < contraction) > 0) print line; close(contraction); next }
  { print }
' "$TEST" | docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 2>&1)"
RC=$?

echo "$OUT" | grep -E "^ .*\|" | grep -v "^ scenario" || true
echo "$OUT" | grep -E "ERROR|NOTICE" | head -12 || true

if [ "$RC" -eq 0 ] && echo "$OUT" | grep -q "v3 phase 8 contraction check PASSED"; then
  echo "v3 phase 8 contraction check PASSED"
else
  echo "v3 phase 8 contraction check FAILED (psql exit $RC)"
  exit 1
fi
