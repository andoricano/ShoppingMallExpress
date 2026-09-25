"use client";

import { useRefund } from "@/hooks/refund/useRefund";
import type { AdminRefundRequest } from "@mall/types";
import { RefundItemRestockRow } from "@/component/refund/RefundItemRestockRow";
import { useEffect, useState } from "react";

const REFUND_STATUS_LABEL: Record<
    AdminRefundRequest["status"],
    string
> = {
    REQUESTED: "처리 대기",
    APPROVED: "승인됨",
    REJECTED: "거절됨",
    COMPLETED: "완료",
    CANCELLED: "취소됨",
};

export default function RefundPage() {
    const {
        refundList,
        loading,
        error,
        fetchRefunds,
        processRefund,
        restockRefundItem,
    } = useRefund();

    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const handleProcessRefund = async (
        refund: AdminRefundRequest,
        status: "APPROVED" | "REJECTED",
    ) => {
        if (!window.confirm(
            `이 환불 요청을 ${status === "APPROVED" ? "승인" : "거절"}하시겠습니까?`,
        )) {
            return;
        }

        setProcessingId(refund.id);
        try {
            await processRefund(refund.id, status);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        환불 요청
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        환불 요청을 처리합니다. 승인만으로는 재고가 변하지 않으며, 반품을 확인한 뒤 승인된 환불 항목별로 재고를 복구합니다.
                    </p>
                </header>

                {loading && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                        환불 요청을 불러오는 중...
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error && (
                        <div className="space-y-3">
                            {refundList.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                                    환불 요청이 없습니다.
                                </div>
                            ) : refundList.map((refund) => {
                                const isProcessing = processingId === refund.id;
                                const canProcess = refund.status === "REQUESTED";

                                return (
                                    <article
                                        key={refund.id}
                                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <p className="font-mono text-xs text-slate-500">
                                                    환불 ID: {refund.id}
                                                </p>
                                                <h2 className="mt-2 text-base font-semibold text-slate-900">
                                                    주문 {refund.orderId}
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    사유: {refund.reason ?? "사유 없음"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    요청일: {new Date(refund.createdAt).toLocaleString("ko-KR")}
                                                </p>
                                                {refund.processedAt && (
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        처리일: {new Date(refund.processedAt).toLocaleString("ko-KR")}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    {REFUND_STATUS_LABEL[refund.status]}
                                                </span>
                                                {canProcess && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing}
                                                            onClick={() => void handleProcessRefund(refund, "APPROVED")}
                                                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                                        >
                                                            승인
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing}
                                                            onClick={() => void handleProcessRefund(refund, "REJECTED")}
                                                            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                                                        >
                                                            거절
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {refund.items.length > 0 && (
                                            <ul className="mt-4 space-y-2">
                                                {refund.items.map((item) => (
                                                    <RefundItemRestockRow
                                                        key={item.id}
                                                        refundId={refund.id}
                                                        item={item}
                                                        approved={refund.status === "APPROVED"}
                                                        onRestock={restockRefundItem}
                                                    />
                                                ))}
                                            </ul>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
            </div>
        </div>
    );
}
