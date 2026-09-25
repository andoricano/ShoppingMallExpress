"use client";

import type { Order } from "@mall/types";

import { formatDateTime } from "@/utils/orderUtils";

interface HistoryOrderHeaderProps {
    order: Order;
}

export default function HistoryOrderHeader({
    order,
}: HistoryOrderHeaderProps) {
    return (
        <header className="flex items-end justify-between gap-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    주문 상세
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    주문번호 {order.orderNumber ?? "-"}
                </p>
            </div>

            <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-400">
                    주문 일시
                </p>

                <time
                    dateTime={order.orderedAt}
                    className="mt-1 block text-sm font-medium text-slate-700"
                >
                    {formatDateTime(order.orderedAt)}
                </time>
            </div>
        </header>
    );
}
