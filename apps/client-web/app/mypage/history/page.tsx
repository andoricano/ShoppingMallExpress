"use client";

import { useEffect } from "react";

import { useHistory } from "@/hooks/useHistory";
import HistoryItemList from "@/components/history/HistoryItemList";

export default function HistoryPage() {
    const {
        historyList,
        loading,
        error,
        fetchHistory,
    } = useHistory();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                History 불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900">
                    주문 이력
                </h1>

                <p className="mt-3 text-sm text-slate-500">
                    주문 및 배송과 관련된 활동 내역을 확인할 수 있습니다.
                </p>
            </header>

            {/* History */}
            <HistoryItemList
                historyList={historyList}
                onSelect={(history) => {
                    // targetId로 Order 조회
                }}
            />
        </div>
    );
}