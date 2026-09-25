import { NextResponse } from "next/server";

import type { ConfirmPaymentInput } from "@mall/types";

import {
    createServiceRoleClient,
    requireAuthenticatedUser,
} from "@/lib/supabase/admin";
import { recordPgTestPayment } from "@/lib/payment/pgTest";
import {
    PaymentRequestError,
    paymentErrorResponse,
    toPayment,
    type PaymentRow,
} from "@/lib/payment/server";

type RouteContext = { params: Promise<{ paymentId: string }> };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Completes a PENDING payment in PG test mode:
 *   1. load the caller's own payment (server-determined amount),
 *   2. report the chosen test outcome to the PG Test recorder,
 *   3. apply Mall side effects through complete_payment() only after the
 *      recorder confirmed exactly this payment id / amount / outcome.
 * A completed payment is returned as-is without calling the PG Test service
 * again. A PG Test failure (network / non-201 / mismatch) changes nothing;
 * the payment stays PENDING and can be retried.
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

        const isSuccess = body.testResult === "SUCCESS";
        const record = await recordPgTestPayment({
            id: payment.id,
            isSuccess,
            amount: Number(payment.amount),
        });

        const { data, error } = await supabase.rpc("complete_payment", {
            p_client_id: user.id,
            p_payment_id: payment.id,
            p_succeeded: record.isSuccess,
            p_pg_callback_id: record.callbackId,
            p_failure_reason: record.isSuccess ? null : "PG test payment failed",
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: toPayment(data as PaymentRow) });
    } catch (error) {
        return paymentErrorResponse(error);
    }
}
