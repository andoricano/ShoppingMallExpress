"use client";

import Link from "next/link";

import type { OrderStatus } from "@mall/types";

import { getOrderStatusLabel } from "@/utils/orderUtils";
import { MALL_V3 } from "@/lib/mallVersion";
import {
    canCancelOrder,
    canPayOrder,
} from "@/hooks/history/useOrderAfterSales";

interface OrderStatusCardProps {
    orderId: string;
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

/**
 * v3: an Order exists only after its payment, so PENDING means "received,
 * waiting to be prepared". No payment-progress or reversal detail is shown
 * (BR-20, DN-19): a cancelled Order only says the payment cancellation follows.
 */
const V3_STATUS_DESCRIPTION: Record<OrderStatus, string> = {
    ...STATUS_DESCRIPTION,
    PENDING: "주문이 접수되어 상품 준비를 기다리고 있습니다.",
    CANCELLED: "주문이 취소되었습니다. 결제 취소는 순차적으로 처리됩니다.",
};

/**
 * Order status. Pay (create_payment) and cancel (cancel_order) are offered
 * only for PENDING orders, as the RPCs enforce.
 */
export default function OrderStatusCard({
    orderId,
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
                {MALL_V3 ? V3_STATUS_DESCRIPTION[status] : STATUS_DESCRIPTION[status]}
            </p>

            {(canPayOrder(status) || (canCancelOrder(status) && onCancel)) && (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                    {canPayOrder(status) && (
                        <Link
                            href={`/payment?orderId=${encodeURIComponent(orderId)}`}
                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            결제하기
                        </Link>
                    )}
                    {canCancelOrder(status) && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={disabled}
                            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            주문 취소
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
