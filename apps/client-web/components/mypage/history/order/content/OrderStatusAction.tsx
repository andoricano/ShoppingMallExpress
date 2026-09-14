// components/history/order/content/OrderStatusAction.tsx

"use client";

import type { OrderStatus } from "@mall/types";

interface OrderStatusActionProps {
    status: OrderStatus;

    onCancel?: () => void;
    onEdit?: () => void;
    onExchange?: () => void;
    onRefund?: () => void;
}

export default function OrderStatusAction({
    status,
    onCancel,
    onEdit,
    onExchange,
    onRefund,
}: OrderStatusActionProps) {
    if (
        status === "SHIPPING" ||
        status === "CANCELLED"
    ) {
        return null;
    }

    return (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
            {status === "PENDING" && (
                <>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
                    >
                        주문 취소
                    </button>

                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        주문 정보 수정
                    </button>
                </>
            )}

            {status === "COMPLETED" && (
                <>
                    <button
                        type="button"
                        onClick={onExchange}
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        교환 요청
                    </button>

                    <button
                        type="button"
                        onClick={onRefund}
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        환불 요청
                    </button>
                </>
            )}
        </div>
    );
}