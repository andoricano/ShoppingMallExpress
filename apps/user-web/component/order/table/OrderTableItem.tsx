// components/orders/list/OrderTableItem.tsx

"use client";

import type { Order } from "@mall/types";

import { MALL_V3 } from "@/lib/mallVersion";

interface OrderTableItemProps {
    order: Order;

    onDetail?: (order: Order) => void;
}

const ORDER_STATUS_LABEL: Record<
    Order["status"],
    string
> = {
    PENDING: MALL_V3 ? "처리 대기" : "대기중",
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

export function OrderTableItem({
    order,
    onDetail,
}: OrderTableItemProps) {
    const items = Array.isArray(
        order.items,
    )
        ? order.items
        : [];

    const firstItem = items[0];

    let itemSummary =
        "주문 상품 정보 없음";

    if (items.length === 1) {
        itemSummary =
            firstItem?.productNameSnapshot ??
            "상품 정보 없음";
    } else if (items.length > 1) {
        itemSummary = `${firstItem?.productNameSnapshot ??
            "상품"
            } 외 ${items.length - 1}개`;
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 hover:bg-slate-50/50">
            {/* 1줄 : 주문 기본 정보 */}
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800">
                            {itemSummary}
                        </span>

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
                </div>

                <span className="shrink-0 text-sm font-bold text-slate-900">
                    {(
                        order.totalAmount ??
                        0
                    ).toLocaleString()}
                    원
                </span>
            </div>

            {/* 2줄 : 주문 / 구매자 정보 */}
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span>
                    주문번호{" "}
                    <span className="font-mono text-slate-600">
                        {order.id
                            ? order.id.slice(
                                0,
                                8,
                            )
                            : "-"}
                    </span>
                </span>

                <span className="text-slate-300">
                    ·
                </span>

                <span>
                    {order.createdAt
                        ? new Date(
                            order.createdAt,
                        ).toLocaleDateString(
                            "ko-KR",
                        )
                        : "날짜 정보 없음"}
                </span>
            </div>

            {/* 3줄 : 액션 */}
            <div className="mt-3 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-400">
                    {order.clientId ||
                        "Client 정보 없음"}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() =>
                            onDetail?.(
                                order,
                            )
                        }
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        자세히
                    </button>
                </div>
            </div>
        </div>
    );
}
