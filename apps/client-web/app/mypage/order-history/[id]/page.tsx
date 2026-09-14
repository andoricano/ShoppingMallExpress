// app/mypage/order-history/[id]/page.tsx

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useOrderHistory } from "@/hooks/history/useOrderHistory";
import { useOrderAction } from "@/hooks/history/useOrderAction";
import { useOrderClient } from "@/hooks/history/useOrderClient";

export default function OrderHistoryPage() {
    const params = useParams();

    const {
        order,
        deliveryStatus,
        loading: orderLoading,
        error: orderError,
        fetchOrderDetail,
    } = useOrderHistory();

    const {
        loading: actionLoading,
        error: actionError,
    } = useOrderAction();

    const {
        loading: clientLoading,
        error: clientError,
    } = useOrderClient();

    const orderId =
        typeof params.id === "string"
            ? params.id
            : null;

    useEffect(() => {
        if (!orderId) {
            return;
        }

        fetchOrderDetail(orderId);
    }, [
        orderId,
        fetchOrderDetail,
    ]);

    const loading =
        orderLoading ||
        actionLoading ||
        clientLoading;

    const error =
        orderError ||
        actionError ||
        clientError;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <header>
                    <h1 className="text-3xl font-bold text-slate-900">
                        주문 상세
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        주문 및 배송 정보를 확인할 수 있습니다.
                    </p>
                </header>

                <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-5">
                        <p className="text-sm font-semibold text-slate-900">
                            Hook 상태
                        </p>
                    </div>

                    <pre className="max-h-[600px] overflow-auto rounded-lg bg-slate-950 p-5 text-xs leading-6 text-slate-100">
{JSON.stringify(
    {
        orderId,
        loading,
        error,
        order,
        deliveryStatus,
    },
    null,
    2,
)}
                    </pre>
                </div>
            </div>
        </div>
    );
}