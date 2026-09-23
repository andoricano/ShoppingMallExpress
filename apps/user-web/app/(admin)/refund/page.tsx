"use client";

import { useRefund } from "@/hooks/refund/useRefund";
import type { RefundRequest } from "@mall/types";
import { useEffect } from "react";

const REFUND_STATUS_LABEL: Record<
    RefundRequest["status"],
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
    } = useRefund();

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        환불 요청
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        환불 요청 데이터를 확인합니다.
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
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    {REFUND_STATUS_LABEL[refund.status]}
                                                </span>

                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
            </div>
        </div>
    );
}
