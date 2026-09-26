// hooks/history/useOrderAfterSales.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    Order,
    OrderStatus,
    RefundRequest,
    RefundStatus,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";
import { MALL_V3 } from "@/lib/mallVersion";

// Lifecycle rules owned by the RPCs; the UI only mirrors them.
/** cancel_order(): "Only PENDING orders may be cancelled". */
const CANCELLABLE_STATUSES: readonly OrderStatus[] = ["PENDING"];

/** request_refund(): rejects PENDING and CANCELLED orders. */
const NON_REFUNDABLE_STATUSES: readonly OrderStatus[] = ["PENDING", "CANCELLED"];

/** request_refund() ignores these requests when summing refunded quantity. */
const INACTIVE_REFUND_STATUSES: readonly RefundStatus[] = ["REJECTED", "CANCELLED"];

/** v3 (BR-37): Refund is possible only for PROCESSING, SHIPPED, and DELIVERED. */
const V3_REFUNDABLE_STATUSES: readonly OrderStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED"];

/**
 * v2: create_payment() pays an existing PENDING Order. v3: an Order exists only
 * after the payment (payment first), so there is nothing to pay on an Order.
 */
export function canPayOrder(status: OrderStatus) {
    return !MALL_V3 && status === "PENDING";
}

export function canCancelOrder(status: OrderStatus) {
    return CANCELLABLE_STATUSES.includes(status);
}

export function canRequestRefund(status: OrderStatus) {
    return MALL_V3
        ? V3_REFUNDABLE_STATUSES.includes(status)
        : !NON_REFUNDABLE_STATUSES.includes(status);
}

/** Remaining refundable quantity per OrderItem id. */
export function getRefundableQuantities(
    order: Order,
    refunds: RefundRequest[],
) {
    const requested = new Map<string, number>();

    for (const refund of refunds) {
        if (INACTIVE_REFUND_STATUSES.includes(refund.status)) {
            continue;
        }

        for (const item of refund.items ?? []) {
            requested.set(
                item.orderItemId,
                (requested.get(item.orderItemId) ?? 0) + item.quantity,
            );
        }
    }

    return new Map(
        order.items.map((item) => [
            item.id,
            Math.max(0, item.quantity - (requested.get(item.id) ?? 0)),
        ]),
    );
}

export interface RefundItemInput {
    orderItemId: string;
    quantity: number;
}

function toAfterSalesErrorMessage(error: unknown, fallback: string) {
    const message =
        typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "";

    // v3 Route Handlers already answer in user language.
    if (/[가-힣]/.test(message)) return message;
    if (message.includes("Authentication required")) return "로그인이 필요합니다.";
    if (message.includes("Order not found")) return "주문을 찾을 수 없습니다.";
    if (message.includes("Only PENDING orders may be cancelled")) return "주문 접수 상태에서만 취소할 수 있습니다.";
    if (message.includes("cannot be refunded in status")) return "현재 주문 상태에서는 환불을 요청할 수 없습니다.";
    if (message.includes("Refund items are required")) return "환불할 상품을 선택해 주세요.";
    if (message.includes("Refund quantity exceeds ordered quantity")) return "환불 요청 수량이 주문 수량을 초과합니다.";
    if (message.includes("does not belong to Order") || message.includes("Invalid refund item")) return "잘못된 환불 요청입니다.";

    return fallback;
}

/** v3 Route Handler call in the same shape as an RPC result. */
async function postOrderRoute(path: string, body: unknown): Promise<{ error: unknown }> {
    try {
        const response = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            return { error: null };
        }

        const result = await response.json().catch(() => null) as { message?: string } | null;

        return { error: { message: result?.message ?? "" } };
    } catch {
        return { error: { message: "" } };
    }
}

/**
 * Cancel and Refund request for the caller's own Orders. v2: browser RPCs
 * (cancel_order, request_refund). v3: the Route Handlers, which cancel the whole
 * PENDING Order with its payment reversal and create partial Refund requests
 * priced at the immutable snapshot.
 */
export function useOrderAfterSales() {
    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const run = useCallback(
        async (
            call: () => PromiseLike<{ error: unknown }>,
            fallback: string,
        ) => {
            setLoading(true);
            setError(null);

            try {
                const { error: rpcError } = await call();

                if (rpcError) {
                    throw rpcError;
                }

                return true;
            } catch (cause) {
                setError(toAfterSalesErrorMessage(cause, fallback));

                return false;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const requestCancel = useCallback(
        (orderId: string) =>
            run(
                () => MALL_V3
                    ? postOrderRoute(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {})
                    : createClient().rpc("cancel_order", { p_order_id: orderId }),
                "주문을 취소하지 못했습니다.",
            ),
        [run],
    );

    const requestRefund = useCallback(
        (orderId: string, items: RefundItemInput[], reason: string | null) =>
            run(
                () => MALL_V3
                    ? postOrderRoute(
                        `/api/orders/${encodeURIComponent(orderId)}/refund`,
                        { items, ...(reason ? { reason } : {}) },
                    )
                    : createClient().rpc("request_refund", {
                        p_order_id: orderId,
                        p_items: items,
                        p_reason: reason,
                    }),
                "환불을 요청하지 못했습니다.",
            ),
        [run],
    );

    return {
        loading,
        error,

        requestCancel,
        requestRefund,
    };
}
