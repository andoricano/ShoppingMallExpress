import { NextResponse } from "next/server";

import type { CreateRefundRequestInput, CreateRefundRequestResult } from "@mall/types";

import {
    createServiceRoleClient,
    requireAuthenticatedUser,
} from "@/lib/supabase/admin";
import { checkoutErrorResponse } from "@/lib/payment/checkout";
import { PaymentRequestError } from "@/lib/payment/server";

type RouteContext = { params: Promise<{ orderId: string }> };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mall v3 Refund request by the owning Client. Only PROCESSING, SHIPPED, and
 * DELIVERED Orders can be refunded (a PENDING Order is cancelled instead).
 * Partial Refund per OrderItem quantity, priced at the immutable OrderItem
 * snapshot unit price; the cumulative valid quantity never exceeds the ordered
 * quantity, also for concurrent requests. The Client never sends a price. The
 * response carries no stock, allocation, or reversal detail.
 */
export async function POST(request: Request, context: RouteContext) {
    try {
        const user = await requireAuthenticatedUser(request);
        const { orderId } = await context.params;
        const body = await request.json().catch(() => null) as Partial<CreateRefundRequestInput> | null;

        if (!UUID_PATTERN.test(orderId)) {
            throw new PaymentRequestError("주문을 찾을 수 없습니다.", 404);
        }

        if (!Array.isArray(body?.items) || (body.reason !== undefined && typeof body.reason !== "string")) {
            throw new PaymentRequestError("환불 요청 정보가 올바르지 않습니다.", 400);
        }

        const { data, error } = await createServiceRoleClient().rpc("create_refund_request", {
            p_client_id: user.id,
            p_order_id: orderId,
            p_items: body.items,
            p_reason: body.reason ?? null,
        });

        if (error) {
            throw error;
        }

        const created: CreateRefundRequestResult = { refundRequestId: data as string };

        return NextResponse.json({ data: created }, { status: 201 });
    } catch (error) {
        return checkoutErrorResponse(error);
    }
}
