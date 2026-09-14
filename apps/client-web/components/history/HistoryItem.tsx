"use client";

import {
    formatDateTime,
    getActionLabel,
    getOrderStatusLabel,
} from "@/utils/orderUtils";

import type { ClientHistoryItem } from "@mall/types";

interface HistoryItemProps {
    history: ClientHistoryItem;

    onClick?: (
        history: ClientHistoryItem,
    ) => void;

    onViewPost?: (
        history: ClientHistoryItem,
    ) => void;
}

const FALLBACK_IMAGE =
    "/ic_target_512.png";

export default function HistoryItem({
    history,
    onClick,
    onViewPost,
}: HistoryItemProps) {
    const firstItem =
        history.order.items[0];

    const totalQuantity =
        history.order.items.reduce(
            (total, item) =>
                total + item.quantity,
            0,
        );

    const productImage =
        firstItem?.product?.mainImageUrl ||
        FALLBACK_IMAGE;

    return (
        <div className="flex w-full items-center gap-5 rounded-xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300 hover:bg-slate-50">
            {/* Main Area */}
            <button
                type="button"
                onClick={() =>
                    onClick?.(history)
                }
                className="flex min-w-0 flex-1 items-center gap-5 text-left"
            >
                {/* Product Image */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img
                        src={productImage}
                        alt={
                            firstItem
                                ?.product?.name ||
                            firstItem
                                ?.productName ||
                            "상품 이미지"
                        }
                        className="h-full w-full object-cover"
                        onError={(event) => {
                            const image =
                                event.currentTarget;

                            if (
                                image.src.endsWith(
                                    FALLBACK_IMAGE,
                                )
                            ) {
                                return;
                            }

                            image.src =
                                FALLBACK_IMAGE;
                        }}
                    />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    {/* 1. Date */}
                    <time
                        dateTime={
                            history.createdAt
                        }
                        className="block text-xs font-medium text-slate-400"
                    >
                        {formatDateTime(
                            history.createdAt,
                        )}
                    </time>

                    {/* 2. Title */}
                    <p className="mt-2 truncate text-base font-semibold text-slate-900">
                        {getActionLabel(
                            history.action,
                        )}
                    </p>

                    {/* 3. Information */}
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                            주문번호{" "}
                            {history.order.id}
                        </span>

                        <span className="text-slate-300">
                            |
                        </span>

                        <span className="font-medium text-slate-700">
                            {history.order.totalPrice.toLocaleString(
                                "ko-KR",
                            )}
                            원
                        </span>

                        <span className="text-slate-300">
                            |
                        </span>

                        <span>
                            {getOrderStatusLabel(
                                history.order.status,
                            )}
                        </span>

                        <span className="text-slate-300">
                            |
                        </span>

                        <span>
                            상품{" "}
                            {totalQuantity}
                            개
                        </span>
                    </div>
                </div>
            </button>

            {/* Post */}
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();

                    onViewPost?.(
                        history,
                    );
                }}
                className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900"
            >
                게시물 보러가기
            </button>
        </div>
    );
}