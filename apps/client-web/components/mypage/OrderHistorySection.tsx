"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useHistory } from "@/hooks/history/useHistory";
import HistoryItemList from "@/components/history/HistoryItemList";
import { MyPageCardLayout } from "@/components/mypage/MyPageCardLayout";

export default function OrderHistorySection() {
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
            <MyPageCardLayout
                title="주문 이력"
                description="주문 및 배송과 관련된 활동 내역을 확인할 수 있습니다."
            >
                <div className="py-10 text-center text-sm text-slate-500">
                    주문 이력을 불러오는 중입니다...
                </div>
            </MyPageCardLayout>
        );
    }

    if (error) {
        return (
            <MyPageCardLayout
                title="주문 이력"
                description="주문 및 배송과 관련된 활동 내역을 확인할 수 있습니다."
            >
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                    {error}
                </div>
            </MyPageCardLayout>
        );
    }

    return (
        <MyPageCardLayout
            title="주문 이력"
            description="주문 및 배송과 관련된 활동 내역을 확인할 수 있습니다."
        >
            <HistoryItemList
                historyList={historyList}
                onSelect={(history) => {
                    router.push(
                        `/mypage/order-history/${history.order.id}`,
                    );
                }}
            />
        </MyPageCardLayout>
    );
}