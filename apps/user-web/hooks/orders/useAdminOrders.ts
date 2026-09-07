// hooks/orders/useAdminOrders.ts

"use client";

import { useCallback, useState } from "react";

import type { Order } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

export interface UpdateOrderStatusInput {
    status: Order["status"];

    delivery?: {
        carrier: string;
        trackingNumber: string;
        shippedAt?: string;
    };
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
                const res = await fetch(
                    API_ENDPOINTS.ORDERS.BASE,
                );

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
                const res = await fetch(
                    API_ENDPOINTS.ORDERS.BY_ID(
                        orderId,
                    ),
                );

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
                data: UpdateOrderStatusInput,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const res =
                        await fetch(
                            API_ENDPOINTS.ORDERS.BY_ID(
                                orderId,
                            ),
                            {
                                method: "PATCH",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify(
                                    data,
                                ),
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

                    const updatedOrder =
                        result.data as Order;

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