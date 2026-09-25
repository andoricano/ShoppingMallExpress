"use client";

import {
    useCallback,
    useRef,
    useState,
} from "react";

import type {
    CreatePaymentInput,
    Payment,
    PaymentTestResult,
} from "@mall/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null) as {
        data?: T;
        message?: string;
    } | null;

    if (!response.ok || !result?.data) {
        throw new Error(result?.message ?? "결제 요청을 처리하지 못했습니다.");
    }

    return result.data;
}

function sameTarget(payment: Payment, input: CreatePaymentInput) {
    return payment.purpose === input.purpose
        && (input.purpose === "ORDER_PAYMENT"
            ? payment.orderId === input.orderId
            : payment.amount === input.amount);
}

/**
 * Browser side of the Mall payment boundary. The browser never talks to the
 * PG Test service; it only calls the Mall Route Handlers:
 *   POST /api/payments                        -> PENDING attempt (server amount)
 *   POST /api/payments/[paymentId]/confirm    -> PG Test record + Mall side effects
 * A PENDING attempt whose confirmation failed (e.g. PG Test unreachable) is
 * reused on retry, so the same attempt is never applied twice.
 */
export function usePaymentApi() {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pendingRef = useRef<Payment | null>(null);

    const pay = useCallback(
        async (
            input: CreatePaymentInput,
            testResult: PaymentTestResult,
        ): Promise<Payment | null> => {
            setProcessing(true);
            setError(null);

            try {
                const pending = pendingRef.current;
                const payment = pending && sameTarget(pending, input)
                    ? pending
                    : await postJson<Payment>("/api/payments", input);

                pendingRef.current = payment;

                const result = await postJson<Payment>(
                    `/api/payments/${payment.id}/confirm`,
                    { testResult },
                );

                pendingRef.current = null;

                if (result.status === "FAILED") {
                    setError(
                        result.failureReason === "Order is no longer payable"
                            ? "결제할 수 없는 주문 상태입니다."
                            : "결제에 실패했습니다.",
                    );
                }

                return result;
            } catch (cause) {
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "결제 요청을 처리하지 못했습니다.",
                );

                return null;
            } finally {
                setProcessing(false);
            }
        },
        [],
    );

    return {
        processing,
        error,
        pay,
    };
}
