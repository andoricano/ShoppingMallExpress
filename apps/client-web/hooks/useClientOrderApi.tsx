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

import { API_BASE_URL } from "@/lib/api";
import { useClientAuthStore } from "@/store/useClientAuthStore";

export function useClientOrderApi() {
    const [
        order,
        setOrder,
    ] = useState<Order | null>(null);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const authUserId =
        useClientAuthStore(
            (state) => state.authUserId,
        );
    const createOrder = useCallback(
        async (
            paymentId: string,
            items: {
                productId: string;
                quantity: number;
            }[],
            shippingAddress: OrderShippingAddress,
            pointAmount: number,
        ) => {
            if (!authUserId) {
                setError(
                    "로그인이 필요합니다.",
                );

                return null;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `${API_BASE_URL}${CLIENT_ORDER_API.BASE}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            clientId:
                                authUserId,
                            paymentId,
                            items,
                            shippingAddress,
                            pointAmount,
                        }),
                    },
                );

                console.log(
                    "[useClientOrderApi] status:",
                    response.status,
                );

                const text =
                    await response.text();

                console.log(
                    "[useClientOrderApi] response:",
                    text,
                );

                const result = text
                    ? JSON.parse(text)
                    : null;

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
        [authUserId],
    );

    const clearOrder =
        useCallback(() => {
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
