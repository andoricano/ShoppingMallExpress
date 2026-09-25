"use client";

import type { CartItem } from "@mall/types";

import CartListItem from "./CartListItem";

interface CartListSectionProps {
    items: CartItem[];
    disabled?: boolean;

    onQuantityChange?: (
        item: CartItem,
        quantity: number,
    ) => void;

    onRemove?: (item: CartItem) => void;
}

/** Server-backed cart list; every change is applied through the cart RPCs. */
export default function CartListSection({
    items,
    disabled = false,
    onQuantityChange,
    onRemove,
}: CartListSectionProps) {
    return (
        <section className="w-full">
            <header className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    장바구니
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    담아둔 상품을 확인할 수
                    있습니다.
                </p>
            </header>

            {items.length === 0 ? (
                <div className="flex min-h-60 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    <p className="text-sm text-slate-400">
                        장바구니가 비어 있습니다.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <CartListItem
                            key={item.id}
                            item={item}
                            disabled={disabled}
                            onIncrease={() =>
                                onQuantityChange?.(item, item.quantity + 1)
                            }
                            onDecrease={() =>
                                onQuantityChange?.(item, item.quantity - 1)
                            }
                            onRemove={() => onRemove?.(item)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
