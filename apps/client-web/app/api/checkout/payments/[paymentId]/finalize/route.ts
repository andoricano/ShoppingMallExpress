import { NextResponse } from "next/server";

import type {
    FinalizeOrderInput,
    FinalizeOrderResult,
    FinalizeRejectionReason,
} from "@mall/types";

import {
    createServiceRoleClient,
    requireAuthenticatedUser,
} from "@/lib/supabase/admin";
import { checkoutErrorResponse, runPaymentReversal } from "@/lib/payment/checkout";
import { PaymentRequestError } from "@/lib/payment/server";

type RouteContext = { params: Promise<{ paymentId: string }> };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type FinalizeRpcResult =
    | { outcome: "CREATED" | "EXISTING"; order_id: string; order_number: string | null }
    | { outcome: "REJECTED"; reason: FinalizeRejectionReason; reversal_id: string };

/**
 * Mall v3 Stage 2 finalize. The Client resubmits the items and the address; the
 * server revalidates sellability and the price against the succeeded Payment in
 * one database transaction and either creates the PENDING Order or creates the
 * full-amount reversal. Numeric stock never blocks the Order. A repeat or
 * concurrent call returns the same Order. The response carries no stock,
 * allocation, shortage, or reversal detail.
 *
 * The PG reversal of a rejected finalize runs after the transaction committed.
 */
export async function POST(request: Request, context: RouteContext) {
    try {
        const user = await requireAuthenticatedUser(request);
        const { paymentId } = await context.params;
        const body = await request.json().catch(() => null) as Partial<FinalizeOrderInput> | null;

        if (!UUID_PATTERN.test(paymentId)) {
            throw new PaymentRequestError("결제를 찾을 수 없습니다.", 404);
        }

        if (!Array.isArray(body?.items) || typeof body?.shippingAddress !== "object" || body.shippingAddress === null) {
            throw new PaymentRequestError("주문 상품과 배송지가 필요합니다.", 400);
        }

        const { data, error } = await createServiceRoleClient().rpc("finalize_order", {
            p_client_id: user.id,
            p_payment_id: paymentId,
            p_items: body.items,
            p_shipping_address: body.shippingAddress,
        });

        if (error) {
            throw error;
        }

        const result = data as FinalizeRpcResult;

        if (result.outcome === "REJECTED") {
            await runPaymentReversal(result.reversal_id);

            const rejected: FinalizeOrderResult = { outcome: "REJECTED", reason: result.reason };

            return NextResponse.json(
                {
                    message: "주문을 완료하지 못해 결제가 취소 처리됩니다.",
                    data: rejected,
                },
                { status: 409 },
            );
        }

        const created: FinalizeOrderResult = {
            outcome: result.outcome,
            orderId: result.order_id,
            orderNumber: result.order_number,
        };

        return NextResponse.json(
            { data: created },
            { status: result.outcome === "CREATED" ? 201 : 200 },
        );
    } catch (error) {
        return checkoutErrorResponse(error);
    }
}
