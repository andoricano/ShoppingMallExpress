"use client";

import type {
    OrderDelivery,
    OrderStatus,
} from "@mall/types";

import {
    getOrderStatusLabel,
} from "@/utils/orderUtils";

import OrderStatusAction from "./OrderStatusAction";

interface OrderDeliveryStatus {
    carrier: string;
    trackingNumber: string;
    status: string;
}

interface OrderStatusCardProps {
    status: OrderStatus;

    delivery: OrderDelivery | null;

    deliveryStatus:
        | OrderDeliveryStatus
        | null;

    onCancel?: () => void;
    onEdit?: () => void;
    onExchange?: () => void;
    onRefund?: () => void;
}

function getStatusDescription(
    status: OrderStatus,
) {
    switch (status) {
        case "PENDING":
            return "주문이 정상적으로 접수되었습니다.";

        case "SHIPPING":
            return "상품이 출고되어 배송이 진행 중입니다.";

        case "COMPLETED":
            return "상품 배송이 완료되었습니다.";

        case "CANCELLED":
            return "주문이 취소되었습니다.";

        default:
            return "";
    }
}

export default function OrderStatusCard({
    status,
    delivery,
    deliveryStatus,
    onCancel,
    onEdit,
    onExchange,
    onRefund,
}: OrderStatusCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* 주문 상태 */}
            <div className="flex items-start justify-between gap-6">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        주문 상태
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        {getOrderStatusLabel(
                            status,
                        )}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {getStatusDescription(
                            status,
                        )}
                    </p>
                </div>

                <div className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {getOrderStatusLabel(
                        status,
                    )}
                </div>
            </div>

            {/* 배송 정보 */}
            {delivery && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                배송 정보
                            </p>

                            <p className="mt-2 text-base font-semibold text-slate-900">
                                {delivery.carrier}
                            </p>
                        </div>

                        {deliveryStatus && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                {
                                    deliveryStatus.status
                                }
                            </span>
                        )}
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-6 text-sm">
                            <span className="text-slate-500">
                                송장번호
                            </span>

                            <span className="font-medium text-slate-900">
                                {
                                    delivery.trackingNumber
                                }
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-6 text-sm">
                            <span className="text-slate-500">
                                출고일
                            </span>

                            <time
                                dateTime={
                                    delivery.shippedAt
                                }
                                className="font-medium text-slate-900"
                            >
                                {
                                    delivery.shippedAt
                                }
                            </time>
                        </div>
                    </div>
                </div>
            )}

            {/* 상태별 Action */}
            <OrderStatusAction
                status={status}
                onCancel={onCancel}
                onEdit={onEdit}
                onExchange={onExchange}
                onRefund={onRefund}
            />
        </section>
    );
}