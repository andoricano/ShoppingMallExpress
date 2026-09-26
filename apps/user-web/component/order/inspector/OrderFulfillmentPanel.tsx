"use client";

import { useEffect } from "react";

import type { Order } from "@mall/types";

import { useOrderFulfillment } from "@/hooks/orders/useOrderFulfillment";

interface OrderFulfillmentPanelProps {
    order: Order;
    /** Called after an action changed the Order, so the caller can refresh. */
    onChanged?: () => void;
}

/**
 * Mall v3 (Admin only): ordered / allocated / shortage per OrderItem, an
 * explicit additional allocation, and the Admin cancel of a PENDING Order.
 * Shortage is computed from the allocation records and is never shown to the
 * Consumer. An allocation takes what is available now (possibly nothing); it is
 * never automatic and never takes stock held by another Order.
 */
export function OrderFulfillmentPanel({ order, onChanged }: OrderFulfillmentPanelProps) {
    const { items, busy, error, load, allocate, cancel, createRefund } = useOrderFulfillment();

    useEffect(() => {
        void load(order.id);
    }, [load, order.id, order.status]);

    const nameOf = (orderItemId: string) =>
        order.items.find((item) => item.id === orderItemId)?.productNameSnapshot ?? "상품";

    const totalShortage = items.reduce((sum, item) => sum + item.shortageQuantity, 0);
    const isPending = order.status === "PENDING";

    const handleAllocate = async (orderItemId?: string) => {
        if (await allocate(order.id, orderItemId)) {
            onChanged?.();
        }
    };

    const canSellerRefund = ["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);

    const handleSellerRefund = async () => {
        if (!window.confirm("판매자 사유로 이 주문의 전체 환불 요청을 생성하시겠습니까? 생성 후 환불 화면에서 승인해야 환급이 진행됩니다.")) {
            return;
        }

        const reason = window.prompt("사유 (선택)") ?? "";

        if (await createRefund(order.id, reason.trim() || null)) {
            window.alert("환불 요청을 생성했습니다. 환불 요청 화면에서 승인하세요.");
            onChanged?.();
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("이 주문을 취소하시겠습니까? 할당이 해제되고 결제 전액이 취소 처리됩니다.")) {
            return;
        }

        const reason = window.prompt("취소 사유 (선택)") ?? "";

        if (await cancel(order.id, reason.trim() || null)) {
            onChanged?.();
        }
    };

    return (
        <section className="border-t border-slate-200 px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">할당 · 부족 수량</h3>

            <ul className="space-y-2">
                {items.map((item) => (
                    <li key={item.orderItemId} className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate text-slate-700">{nameOf(item.orderItemId)}</span>
                        <span className="shrink-0 text-slate-500">
                            주문 {item.quantity} · 할당 {item.allocatedQuantity} ·{" "}
                            <span className={item.shortageQuantity > 0 ? "font-semibold text-rose-600" : ""}>
                                부족 {item.shortageQuantity}
                            </span>
                        </span>
                        {isPending && item.shortageQuantity > 0 && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleAllocate(item.orderItemId)}
                                className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                추가 할당
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {isPending && totalShortage > 0 && (
                <p className="mt-3 text-xs text-amber-700">
                    부족 수량이 있어 처리를 시작할 수 없습니다. 재고를 추가한 뒤 할당하거나 주문을 취소하세요.
                </p>
            )}

            {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

            {canSellerRefund && (
                <div className="mt-4">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSellerRefund()}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                        판매자 사유 환불 요청 생성
                    </button>
                </div>
            )}

            {isPending && (
                <div className="mt-4 flex gap-2">
                    {totalShortage > 0 && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleAllocate()}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            전체 추가 할당
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleCancel()}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                        주문 취소
                    </button>
                </div>
            )}
        </section>
    );
}
