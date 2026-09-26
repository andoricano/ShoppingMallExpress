import { NextRequest, NextResponse } from "next/server";

import type {
    AdminRefundDecisionInput,
    AdminRefundDecisionResult,
} from "@mall/types";

import { AdminBadRequestError } from "@/lib/api/admin-response";
import { fulfillmentErrorResponse, UUID_PATTERN } from "@/lib/admin/fulfillment";
import { runPaymentReversal } from "@/lib/payment/reversalRunner";
import { requireAdminServiceContext } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ refundId: string }> };

/**
 * Mall v3 Admin Refund decision. APPROVED and the linked REFUND reversal are
 * created in ONE database transaction (if the reversal cannot be created the
 * approval is not committed); the PG reversal runs after the commit and a PG
 * failure never reverts the approval. REJECTED creates no reversal. Neither
 * touches stock (Policy B: restock is a separate explicit action) or the Order
 * status. A repeated decision returns ALREADY_* and re-drives a still-pending
 * reversal; the opposite decision on a decided request is refused (409).
 * The v2 PATCH route (no reversal) stays until the v3 cutover.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { refundId } = await context.params;
        const body = await request.json().catch(() => null) as Partial<AdminRefundDecisionInput> | null;

        if (!UUID_PATTERN.test(refundId)) {
            throw new AdminBadRequestError("Invalid refund id.");
        }

        if (body?.decision !== "APPROVED" && body?.decision !== "REJECTED") {
            throw new AdminBadRequestError("decision must be APPROVED or REJECTED.");
        }

        const { supabase, adminId } = await requireAdminServiceContext();
        const { data, error } = await supabase.rpc("admin_decide_refund", {
            p_refund_request_id: refundId,
            p_decision: body.decision,
            p_actor_id: adminId,
        });

        if (error) {
            throw error;
        }

        const result = data as {
            outcome: AdminRefundDecisionResult["outcome"];
            refund_request_id: string;
            reversal_id: string | null;
        };

        if (result.reversal_id) {
            await runPaymentReversal(supabase, result.reversal_id);
        }

        const decided: AdminRefundDecisionResult = {
            outcome: result.outcome,
            refundRequestId: result.refund_request_id,
        };

        return NextResponse.json({ data: decided });
    } catch (error) {
        return fulfillmentErrorResponse(error);
    }
}
