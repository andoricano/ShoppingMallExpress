#!/usr/bin/env bash
# ============================================================
# Legacy dependency audit (docs/mall1/v3/PHASES.md Phase 8)
#
#   bash supabase/verification/v3_phase8_legacy_audit.sh [--expect-zero]
#
# Searches the application and shared-package SOURCE (never node_modules or
# build output) for the legacy names that the v3 contraction removes:
#
#   PAID                          the removed Order status
#   create_order_from_cart        -> checkout payment + finalize_order
#   cancel_order                  -> cancel_pending_order (Route Handlers)
#   request_refund                -> create_refund_request
#   admin_transition_order_status -> admin_advance_order
#   admin_transition_refund_status-> admin_decide_refund
#   restock_order_item            -> admin_restock_refund_item
#   OUT_OF_STOCK                  -> SOLD_OUT
#   ORDER_PAYMENT via /api/payments (the v2 pay-an-existing-Order flow)
#
# On main these still exist behind the MALL_V3 flag (production runs v2 until
# the cutover), so the audit only REPORTS. On the contraction branch, where the
# legacy code is removed, run it with --expect-zero.
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EXPECT_ZERO=0
[ "${1:-}" = "--expect-zero" ] && EXPECT_ZERO=1

DIRS=("$ROOT/apps/client-web" "$ROOT/apps/client-pwa" "$ROOT/apps/user-web" "$ROOT/packages/types/src")
TOTAL=0

audit() { # label pattern
  local hits
  hits="$(grep -rnE --include='*.ts' --include='*.tsx' \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.turbo --exclude-dir=dist \
    "$2" "${DIRS[@]}" 2>/dev/null | grep -vE '^\S+:[0-9]+:\s*(//|\*|/\*)' || true)"
  local n=0
  [ -n "$hits" ] && n="$(printf '%s\n' "$hits" | wc -l | tr -d ' ')"
  printf '%-34s %s reference(s)\n' "$1" "$n"
  [ "$n" -gt 0 ] && printf '%s\n' "$hits" | sed "s#$ROOT/##" | head -"${AUDIT_LINES:-6}" | sed 's/^/    /'
  TOTAL=$((TOTAL + n))
}

audit "PAID"                          '"PAID"|\bPAID:'
audit "create_order_from_cart"        'create_order_from_cart'
audit "cancel_order (v2 RPC)"         'rpc\(\s*"cancel_order"|"cancel_order"'
audit "request_refund (v2 RPC)"       '"request_refund"'
audit "admin_transition_order_status" 'admin_transition_order_status'
audit "admin_transition_refund_status" 'admin_transition_refund_status'
audit "restock_order_item"            'restock_order_item'
audit "OUT_OF_STOCK"                  'OUT_OF_STOCK'
# The v2 "pay an existing Order" flow: payments.purpose ORDER_PAYMENT itself stays
# (v3 checkout Payments use it), so only its v2 callers are searched.
DIRS=("$ROOT/apps/client-web/app/payment" "$ROOT/apps/client-web/app/api/payments" "$ROOT/apps/client-web/hooks/payment")
audit "ORDER_PAYMENT (v2 order pay)"  'ORDER_PAYMENT'

echo "total: $TOTAL reference(s)"

if [ "$EXPECT_ZERO" -eq 1 ]; then
  if [ "$TOTAL" -eq 0 ]; then
    echo "legacy audit PASSED (no legacy reference remains)"
    exit 0
  fi
  echo "legacy audit FAILED (legacy references remain)"
  exit 1
fi

echo "legacy audit: report only (main keeps the legacy paths behind MALL_V3 until the cutover)"
