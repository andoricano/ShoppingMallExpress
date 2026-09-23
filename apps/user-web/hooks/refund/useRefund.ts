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

    const processRefund = useCallback(async (
        refundId: string,
        status: "APPROVED" | "REJECTED",
    ) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/refunds/${refundId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const payload = await response.json().catch(() => null) as {
                message?: string;
            } | null;

            if (!response.ok) {
                throw new Error(
                    payload?.message ?? "환불 요청 처리에 실패했습니다.",
                );
            }

            await fetchRefunds();
            return true;
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "환불 요청 처리에 실패했습니다.",
            );
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchRefunds]);
    return {
        refundList,
        loading,
        error,

        fetchRefunds,
        processRefund,
    };
}
