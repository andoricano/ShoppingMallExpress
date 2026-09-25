"use client";

import type {
    CartItem as CartItemData,
    ProductVariantStockStatus,
} from "@mall/types";

interface CartListItemProps {
    item: CartItemData;
    disabled?: boolean;

    onIncrease?: () => void;
    onDecrease?: () => void;
    onRemove?: () => void;
}

const UNAVAILABLE_LABEL: Record<ProductVariantStockStatus, string | null> = {
    AVAILABLE: null,
    OUT_OF_STOCK: "품절",
    UNAVAILABLE: "판매 중지",
};

export default function CartListItem({
    item,
    disabled = false,
    onIncrease,
    onDecrease,
    onRemove,
}: CartListItemProps) {
    const totalPrice =
        item.price * item.quantity;

    const statusLabel =
        item.isAvailable
            ? null
            : UNAVAILABLE_LABEL[item.stockStatus] ?? "구매 불가";

    return (
        <article className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.productName}
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
                    {item.productName}
                </h2>

                {item.variantLabel && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                        {item.variantLabel}
                    </p>
                )}

                <p className="mt-1 text-sm text-slate-500">
                    {item.price.toLocaleString("ko-KR")}
                    원
                </p>

                {statusLabel && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">
                        {statusLabel}
                    </p>
                )}
            </div>

            <div className="flex items-center rounded-lg border border-slate-200">
                <button
                    type="button"
                    onClick={onDecrease}
                    disabled={disabled || item.quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                    −
                </button>

                <span className="flex h-9 w-10 items-center justify-center border-x border-slate-200 text-sm font-medium text-slate-900">
                    {item.quantity}
                </span>

                <button
                    type="button"
                    onClick={onIncrease}
                    disabled={disabled}
                    className="flex h-9 w-9 items-center justify-center text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                    +
                </button>
            </div>

            <p className="w-28 text-right text-sm font-bold text-slate-900">
                {totalPrice.toLocaleString("ko-KR")}
                원
            </p>

            <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="text-xs text-slate-400 transition-colors hover:text-slate-900 disabled:cursor-not-allowed"
            >
                삭제
            </button>
        </article>
    );
}
