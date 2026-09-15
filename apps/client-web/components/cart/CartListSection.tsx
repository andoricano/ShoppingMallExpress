"use client";

import type { CartItem } from "@mall/types";

import { useCartEditor } from "@/hooks/user/useCartEditor";

import CartListItem from "./CartListItem";

interface CartListSectionProps {
    items: CartItem[];

    onChange?: (
        items: CartItem[],
    ) => void;
}

export default function CartListSection({
    items: initialItems,
    onChange,
}: CartListSectionProps) {
    const {
        items,
        increase,
        decrease,
        remove,
    } = useCartEditor(
        initialItems,
    );

    const totalPrice =
        items.reduce(
            (total, item) =>
                total +
                item.product.price *
                item.quantity,
            0,
        );

    const handleIncrease = (
        productId: string,
    ) => {
        increase(productId);

        onChange?.(
            items.map((item) =>
                item.product.id ===
                    productId
                    ? {
                        ...item,
                        quantity:
                            item.quantity +
                            1,
                    }
                    : item,
            ),
        );
    };

    const handleDecrease = (
        productId: string,
    ) => {
        decrease(productId);

        onChange?.(
            items.map((item) =>
                item.product.id ===
                    productId
                    ? {
                        ...item,
                        quantity:
                            Math.max(
                                1,
                                item.quantity -
                                1,
                            ),
                    }
                    : item,
            ),
        );
    };

    const handleRemove = (
        productId: string,
    ) => {
        remove(productId);

        onChange?.(
            items.filter(
                (item) =>
                    item.product.id !==
                    productId,
            ),
        );
    };

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
                            key={item.product.id}
                            item={item}
                            onIncrease={() =>
                                handleIncrease(
                                    item.product.id,
                                )
                            }
                            onDecrease={() =>
                                handleDecrease(
                                    item.product.id,
                                )
                            }
                            onRemove={() =>
                                handleRemove(
                                    item.product.id,
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    );
}