// hooks/useClientOrder.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import {
    CLIENT_ORDER_API,
} from "@mall/constants";

import type {
    Order,
    OrderShippingAddress,
} from "@mall/types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

export function useClientOrderApi() {
    const [order, setOrder] =
        useState<Order | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const createOrder = useCallback(
        async (
            clientId: string,
            paymentId: string,
            items: {
                productId: string;
                quantity: number;
            }[],
            shippingAddress: OrderShippingAddress,
        ) => {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await fetch(
                        `${API_BASE_URL}${CLIENT_ORDER_API.BASE}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                clientId,
                                paymentId,
                                items,
                                shippingAddress,
                            }),
                        },
                    );

                const result =
                    await response
                        .json()
                        .catch(() => null);
                console.error(
                    "[useClientOrderApi] API error:",
                    result,
                );
                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        "주문 생성에 실패했습니다.",
                    );
                }

                const orderData =
                    result?.data as Order;

                setOrder(orderData);

                return orderData;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "주문 생성에 실패했습니다.";

                setError(message);
                setOrder(null);

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const clearOrder = useCallback(() => {
        setOrder(null);
        setError(null);
    }, []);

    return {
        order,
        loading,
        error,

        createOrder,
        clearOrder,
    };
}