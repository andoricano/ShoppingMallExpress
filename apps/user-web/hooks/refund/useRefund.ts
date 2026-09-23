// hooks/refunds/useRefund.ts

"use client";

import {
    useCallback,
    useState,
} from "react";


import { RefundRequest } from "@mall/types";

export function useRefund() {
    const [
        refundList,
        setRefundList,
    ] = useState<RefundRequest[]>([]);

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
                const res = await fetch("/api/admin/refunds");

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
    return {
        refundList,
        loading,
        error,

        fetchRefunds,
    };
}
