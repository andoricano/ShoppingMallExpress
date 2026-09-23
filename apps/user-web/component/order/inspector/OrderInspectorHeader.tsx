// components/orders/inspector/OrderInspectorHeader.tsx

"use client";

import type { Order } from "@mall/types";

interface OrderInspectorHeaderProps {
    order: Order;
}

const ORDER_STATUS_LABEL: Record<
    Order["status"],
    string
> = {
    PENDING: "대기중",
    PAID: "결제 완료",
    PROCESSING: "처리중",
    SHIPPED: "출고됨",
    DELIVERED: "배송 완료",
    CANCELLED: "취소",
};

const ORDER_STATUS_CLASS: Record<
    Order["status"],
    string
> = {
    PENDING:
        "bg-amber-50 text-amber-700 border-amber-200",
    PAID:
        "bg-blue-50 text-blue-700 border-blue-200",
    PROCESSING:
        "bg-violet-50 text-violet-700 border-violet-200",
    SHIPPED:
        "bg-cyan-50 text-cyan-700 border-cyan-200",
    DELIVERED:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED:
        "bg-slate-100 text-slate-500 border-slate-200",
};

export function OrderInspectorHeader({
    order,
}: OrderInspectorHeaderProps) {
    return (
        <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="truncate text-base font-bold text-slate-900">
                            주문 상세
                        </h2>

                        <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ORDER_STATUS_CLASS[order.status]}`}
                        >
                            {
                                ORDER_STATUS_LABEL[
                                order.status
                                ]
                            }
                        </span>
                    </div>

                    <p className="mt-1 font-mono text-xs text-slate-400">
                        {order.id}
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-400">
                        주문일시
                    </p>

                    <p className="mt-0.5 text-xs text-slate-600">
                        {new Date(
                            order.createdAt,
                        ).toLocaleString(
                            "ko-KR",
                        )}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-medium text-slate-500">
                    총 주문 금액
                </span>

                <span className="text-lg font-bold text-slate-900">
                    {order.totalAmount.toLocaleString()}
                    원
                </span>
            </div>
        </div>
    );
}
