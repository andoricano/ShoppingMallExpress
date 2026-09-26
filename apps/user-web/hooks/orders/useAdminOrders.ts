// hooks/orders/useAdminOrders.ts

"use client";

import { useCallback, useState } from "react";

import { MALL_V3 } from "@/lib/mallVersion";
import type { Order } from "@mall/types";

/** Re-reads an Order after a v3 transition (the route returns only the outcome). */
async function fetchOrderAfterAdvance(orderId: string): Promise<Order> {
    const res = await fetch(`/api/admin/orders/${orderId}`);
    const result = await res.json().catch(() => null) as { data?: Order; message?: string } | null;

    if (!res.ok || !result?.data) {
        throw new Error(result?.message || "주문 상세 조회에 실패했습니다.");
    }

    return result.data;
}

export function useAdminOrders() {
    const [orderList, setOrderList] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] =
        useState<Order | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // ==========================================
    // 주문 목록 조회
    // ==========================================

    const fetchOrders = useCallback(
        async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch("/api/admin/orders");

                if (!res.ok) {
                    const result = await res
                        .json()
                        .catch(() => null);

                    throw new Error(
                        result?.message ||
                        "주문 목록 조회에 실패했습니다.",
                    );
                }

                const result =
                    await res.json();

                setOrderList(
                    result.data ?? [],
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "주문 목록 조회에 실패했습니다.",
                );
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // 주문 상세 조회
    // ==========================================

    const fetchOrder = useCallback(
        async (orderId: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/admin/orders/${orderId}`);

                if (!res.ok) {
                    const result =
                        await res
                            .json()
                            .catch(() => null);

                    throw new Error(
                        result?.message ||
                        "주문 상세 조회에 실패했습니다.",
                    );
                }

                const result =
                    await res.json();

                const order =
                    result.data as Order;

                setSelectedOrder(order);

                return order;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "주문 상세 조회에 실패했습니다.",
                );

                setSelectedOrder(null);

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // 주문 상태 변경
    // ==========================================

    const updateOrderStatus =
        useCallback(
            async (
                orderId: string,
                nextStatus: Order["status"],
            ) => {
                setLoading(true);
                setError(null);

                try {
                    // v3: one step forward through the fulfillment route (the
                    // response is the transition outcome, so the Order is re-read).
                    const res =
                        await fetch(MALL_V3
                            ? `/api/admin/orders/${orderId}/advance`
                            : `/api/admin/orders/${orderId}`,
                            {
                                method: MALL_V3 ? "POST" : "PATCH",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify({ nextStatus }),
                            },
                        );

                    if (!res.ok) {
                        const result =
                            await res
                                .json()
                                .catch(
                                    () => null,
                                );

                        throw new Error(
                            result?.message ||
                            "주문 상태 변경에 실패했습니다.",
                        );
                    }

                    const result =
                        await res.json();

                    const updatedOrder = MALL_V3
                        ? await fetchOrderAfterAdvance(orderId)
                        : result.data as Order;

                    setSelectedOrder(
                        updatedOrder,
                    );

                    return updatedOrder;
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "주문 상태 변경에 실패했습니다.",
                    );

                    throw err;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    // ==========================================
    // 선택 주문 초기화
    // ==========================================

    const clearSelectedOrder =
        useCallback(() => {
            setSelectedOrder(null);
        }, []);

    return {
        orderList,
        selectedOrder,

        loading,
        error,

        fetchOrders,
        fetchOrder,
        updateOrderStatus,
        clearSelectedOrder,
    };
}
