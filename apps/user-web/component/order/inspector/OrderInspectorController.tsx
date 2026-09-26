// components/order/inspector/OrderInspectorController.tsx

"use client";

import type { Order, OrderStatus } from "@mall/types";

import { MALL_V3 } from "@/lib/mallVersion";

interface OrderInspectorControllerProps {
    order: Order;

    onTransition?: (order: Order, nextStatus: OrderStatus) => void;
}

export function OrderInspectorController({
    order,
    onTransition,
}: OrderInspectorControllerProps) {
    // v3: an Order exists only after its payment, so there is no PAID step;
    // PROCESSING needs full allocation (the server refuses it otherwise).
    const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = MALL_V3
        ? {
            PENDING: "PROCESSING",
            PROCESSING: "SHIPPED",
            SHIPPED: "DELIVERED",
        }
        : {
            PENDING: "PAID",
            PAID: "PROCESSING",
            PROCESSING: "SHIPPED",
            SHIPPED: "DELIVERED",
        };
    const next = nextStatus[order.status];

    return (
        <section className="px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
                주문 처리
            </h3>

            {next && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onTransition?.(order, next)}
                        className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                    >
                        {next === "PAID" && "결제 완료 처리"}
                        {next === "PROCESSING" && "처리 시작"}
                        {next === "SHIPPED" && "출고 처리"}
                        {next === "DELIVERED" && "배송 완료 처리"}
                    </button>
                </div>
            )}

            {order.status === "DELIVERED" && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                    배송 완료된 주문입니다.
                </div>
            )}

            {order.status === "CANCELLED" && (
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                    취소된 주문입니다.
                </div>
            )}

            {!MALL_V3 && order.status === "PENDING" && (
                <p className="mt-3 text-xs text-slate-400">
                    취소는 주문 소유자의 Consumer 취소 RPC에서만 처리됩니다.
                </p>
            )}
        </section>
    );
}
