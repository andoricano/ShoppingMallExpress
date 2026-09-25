// hooks/history/useOrderHistory.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    Order,
    RefundRequest,
    RefundStatus,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";
import { useClientOrder } from "@/hooks/order/useClientOrder";

type RefundItemRow = {
    id: string;
    refund_request_id: string;
    order_item_id: string;
    quantity: number;
    refund_amount: number;
    created_at: string;
};

type RefundRequestRow = {
    id: string;
    order_id: string;
    client_id: string;
    status: RefundStatus;
    reason: string | null;
    requested_amount: number | null;
    requested_at: string;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    refund_items: RefundItemRow[] | null;
};

function toRefundRequest(row: RefundRequestRow): RefundRequest {
    return {
        id: row.id,
        orderId: row.order_id,
        clientId: row.client_id,
        status: row.status,
        reason: row.reason,
        requestedAmount:
            row.requested_amount === null ? null : Number(row.requested_amount),
        requestedAt: row.requested_at,
        processedAt: row.processed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: (row.refund_items ?? []).map((item) => ({
            id: item.id,
            refundRequestId: item.refund_request_id,
            orderItemId: item.order_item_id,
            quantity: item.quantity,
            refundAmount: Number(item.refund_amount),
            createdAt: item.created_at,
        })),
    };
}

/**
 * One Order with its RefundRequests. Both are read through the owner RLS
 * policies (orders/order_items, refund_requests/refund_items); another
 * user's order resolves to "not found".
 */
export function useOrderHistory() {
    const { fetchOrder } = useClientOrder();

    const [order, setOrder] =
        useState<Order | null>(null);

    const [refunds, setRefunds] =
        useState<RefundRequest[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const fetchOrderDetail = useCallback(
        async (orderId: string) => {
            setLoading(true);
            setError(null);

            try {
                const nextOrder = await fetchOrder(orderId);

                if (!nextOrder) {
                    setOrder(null);
                    setRefunds([]);
                    setError("주문을 찾을 수 없습니다.");

                    return null;
                }

                const { data, error: refundError } = await createClient()
                    .from("refund_requests")
                    .select("id, order_id, client_id, status, reason, requested_amount, requested_at, processed_at, created_at, updated_at, refund_items(id, refund_request_id, order_item_id, quantity, refund_amount, created_at)")
                    .eq("order_id", orderId)
                    .order("requested_at", { ascending: false });

                if (refundError) {
                    throw refundError;
                }

                setOrder(nextOrder);
                setRefunds((data as RefundRequestRow[]).map(toRefundRequest));

                return nextOrder;
            } catch {
                setError("주문 정보를 불러오지 못했습니다.");

                return null;
            } finally {
                setLoading(false);
            }
        },
        [fetchOrder],
    );

    return {
        order,
        refunds,
        loading,
        error,

        fetchOrderDetail,
    };
}
