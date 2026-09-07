// components/order/inspector/OrderInspectorController.tsx

"use client";

import type { Order } from "@mall/types";

interface OrderInspectorControllerProps {
    order: Order;

    onShip?: (order: Order) => void;
    onCancel?: (order: Order) => void;
    onComplete?: (order: Order) => void;
}

export function OrderInspectorController({
    order,
    onShip,
    onCancel,
    onComplete,
}: OrderInspectorControllerProps) {
    const handleShip = () => {
        onShip?.(order);
    };

    const handleCancel = () => {
        const confirmed = window.confirm(
            "이 주문을 취소하시겠습니까?",
        );

        if (!confirmed) {
            return;
        }

        onCancel?.(order);
    };

    const handleComplete = () => {
        onComplete?.(order);
    };

    return (
        <section className="px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
                주문 처리
            </h3>

            {order.status === "PENDING" && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleShip}
                        className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                    >
                        출고
                    </button>

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        취소
                    </button>
                </div>
            )}

            {order.status === "SHIPPING" && (
                <button
                    type="button"
                    onClick={handleComplete}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                >
                    배송 완료
                </button>
            )}

            {order.status === "COMPLETED" && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                    배송 완료된 주문입니다.
                </div>
            )}

            {order.status === "CANCELLED" && (
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                    취소된 주문입니다.
                </div>
            )}
        </section>
    );
}