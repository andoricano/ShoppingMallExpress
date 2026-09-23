// components/orders/inspector/OrderInspectorItems.tsx

"use client";

import type { Order } from "@mall/types";

interface OrderInspectorItemsProps {
    order: Order;
}

export function OrderInspectorItems({
    order,
}: OrderInspectorItemsProps) {
    const items = Array.isArray(order.items)
        ? order.items
        : [];

    return (
        <section className="border-b border-slate-200 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                    주문 상품
                </h3>

                <span className="text-xs text-slate-400">
                    {items.length}개 상품
                </span>
            </div>

            {items.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
                    주문 상품 정보가 없습니다.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-lg border border-slate-100 bg-slate-50/70 p-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {item.productNameSnapshot ||
                                            "상품 정보 없음"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Variant:{" "}
                                        {item.variantLabelSnapshot ||
                                            "-"}
                                    </p>
                                </div>

                                <span className="shrink-0 text-xs font-semibold text-slate-600">
                                    ×{" "}
                                    {item.quantity}
                                </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
                                <span className="text-xs text-slate-400">
                                    단가
                                </span>

                                <span className="text-sm font-semibold text-slate-800">
                                    {(
                                        item.unitPrice ??
                                        0
                                    ).toLocaleString()}
                                    원
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
