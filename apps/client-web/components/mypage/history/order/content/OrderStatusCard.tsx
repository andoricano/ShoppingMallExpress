"use client";

import type { OrderStatus } from "@mall/types";

import { getOrderStatusLabel } from "@/utils/orderUtils";
import { canCancelOrder } from "@/hooks/history/useOrderAfterSales";

interface OrderStatusCardProps {
    status: OrderStatus;
    disabled?: boolean;
    onCancel?: () => void;
}

const STATUS_DESCRIPTION: Record<OrderStatus, string> = {
    PENDING: "주문이 접수되었습니다.",
    PAID: "결제가 완료되었습니다.",
    PROCESSING: "상품을 준비하고 있습니다.",
    SHIPPED: "상품이 출고되어 배송 중입니다.",
    DELIVERED: "상품 배송이 완료되었습니다.",
    CANCELLED: "주문이 취소되었습니다.",
};

/** Order status; the cancel action follows cancel_order() (PENDING only). */
export default function OrderStatusCard({
    status,
    disabled = false,
    onCancel,
}: OrderStatusCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">주문 상태</p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {getOrderStatusLabel(status)}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
                {STATUS_DESCRIPTION[status]}
            </p>

            {canCancelOrder(status) && onCancel && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={disabled}
                        className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        주문 취소
                    </button>
                </div>
            )}
        </section>
    );
}
