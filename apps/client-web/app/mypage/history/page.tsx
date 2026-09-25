"use client";

import { useEffect } from "react";

import { useHistory } from "@/hooks/history/useHistory";
import HistoryItemList from "@/components/history/HistoryItemList";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
    const router = useRouter();
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
            <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
                주문 내역 불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-120px)] px-6 py-10">
                <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-120px)] w-full">
            <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">
                        주문 내역
                    </h1>

                    <p className="mt-3 text-sm text-slate-500">
                        주문하신 내역을 확인할 수 있습니다.
                    </p>
                </header>

                {/* History */}
                <section className="flex-1">
                    <HistoryItemList
                        historyList={
                            historyList
                        }
                        onSelect={(history) => {
                            router.push(
                                `/mypage/order-history/${history.id}`,
                            );
                        }}
                    />
                </section>
            </div>
        </div>
    );
}