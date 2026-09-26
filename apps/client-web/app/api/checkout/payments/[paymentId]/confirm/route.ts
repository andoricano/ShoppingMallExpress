import { NextResponse } from "next/server";

import type { ConfirmPaymentInput } from "@mall/types";

import {
    createServiceRoleClient,
    requireAuthenticatedUser,
} from "@/lib/supabase/admin";
import { checkoutErrorResponse } from "@/lib/payment/checkout";
import { recordPgTestPayment } from "@/lib/payment/pgTest";
import {
    PaymentRequestError,
    toPayment,
    type PaymentRow,
} from "@/lib/payment/server";

type RouteContext = { params: Promise<{ paymentId: string }> };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mall v3 server confirm (the primary path): the server records the chosen
 * PG Test outcome with the recorder and only then completes the Order-less
 * Payment. The Client-picked result is a development-only adapter. A completed
 * Payment is returned as-is; a PG Test failure changes nothing (the Payment
 * stays PENDING). Creating the Order is a separate finalize call.
 */
export async function POST(request: Request, context: RouteContext) {
    try {
        const user = await requireAuthenticatedUser(request);
        const { paymentId } = await context.params;
        const body = await request.json().catch(() => null) as Partial<ConfirmPaymentInput> | null;

        if (!UUID_PATTERN.test(paymentId)) {
            throw new PaymentRequestError("결제를 찾을 수 없습니다.", 404);
        }

        if (body?.testResult !== "SUCCESS" && body?.testResult !== "FAILURE") {
            throw new PaymentRequestError("테스트 결제 결과를 선택해 주세요.", 400);
        }

        const supabase = createServiceRoleClient();
        const { data: current, error: loadError } = await supabase
            .from("payments")
            .select("*")
            .eq("id", paymentId)
            .eq("client_id", user.id)
            .maybeSingle();

        if (loadError) {
            throw loadError;
        }

        if (!current) {
            throw new PaymentRequestError("결제를 찾을 수 없습니다.", 404);
        }

        const payment = current as PaymentRow;

        // Idempotent replay: never record or apply a completed payment twice.
        if (payment.status !== "PENDING") {
            return NextResponse.json({ data: toPayment(payment) });
        }

        const record = await recordPgTestPayment({
            id: payment.id,
            isSuccess: body.testResult === "SUCCESS",
            amount: Number(payment.amount),
        });

        const { data, error } = await supabase.rpc("complete_checkout_payment", {
            p_client_id: user.id,
            p_payment_id: payment.id,
            p_succeeded: record.isSuccess,
            p_pg_callback_id: record.callbackId,
            p_failure_reason: record.isSuccess ? null : "PG payment failed",
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: toPayment(data as PaymentRow) });
    } catch (error) {
        return checkoutErrorResponse(error);
    }
}
