"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import {
    useOrderHistory,
} from "@/hooks/history/useOrderHistory";

import {
    useOrderAfterSales,
} from "@/hooks/history/useOrderAfterSales";

import HistoryOrderHeader from "@/components/mypage/history/HistoryOrderHeader";
import OrderEditSection from "@/components/mypage/history/order/edit/OrderEditSection";

export default function OrderUpdatePage() {
    const params = useParams();
    const router = useRouter();

    const {
        order,
        loading: orderLoading,
        error: orderError,
        fetchOrderDetail,
    } = useOrderHistory();

    const {
        loading: actionLoading,
        updateOrder,
        error: actionError,
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

    const loading =
        orderLoading ||
        actionLoading;

    const error =
        orderError ||
        actionError;

    const handleSubmit = async (
        shippingAddress: Parameters<
            typeof updateOrder
        >[1],
    ) => {
        if (!orderId) {
            return;
        }

        const result =
            await updateOrder(
                orderId,
                shippingAddress,
            );

        if (!result) {
            return;
        }

        router.push(
            `/mypage/order-history/${orderId}`,
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-6 py-10">
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
                        <div className="space-y-8">
                            <HistoryOrderHeader
                                order={order}
                            />

                            <OrderEditSection
                                order={order}
                                loading={
                                    actionLoading
                                }
                                onSubmit={
                                    handleSubmit
                                }
                            />
                        </div>
                    )}
            </div>
        </div>
    );
}