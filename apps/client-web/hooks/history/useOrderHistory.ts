// hooks/order-history/useOrderHistory.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    Order,
} from "@mall/types";
import { CLIENT_ORDER_API } from "@mall/constants";
import { API_BASE_URL } from "@/lib/api";
import { authProfile } from "@/lib/authClient";

interface OrderDeliveryStatus {
    carrier: string;
    trackingNumber: string;
    status: string;
}
export function useOrderHistory() {
    // ==========================================
    // State
    // ==========================================

    const [
        order,
        setOrder,
    ] = useState<Order | null>(null);

    const [
        deliveryStatus,
        setDeliveryStatus,
    ] = useState<OrderDeliveryStatus | null>(
        null,
    );

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    // ==========================================
    // 1. Order 조회
    // ==========================================
    const fetchOrder = useCallback(
        async (orderId: string) => {
            setLoading(true);
            setError(null);

            console.log(
                "[useOrderHistory] fetchOrder:",
                orderId,
            );

            try {
                const session =
                    await authProfile.getSession();

                if (!session?.access_token) {
                    throw new Error(
                        "로그인이 필요합니다.",
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}${CLIENT_ORDER_API.DETAIL(orderId)}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                        },
                    );

                const result =
                    await response
                        .json()
                        .catch(() => null);

                console.log(
                    "[useOrderHistory] Order API result:",
                    result,
                );

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        "주문 정보를 불러오지 못했습니다.",
                    );
                }

                const order =
                    result?.data as Order;

                setOrder(order);

                return order;
            } catch (err) {
                console.error(
                    "[useOrderHistory] Order 조회 실패:",
                    err,
                );

                const message =
                    err instanceof Error
                        ? err.message
                        : "주문 정보를 불러오지 못했습니다.";

                setError(message);
                setOrder(null);

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );


    // ==========================================
    // 2. 배송 상태 조회
    // ==========================================

    const fetchDeliveryStatus =
        useCallback(
            async (
                orderId: string,
            ) => {
                console.log(
                    "[useOrderHistory] 배송 상태 조회:",
                    orderId,
                );

                try {
                    // TODO:
                    // 배송 상태 API 연결

                    console.log(
                        "[useOrderHistory] 배송 상태 API 연결 예정:",
                        orderId,
                    );

                    return null;
                } catch (err) {
                    console.error(
                        "[useOrderHistory] 배송 상태 조회 실패:",
                        err,
                    );

                    return null;
                }
            },
            [],
        );

    // ==========================================
    // 3. 주문 상세 정보 조회
    // ==========================================

    const fetchOrderDetail =
        useCallback(
            async (
                orderId: string,
            ) => {
                console.log(
                    "[useOrderHistory] 주문 상세 정보 조회:",
                    orderId,
                );

                const orderData =
                    await fetchOrder(
                        orderId,
                    );

                const deliveryData =
                    await fetchDeliveryStatus(
                        orderId,
                    );

                if (orderData) {
                    setOrder(
                        orderData,
                    );
                }

                if (deliveryData) {
                    setDeliveryStatus(
                        deliveryData,
                    );
                }

                return {
                    order: orderData,
                    delivery:
                        deliveryData,
                };
            },
            [
                fetchOrder,
                fetchDeliveryStatus,
            ],
        );

    // ==========================================
    // 4. 상태 초기화
    // ==========================================

    const clearOrder =
        useCallback(() => {
            setOrder(null);
            setDeliveryStatus(null);
            setError(null);
        }, []);

    return {
        order,
        deliveryStatus,

        loading,
        error,

        fetchOrder,
        fetchDeliveryStatus,
        fetchOrderDetail,

        clearOrder,
    };
}
