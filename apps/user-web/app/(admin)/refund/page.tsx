"use client";

import { useRefund } from "@/hooks/refund/useRefund";
import { useEffect } from "react";


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
                        <pre className="max-h-[700px] overflow-auto rounded-xl bg-slate-950 p-6 text-xs leading-6 text-slate-100">
{JSON.stringify(
    refundList,
    null,
    2,
)}
                        </pre>
                    )}
            </div>
        </div>
    );
}