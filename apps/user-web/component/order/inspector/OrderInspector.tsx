// components/order/inspector/OrderInspector.tsx

"use client";

import type { Order } from "@mall/types";

import { OrderInspectorController } from "./OrderInspectorController";
import { OrderInspectorHeader } from "./OrderInspectorHeader";
import { OrderInspectorItems } from "./OrderInspectorItems";
import { OrderInspectorShipping } from "./OrderInspectorShipping";

interface OrderInspectorProps {
    order: Order | null;

    onShip?: (order: Order) => void;
    onCancel?: (order: Order) => void;
    onComplete?: (order: Order) => void;
}

export function OrderInspector({
    order,
    onShip,
    onCancel,
    onComplete,
}: OrderInspectorProps) {
    if (!order) {
        return (
            <aside className="sticky top-24 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex min-h-[500px] items-center justify-center px-5 py-16 text-center">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            주문을 선택해주세요.
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            좌측 주문 목록에서 주문을 선택하면
                            상세 정보를 확인할 수 있습니다.
                        </p>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="sticky top-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <OrderInspectorHeader
                order={order}
            />

            <OrderInspectorItems
                order={order}
            />

            <OrderInspectorShipping
                order={order}
            />

            <OrderInspectorController
                order={order}
                onShip={onShip}
                onCancel={onCancel}
                onComplete={onComplete}
            />
        </aside>
    );
}