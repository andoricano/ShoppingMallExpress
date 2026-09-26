#!/usr/bin/env bash
# ============================================================
# Local verification: v3 cutover script (stock conversion + sellability)
#
#   bash supabase/verification/v3_phase2_cutover.sh
#
# Builds a v2-style state, applies supabase/cutover/v3_stock_and_sellability.sql
# and checks the result, all in ONE transaction that is rolled back.
# The second application of the cutover script is expected to fail
# (guard); that error line in the output is part of the check.
#
# Uses the local Supabase DB container (no host psql required):
#   DB_CONTAINER=supabase_db_ShoppingEx (override via env)
# ============================================================
set -uo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ShoppingEx}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CUTOVER="$DIR/../cutover/v3_stock_and_sellability.sql"
CHECK="$DIR/../cutover/v3_stock_consistency_check.sql"
TEST="$DIR/v3_phase2_cutover.sql"

OUT="$(awk -v cutover="$CUTOVER" -v check="$CHECK" '
  /^-- @@CHECK@@$/   { while ((getline line < check) > 0) print line; close(check); next }
  /^-- @@CUTOVER@@$/ { while ((getline line < cutover) > 0) print line; close(cutover); next }
  { print }
' "$TEST" | docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 2>&1)"
RC=$?

echo "$OUT" | grep -E "^ .*\|" | grep -v "^ scenario" || true
echo "$OUT" | grep -E "ERROR|NOTICE" || true

if [ "$RC" -eq 0 ] && echo "$OUT" | grep -q "v3 phase 2 cutover check PASSED"; then
  echo "v3 phase 2 cutover check PASSED"
else
  echo "v3 phase 2 cutover check FAILED (psql exit $RC)"
  exit 1
fi
