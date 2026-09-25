// hooks/refunds/useRefund.ts

"use client";

import {
    useCallback,
    useState,
} from "react";


import type {
    AdminRefundRequest,
    AdminRestockRefundItemInput,
} from "@mall/types";

export function useRefund() {
    const [
        refundList,
        setRefundList,
    ] = useState<AdminRefundRequest[]>([]);

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

    // `silent` refreshes the list in place (no loading state), so a row the
    // Admin is working in stays mounted.
    const fetchRefunds = useCallback(
        async (options?: { silent?: boolean }) => {
            if (!options?.silent) {
                setLoading(true);
            }
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
                        ? (result.data as AdminRefundRequest[])
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
                if (!options?.silent) {
                    setLoading(false);
                }
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

    // ==========================================
    // 반품 확인 후 재고 복구 (Admin)
    // ==========================================
    // Failures are returned to the calling row instead of the list-level
    // `error`, which replaces the whole list.
    const restockRefundItem = useCallback(async (
        refundId: string,
        input: AdminRestockRefundItemInput,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
        try {
            const response = await fetch(
                `/api/admin/refunds/${refundId}/restocks`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                },
            );
            const payload = await response.json().catch(() => null) as {
                message?: string;
            } | null;

            if (!response.ok) {
                return {
                    ok: false,
                    message: payload?.message ?? "재고 복구에 실패했습니다.",
                };
            }

            await fetchRefunds({ silent: true });
            return { ok: true };
        } catch (requestError) {
            return {
                ok: false,
                message: requestError instanceof Error
                    ? requestError.message
                    : "재고 복구에 실패했습니다.",
            };
        }
    }, [fetchRefunds]);

    return {
        refundList,
        loading,
        error,

        fetchRefunds,
        processRefund,
        restockRefundItem,
    };
}
