import { NextResponse } from "next/server";

import type { CreateCheckoutPaymentInput } from "@mall/types";

import {
    createServiceRoleClient,
    requireAuthenticatedUser,
} from "@/lib/supabase/admin";
import { checkoutErrorResponse } from "@/lib/payment/checkout";
import { PaymentRequestError, toPayment, type PaymentRow } from "@/lib/payment/server";

/**
 * Mall v3 Stage 1: records ONLY a Payment for the checkout (no Order, no
 * items). The server determines the amount from the submitted items and refuses
 * items that cannot be sold before any PG interaction. The Client keeps the
 * checkout data and resubmits it at finalize.
 */
export async function POST(request: Request) {
    try {
        const user = await requireAuthenticatedUser(request);
        const body = await request.json().catch(() => null) as Partial<CreateCheckoutPaymentInput> | null;

        if (!Array.isArray(body?.items)) {
            throw new PaymentRequestError("주문 상품이 필요합니다.", 400);
        }

        const { data, error } = await createServiceRoleClient().rpc("create_checkout_payment", {
            p_client_id: user.id,
            p_items: body.items,
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: toPayment(data as PaymentRow) }, { status: 201 });
    } catch (error) {
        return checkoutErrorResponse(error);
    }
}
