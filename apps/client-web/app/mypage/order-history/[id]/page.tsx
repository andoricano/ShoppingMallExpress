"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";


import { useOrderHistory } from "@/hooks/history/useOrderHistory";
import { useOrderAction } from "@/hooks/history/useOrderAction";
import { useOrderClient } from "@/hooks/history/useOrderClient";
import HistoryOrderHeader from "@/components/mypage/history/HistoryOrderHeader";
import OrderDetailContent from "@/components/mypage/history/order/OrderDetailContent";

export default function HistoryOrderPage() {
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
        requestCancel,
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
            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                {loading && (
                    <div className="flex min-h-[500px] items-center justify-center">
                        주문 정보를 불러오는 중...
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    order && (
                        <div className="space-y-10">
                            <HistoryOrderHeader
                                order={order}
                            />
                            <OrderDetailContent
                                order={order}
                                deliveryStatus={deliveryStatus}
                                onCancel={() =>
                                    requestCancel(order.id)
                                }
                            />
                        </div>
                    )}
            </div>
        </div>
    );
}