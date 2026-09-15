// components/order/OrderListItem.tsx

"use client";

import type { Product } from "@mall/types";

interface OrderListItemProps {
    product: Product;
    quantity: number;

    selected?: boolean;
    onSelect?: (selected: boolean) => void;

    onQuantityChange?: (
        quantity: number,
    ) => void;

    onRemove?: () => void;
}

export function OrderListItem({
    product,
    quantity,
    selected = false,
    onSelect,
    onQuantityChange,
    onRemove,
}: OrderListItemProps) {
    const totalPrice =
        product.price * quantity;

    const handleQuantityChange = (
        value: number,
    ) => {
        const nextQuantity = Math.max(
            1,
            value,
        );

        onQuantityChange?.(nextQuantity);
    };

    return (
        <article
            className={`flex gap-4 border-b border-slate-200 py-5 last:border-b-0 ${selected
                    ? "bg-slate-50"
                    : "bg-white"
                }`}
        >
            {/* 선택 */}
            <button
                type="button"
                aria-pressed={selected}
                onClick={() =>
                    onSelect?.(!selected)
                }
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 bg-white"
            >
                {selected && (
                    <span className="h-3 w-3 rounded-sm bg-slate-900" />
                )}
            </button>

            {/* 상품 이미지 */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {product.mainImageUrl && (
                    <img
                        src={product.mainImageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>

            {/* 상품 정보 */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                            {product.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            {product.price.toLocaleString()}원
                        </p>
                    </div>

                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="shrink-0 text-xs text-slate-400 transition-colors hover:text-rose-600"
                        >
                            삭제
                        </button>
                    )}
                </div>

                {/* 수량 */}
                <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() =>
                                handleQuantityChange(
                                    quantity - 1,
                                )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-l-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50"
                        >
                            −
                        </button>

                        <div className="flex h-9 min-w-12 items-center justify-center border-y border-slate-200 text-sm font-semibold text-slate-900">
                            {quantity}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                handleQuantityChange(
                                    quantity + 1,
                                )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-r-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50"
                        >
                            +
                        </button>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {totalPrice.toLocaleString()}원
                    </p>
                </div>
            </div>
        </article>
    );
}