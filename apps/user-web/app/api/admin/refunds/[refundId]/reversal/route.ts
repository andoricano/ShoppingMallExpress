import { NextRequest, NextResponse } from "next/server";

import { AdminBadRequestError, AdminNotFoundError } from "@/lib/api/admin-response";
import { fulfillmentErrorResponse, UUID_PATTERN } from "@/lib/admin/fulfillment";
import { runPaymentReversal } from "@/lib/payment/reversalRunner";
import { requireAdminServiceContext } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ refundId: string }> };

/**
 * Reprocesses the PG reversal of an APPROVED Refund whose PG execution failed
 * (Admin only, actor recorded). The FAILED reversal goes back to PENDING on the
 * SAME row (same idempotency key, attempt counted) and is executed again; the
 * Refund stays APPROVED throughout and no second reversal is created.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
    try {
        const { refundId } = await context.params;

        if (!UUID_PATTERN.test(refundId)) {
            throw new AdminBadRequestError("Invalid refund id.");
        }

        const { supabase, adminId } = await requireAdminServiceContext();
        const { data: reversal, error: lookupError } = await supabase
            .from("payment_reversals")
            .select("id, status")
            .eq("idempotency_key", `refund:${refundId}`)
            .maybeSingle();

        if (lookupError) {
            throw lookupError;
        }

        if (!reversal) {
            throw new AdminNotFoundError("This Refund has no reversal.");
        }

        if (reversal.status === "FAILED") {
            const { error } = await supabase.rpc("retry_payment_reversal", {
                p_reversal_id: reversal.id,
                p_requested_by: adminId,
            });

            if (error) {
                throw error;
            }
        }

        const outcome = await runPaymentReversal(supabase, reversal.id);

        return NextResponse.json({ data: { execution: outcome } });
    } catch (error) {
        return fulfillmentErrorResponse(error);
    }
}
