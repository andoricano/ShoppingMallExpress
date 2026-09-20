// hooks/order-history/useOrderAction.ts

"use client";

import { authProfile } from "@/lib/authClient";
import { API_BASE_URL } from "@/lib/api";
import { API_ENDPOINTS } from "@mall/constants";
import {
    useCallback,
    useState,
} from "react";

export function useOrderAfterSales() {
    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    // ==========================================
    // 1. 환불 요청
    // ==========================================

    // ==========================================
    // 1. 환불 요청
    // ==========================================

    const requestRefund = useCallback(
        async (orderId: string) => {
            setLoading(true);
            setError(null);

            try {
                const session =
                    await authProfile.getSession();

                if (!session?.access_token) {
                    throw new Error(
                        "로그인이 필요합니다.",
                    );
                }

                const url =
                    `${API_BASE_URL}${API_ENDPOINTS.CLIENT_REFUNDS.BASE}`;

                const response =
                    await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                            orderId,
                        }),
                    });

                const result =
                    await response
                        .json()
                        .catch(() => null);

                console.log(
                    "[useOrderAfterSales] 환불 요청 API result:",
                    result,
                );

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        "환불 요청에 실패했습니다.",
                    );
                }

                return result?.data;
            } catch (err) {
                console.error(
                    "[useOrderAfterSales] 환불 요청 실패:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "환불 요청에 실패했습니다.",
                );

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // 2. 교환 요청
    // ==========================================

    const requestExchange =
        useCallback(
            async (
                orderId: string,
            ) => {
                setLoading(true);
                setError(null);

                console.log(
                    "[useOrderAction] 교환 요청:",
                    orderId,
                );

                try {
                    // TODO:
                    // 교환 요청 API 연결

                    console.log(
                        "[useOrderAction] 교환 요청 API 연결 예정:",
                        orderId,
                    );

                    return true;
                } catch (err) {
                    console.error(
                        "[useOrderAction] 교환 요청 실패:",
                        err,
                    );

                    const message =
                        err instanceof Error
                            ? err.message
                            : "교환 요청에 실패했습니다.";

                    setError(message);

                    return false;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );
    // ==========================================
    // 3. 주문 정보 수정
    // ==========================================
    const updateOrder = useCallback(
        async (
            orderId: string,
            shippingAddress: {
                name: string;
                recipient: string;
                phone: string;
                postalCode: string;
                address: string;
                detailAddress?: string;
            },
        ) => {
            setLoading(true);
            setError(null);

            try {
                const session =
                    await authProfile.getSession();

                if (!session?.access_token) {
                    throw new Error(
                        "로그인이 필요합니다.",
                    );
                }

                const url =
                    `${API_BASE_URL}${API_ENDPOINTS.CLIENT_ORDERS.BY_ID(
                        orderId,
                    )}`;

                const response =
                    await fetch(url, {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                            shippingAddress,
                        }),
                    });

                const result =
                    await response
                        .json()
                        .catch(() => null);

                console.log(
                    "[useOrderAction] 주문 정보 수정 API result:",
                    result,
                );

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        "주문 정보 수정에 실패했습니다.",
                    );
                }

                return result?.data;
            } catch (err) {
                console.error(
                    "[useOrderAction] 주문 정보 수정 실패:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "주문 정보 수정에 실패했습니다.",
                );

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );
    // ==========================================
    // 4. 주문 취소
    // ==========================================
    const requestCancel = useCallback(
        async (orderId: string) => {
            setLoading(true);
            setError(null);

            try {
                const session =
                    await authProfile.getSession();

                if (!session?.access_token) {
                    throw new Error(
                        "로그인이 필요합니다.",
                    );
                }

                const url =
                    `${API_BASE_URL}${API_ENDPOINTS.CLIENT_ORDERS.CANCEL(
                        orderId,
                    )}`;

                const response =
                    await fetch(url, {
                        method: "PATCH",
                        headers: {
                            Authorization:
                                `Bearer ${session.access_token}`,
                        },
                    });

                const result =
                    await response
                        .json()
                        .catch(() => null);

                console.log(
                    "[useOrderAction] 주문 취소 API result:",
                    result,
                );

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        "주문 취소에 실패했습니다.",
                    );
                }

                return result?.data;
            } catch (err) {
                console.error(
                    "[useOrderAction] 주문 취소 실패:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "주문 취소에 실패했습니다.",
                );

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,

        requestRefund,
        requestExchange,
        updateOrder,
        requestCancel,
        clearError,
    };
}
