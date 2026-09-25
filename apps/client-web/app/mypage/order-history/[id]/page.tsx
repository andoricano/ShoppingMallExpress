"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useOrderHistory } from "@/hooks/history/useOrderHistory";
import { useOrderAfterSales } from "@/hooks/history/useOrderAfterSales";
import HistoryOrderHeader from "@/components/mypage/history/HistoryOrderHeader";
import OrderDetailContent from "@/components/mypage/history/order/OrderDetailContent";

export default function HistoryOrderPage() {
    const params = useParams();

    const {
        order,
        refunds,
        loading: orderLoading,
        error: orderError,
        fetchOrderDetail,
    } = useOrderHistory();

    const {
        loading: actionLoading,
        error: actionError,
        requestCancel,
        requestRefund,
    } = useOrderAfterSales();

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

    const handleCancel = async () => {
        if (!order || !window.confirm("주문을 취소하시겠습니까?")) {
            return;
        }

        if (await requestCancel(order.id)) {
            await fetchOrderDetail(order.id);
        }
    };

    const handleRefund = async (
        items: Parameters<typeof requestRefund>[1],
        reason: string | null,
    ) => {
        if (!order) {
            return false;
        }

        const ok = await requestRefund(order.id, items, reason);

        if (ok) {
            await fetchOrderDetail(order.id);
        }

        return ok;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                {orderLoading && !order && (
                    <div className="flex min-h-[500px] items-center justify-center">
                        주문 정보를 불러오는 중...
                    </div>
                )}

                {orderError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                        {orderError}
                    </div>
                )}

                {order && (
                    <div className="space-y-10">
                        <HistoryOrderHeader order={order} />

                        {actionError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                                {actionError}
                            </div>
                        )}

                        <OrderDetailContent
                            order={order}
                            refunds={refunds}
                            actionLoading={actionLoading || orderLoading}
                            onCancel={handleCancel}
                            onRefund={handleRefund}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
