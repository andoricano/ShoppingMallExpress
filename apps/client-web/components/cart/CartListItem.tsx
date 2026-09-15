"use client";

import type { CartItem as CartItemData } from "@mall/types";

interface CartListItemProps {
    item: CartItemData;

    onIncrease?: (
        productId: string,
        quantity: number,
    ) => void;

    onDecrease?: (
        productId: string,
        quantity: number,
    ) => void;

    onRemove?: (
        productId: string,
    ) => void;
}

export default function CartListItem({
    item,
    onIncrease,
    onDecrease,
    onRemove,
}: CartListItemProps) {
    const {
        product,
        quantity,
    } = item;

    const totalPrice =
        product.price * quantity;

    return (
        <article className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {product.mainImageUrl ? (
                    <img
                        src={
                            product.mainImageUrl
                        }
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        이미지 없음
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-slate-900">
                    {product.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    {product.price.toLocaleString(
                        "ko-KR",
                    )}
                    원
                </p>
            </div>

            <div className="flex items-center rounded-lg border border-slate-200">
                <button
                    type="button"
                    onClick={() =>
                        onDecrease?.(
                            product.id,
                            quantity,
                        )
                    }
                    disabled={
                        quantity <= 1
                    }
                    className="flex h-9 w-9 items-center justify-center text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                    −
                </button>

                <span className="flex h-9 w-10 items-center justify-center border-x border-slate-200 text-sm font-medium text-slate-900">
                    {quantity}
                </span>

                <button
                    type="button"
                    onClick={() =>
                        onIncrease?.(
                            product.id,
                            quantity,
                        )
                    }
                    className="flex h-9 w-9 items-center justify-center text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                    +
                </button>
            </div>

            <p className="w-28 text-right text-sm font-bold text-slate-900">
                {totalPrice.toLocaleString(
                    "ko-KR",
                )}
                원
            </p>

            <button
                type="button"
                onClick={() =>
                    onRemove?.(
                        product.id,
                    )
                }
                className="text-xs text-slate-400 transition-colors hover:text-slate-900"
            >
                삭제
            </button>
        </article>
    );
}