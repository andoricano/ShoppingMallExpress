import { NextResponse } from "next/server";

import type { CreatePaymentInput } from "@mall/types";

import {
    createServiceRoleClient,
    requireAuthenticatedUser,
} from "@/lib/supabase/admin";
import {
    PaymentRequestError,
    paymentErrorResponse,
    toPayment,
    type PaymentRow,
} from "@/lib/payment/server";

/**
 * Creates a PENDING payment attempt for the authenticated user.
 * ORDER_PAYMENT: amount comes from the Order total (create_payment()).
 * POINT_TOPUP: amount must satisfy the server top-up policy.
 */
export async function POST(request: Request) {
    try {
        const user = await requireAuthenticatedUser(request);
        const body = await request.json().catch(() => null) as Partial<CreatePaymentInput> | null;

        if (body?.purpose !== "ORDER_PAYMENT" && body?.purpose !== "POINT_TOPUP") {
            throw new PaymentRequestError("결제 종류가 올바르지 않습니다.", 400);
        }

        const amount = body.amount;

        if (amount !== undefined && (typeof amount !== "number" || !Number.isFinite(amount))) {
            throw new PaymentRequestError("결제 금액이 올바르지 않습니다.", 400);
        }

        const orderId = body.purpose === "ORDER_PAYMENT"
            ? (body as { orderId?: unknown }).orderId
            : null;

        if (body.purpose === "ORDER_PAYMENT" && typeof orderId !== "string") {
            throw new PaymentRequestError("주문 정보가 필요합니다.", 400);
        }

        const { data, error } = await createServiceRoleClient().rpc("create_payment", {
            p_client_id: user.id,
            p_purpose: body.purpose,
            p_order_id: orderId,
            p_amount: amount ?? null,
        });

        if (error) {
            throw error;
        }

        return NextResponse.json(
            { data: toPayment(data as PaymentRow) },
            { status: 201 },
        );
    } catch (error) {
        return paymentErrorResponse(error);
    }
}
