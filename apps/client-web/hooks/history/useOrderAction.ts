// hooks/order-history/useOrderAction.ts

"use client";

import { authProfile } from "@/lib/authClient";
import { API_ENDPOINTS } from "@mall/constants";
import {
    useCallback,
    useState,
} from "react";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";


export function useOrderAction() {
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

    const requestRefund = useCallback(
        async (orderId: string) => {
            setLoading(true);
            setError(null);

            console.log(
                "[useOrderAction] 환불 요청:",
                orderId,
            );

            try {
                // TODO:
                // 환불 요청 API 연결

                console.log(
                    "[useOrderAction] 환불 요청 API 연결 예정:",
                    orderId,
                );

                return true;
            } catch (err) {
                console.error(
                    "[useOrderAction] 환불 요청 실패:",
                    err,
                );

                const message =
                    err instanceof Error
                        ? err.message
                        : "환불 요청에 실패했습니다.";

                setError(message);

                return false;
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
    // 3. 주문 정보 변경
    // ==========================================

    const updateOrder =
        useCallback(
            async (
                orderId: string,
            ) => {
                setLoading(true);
                setError(null);

                console.log(
                    "[useOrderAction] 주문 정보 변경:",
                    orderId,
                );

                try {
                    // TODO:
                    // 주문 정보 변경 API 연결
                    //
                    // 서버에서 반드시
                    // PENDING 상태인지 검증해야 함

                    console.log(
                        "[useOrderAction] 주문 정보 변경 API 연결 예정:",
                        orderId,
                    );

                    return true;
                } catch (err) {
                    console.error(
                        "[useOrderAction] 주문 정보 변경 실패:",
                        err,
                    );

                    const message =
                        err instanceof Error
                            ? err.message
                            : "주문 정보 변경에 실패했습니다.";

                    setError(message);

                    return false;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    // ==========================================
    // 3. 주문 취소
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