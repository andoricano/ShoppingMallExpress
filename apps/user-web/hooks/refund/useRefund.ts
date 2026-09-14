// hooks/refunds/useRefund.ts

"use client";

import {
    useCallback,
    useState,
} from "react";


import {
    API_ENDPOINTS,
} from "@mall/constants";
import { RefundRequest } from "@mall/types";

export function useRefund() {
    const [
        refundList,
        setRefundList,
    ] = useState<RefundRequest[]>([]);

    const [
        selectedRefund,
        setSelectedRefund,
    ] = useState<RefundRequest | null>(
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
    // 환불 요청 목록 조회
    // ==========================================

    const fetchRefunds = useCallback(
        async () => {
            setLoading(true);
            setError(null);

            try {
                const res =
                    await fetch(
                        API_ENDPOINTS.REFUNDS.BASE,
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
                        "환불 요청 목록 조회에 실패했습니다.",
                    );
                }

                const result =
                    await res.json();

                const refunds =
                    Array.isArray(
                        result.data,
                    )
                        ? (result.data as RefundRequest[])
                        : [];

                setRefundList(
                    refunds,
                );

                return refunds;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "환불 요청 목록 조회에 실패했습니다.",
                );

                setRefundList([]);

                return [];
            } finally {
                setLoading(false);
            }
        },
        [],
    );
    // ==========================================
    // 환불 요청 처리
    // ==========================================

    const processRefund = useCallback(
        async (
            refundId: string,
            status:
                | "APPROVED"
                | "REJECTED",
        ) => {
            setLoading(true);
            setError(null);

            try {
                const res =
                    await fetch(
                        API_ENDPOINTS.REFUNDS.BY_ID(
                            refundId,
                        ),
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                status,
                            }),
                        },
                    );

                const result =
                    await res
                        .json()
                        .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "환불 요청 처리에 실패했습니다.",
                    );
                }

                return result?.data;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "환불 요청 처리에 실패했습니다.",
                );

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );
    return {
        refundList,
        selectedRefund,

        loading,
        error,

        fetchRefunds,
        processRefund
    };
}