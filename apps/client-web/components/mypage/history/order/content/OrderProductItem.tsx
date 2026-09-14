"use client";

import type { OrderItem } from "@mall/types";

interface OrderProductItemProps {
    item: OrderItem;
}

const FALLBACK_IMAGE =
    "/ic_target_512.png";

export default function OrderProductItem({
    item,
}: OrderProductItemProps) {
    return (
        <article className="flex gap-4 py-5 first:pt-0 last:pb-0">
            {/* Product Image */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img
                    src={FALLBACK_IMAGE}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                />
            </div>

            {/* Product Information */}
            <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                    {item.productName}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                    SKU {item.skuCode}
                </p>

                <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="text-sm text-slate-500">
                        {item.price.toLocaleString(
                            "ko-KR",
                        )}
                        원 × {item.quantity}
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {(
                            item.price *
                            item.quantity
                        ).toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </p>
                </div>
            </div>
        </article>
    );
}