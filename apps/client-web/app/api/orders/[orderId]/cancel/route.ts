import { NextResponse } from "next/server";

import type { CancelOrderInput, CancelOrderResult } from "@mall/types";

import {
    createServiceRoleClient,
    requireAuthenticatedUser,
} from "@/lib/supabase/admin";
import { checkoutErrorResponse, runPaymentReversal } from "@/lib/payment/checkout";
import { PaymentRequestError } from "@/lib/payment/server";

type RouteContext = { params: Promise<{ orderId: string }> };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mall v3 whole-Order Cancel by the owning Client. In one database transaction
 * the Order becomes CANCELLED, its allocation is released once, and one
 * ORDER_CANCEL reversal is created; the PG reversal runs after the commit, so a
 * slow or failing PG never repeats the cancellation. Cancelling an already
 * cancelled Order succeeds again (and re-drives its still-pending reversal).
 * Only a PENDING Order can be cancelled (409 otherwise). The response carries
 * no stock, allocation, or reversal detail.
 */
export async function POST(request: Request, context: RouteContext) {
    try {
        const user = await requireAuthenticatedUser(request);
        const { orderId } = await context.params;
        const body = await request.json().catch(() => null) as CancelOrderInput | null;

        if (!UUID_PATTERN.test(orderId)) {
            throw new PaymentRequestError("주문을 찾을 수 없습니다.", 404);
        }

        if (body?.reason !== undefined && typeof body.reason !== "string") {
            throw new PaymentRequestError("취소 사유가 올바르지 않습니다.", 400);
        }

        const { data, error } = await createServiceRoleClient().rpc("cancel_pending_order", {
            p_order_id: orderId,
            p_actor_id: user.id,
            p_actor_role: "CLIENT",
            p_reason: body?.reason ?? null,
        });

        if (error) {
            throw error;
        }

        const result = data as {
            outcome: CancelOrderResult["outcome"];
            order_id: string;
            reversal_id: string | null;
        };

        if (result.reversal_id) {
            await runPaymentReversal(result.reversal_id);
        }

        const cancelled: CancelOrderResult = { outcome: result.outcome, orderId: result.order_id };

        return NextResponse.json({ data: cancelled });
    } catch (error) {
        return checkoutErrorResponse(error);
    }
}
