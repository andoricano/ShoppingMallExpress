"use client";

import {
    formatDateTime,
    getOrderStatusLabel,
} from "@/utils/orderUtils";

import type { ClientHistoryItem } from "@mall/types";

interface HistoryItemProps {
    history: ClientHistoryItem;

    onClick?: (
        history: ClientHistoryItem,
    ) => void;
}

const FALLBACK_IMAGE =
    "/ic_target_512.png";

/** One Order from get_order_history(); values are order-time snapshots. */
export default function HistoryItem({
    history,
    onClick,
}: HistoryItemProps) {
    const firstItem = history.items[0];

    const totalQuantity =
        history.items.reduce(
            (total, item) => total + item.quantity,
            0,
        );

    const title = firstItem
        ? history.items.length > 1
            ? `${firstItem.productName} 외 ${history.items.length - 1}건`
            : firstItem.productName
        : "주문 상품 없음";

    return (
        <button
            type="button"
            onClick={() => onClick?.(history)}
            className="flex w-full items-center gap-5 rounded-xl border border-slate-200 bg-white px-5 py-5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img
                    src={firstItem?.imageUrl || FALLBACK_IMAGE}
                    alt={firstItem?.productName || "상품 이미지"}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                        const image = event.currentTarget;

                        if (!image.src.endsWith(FALLBACK_IMAGE)) {
                            image.src = FALLBACK_IMAGE;
                        }
                    }}
                />
            </div>

            <div className="min-w-0 flex-1">
                <time
                    dateTime={history.orderedAt}
                    className="block text-xs font-medium text-slate-400"
                >
                    {formatDateTime(history.orderedAt)}
                </time>

                <p className="mt-2 truncate text-base font-semibold text-slate-900">
                    {title}
                </p>

                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>주문번호 {history.orderNumber ?? "-"}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-medium text-slate-700">
                        {Number(history.totalAmount).toLocaleString("ko-KR")}원
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>{getOrderStatusLabel(history.status)}</span>
                    <span className="text-slate-300">|</span>
                    <span>상품 {totalQuantity}개</span>
                </div>
            </div>
        </button>
    );
}
