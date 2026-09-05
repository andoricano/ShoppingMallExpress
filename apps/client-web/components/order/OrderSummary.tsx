// components/order/OrderSummary.tsx

"use client";

import type { Product } from "@mall/types";

interface OrderSummaryItem {
    product: Product;
    quantity: number;
}

interface OrderSummaryProps {
    items: OrderSummaryItem[];
}

export function OrderSummary({
    items,
}: OrderSummaryProps) {
    const totalPrice = items.reduce(
        (sum, item) =>
            sum +
            item.product.price * item.quantity,
        0,
    );

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
                주문 요약
            </h2>

            <div className="mt-5 space-y-4">
                {items.map(({ product, quantity }) => (
                    <div
                        key={product.id}
                        className="flex items-center justify-between gap-4"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                                {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {product.price.toLocaleString()}원 ×{" "}
                                {quantity}
                            </p>
                        </div>

                        <p className="shrink-0 text-sm font-semibold text-slate-900">
                            {(
                                product.price *
                                quantity
                            ).toLocaleString()}
                            원
                        </p>
                    </div>
                ))}
            </div>

            <div className="my-5 h-px bg-slate-200" />

            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    총 상품 금액
                </span>

                <span className="text-xl font-bold text-slate-900">
                    {totalPrice.toLocaleString()}원
                </span>
            </div>
        </section>
    );
}