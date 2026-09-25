"use client";

import { useMemo, useState } from "react";

import type {
    Order,
    RefundRequest,
    RefundStatus,
} from "@mall/types";

import { formatDateTime } from "@/utils/orderUtils";
import {
    canRequestRefund,
    getRefundableQuantities,
    type RefundItemInput,
} from "@/hooks/history/useOrderAfterSales";

interface OrderRefundCardProps {
    order: Order;
    refunds: RefundRequest[];
    disabled?: boolean;

    onSubmit?: (
        items: RefundItemInput[],
        reason: string | null,
    ) => Promise<boolean>;
}

const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
    REQUESTED: "요청됨",
    APPROVED: "승인",
    REJECTED: "거절",
    COMPLETED: "환불 완료",
    CANCELLED: "요청 취소",
};

/**
 * Refund requests of the Order and a request form. Availability follows
 * request_refund(): not for PENDING/CANCELLED orders, and at most the
 * remaining (not yet requested) quantity per OrderItem.
 */
export default function OrderRefundCard({
    order,
    refunds,
    disabled = false,
    onSubmit,
}: OrderRefundCardProps) {
    const [open, setOpen] = useState(false);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [reason, setReason] = useState("");

    const refundable = useMemo(
        () => getRefundableQuantities(order, refunds),
        [order, refunds],
    );

    const itemName = (orderItemId: string) =>
        order.items.find((item) => item.id === orderItemId)?.productNameSnapshot
        ?? "주문 상품";

    const hasRefundable = [...refundable.values()].some((quantity) => quantity > 0);
    const canRequest = canRequestRefund(order.status) && hasRefundable && Boolean(onSubmit);

    const selectedItems: RefundItemInput[] = Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

    const handleSubmit = async () => {
        if (!onSubmit || selectedItems.length === 0) {
            return;
        }

        const ok = await onSubmit(selectedItems, reason.trim() || null);

        if (ok) {
            setOpen(false);
            setQuantities({});
            setReason("");
        }
    };

    if (refunds.length === 0 && !canRequest) {
        return null;
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">환불</p>

                {canRequest && !open && (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        disabled={disabled}
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        환불 요청
                    </button>
                )}
            </div>

            {refunds.length > 0 && (
                <ul className="mt-4 space-y-3">
                    {refunds.map((refund) => (
                        <li key={refund.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-900">
                                    {REFUND_STATUS_LABEL[refund.status]}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {formatDateTime(refund.requestedAt)}
                                </span>
                            </div>
                            <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                {(refund.items ?? []).map((item) => (
                                    <li key={item.id} className="flex justify-between">
                                        <span>{itemName(item.orderItemId)} × {item.quantity}</span>
                                        <span>{item.refundAmount.toLocaleString("ko-KR")}원</span>
                                    </li>
                                ))}
                            </ul>
                            {refund.reason && (
                                <p className="mt-2 text-xs text-slate-500">사유: {refund.reason}</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {canRequest && open && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {order.items.map((item) => {
                        const max = refundable.get(item.id) ?? 0;

                        return (
                            <label key={item.id} className="flex items-center justify-between gap-4 text-sm">
                                <span className="min-w-0 truncate text-slate-700">
                                    {item.productNameSnapshot}
                                    {item.variantLabelSnapshot && ` / ${item.variantLabelSnapshot}`}
                                    <span className="ml-1 text-xs text-slate-400">(최대 {max}개)</span>
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={max}
                                    disabled={max === 0 || disabled}
                                    value={quantities[item.id] ?? 0}
                                    onChange={(event) => {
                                        const value = Math.min(max, Math.max(0, Math.floor(Number(event.target.value) || 0)));
                                        setQuantities((current) => ({ ...current, [item.id]: value }));
                                    }}
                                    className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right"
                                />
                            </label>
                        );
                    })}

                    <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="환불 사유 (선택)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        rows={2}
                    />

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700"
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={disabled || selectedItems.length === 0}
                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                        >
                            환불 요청하기
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
