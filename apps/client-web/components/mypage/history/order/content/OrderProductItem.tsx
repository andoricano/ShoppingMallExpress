"use client";

import type { OrderItem } from "@mall/types";

interface OrderProductItemProps {
    item: OrderItem;
}

const FALLBACK_IMAGE =
    "/ic_target_512.png";

/** Renders only the immutable order-time snapshot of the item. */
export default function OrderProductItem({
    item,
}: OrderProductItemProps) {
    return (
        <article className="flex gap-4 py-5 first:pt-0 last:pb-0">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img
                    src={item.imageUrlSnapshot || FALLBACK_IMAGE}
                    alt={item.productNameSnapshot}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                    {item.productNameSnapshot}
                </h3>

                {item.variantLabelSnapshot && (
                    <p className="mt-1 text-xs text-slate-400">
                        {item.variantLabelSnapshot}
                    </p>
                )}

                <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="text-sm text-slate-500">
                        {item.unitPrice.toLocaleString("ko-KR")}원 × {item.quantity}
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {item.lineTotal.toLocaleString("ko-KR")}원
                    </p>
                </div>
            </div>
        </article>
    );
}
