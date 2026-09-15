"use client";

import type { Wishlist } from "@mall/types";

import WishlistItem from "./WishlistItem";

interface WishlistBoxProps {
    items: Wishlist[];

    onItemClick?: (
        productPostId: string,
    ) => void;

    onRemove?: (
        productPostId: string,
    ) => void;
}

export default function WishlistBox({
    items,
    onItemClick,
    onRemove,
}: WishlistBoxProps) {
    return (
        <section className="w-full">
            <header className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    관심상품
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    관심상품으로 저장한 상품을
                    확인할 수 있습니다.
                </p>
            </header>

            {items.length === 0 ? (
                <div className="flex min-h-60 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    <p className="text-sm text-slate-400">
                        관심상품이 없습니다.
                    </p>
                </div>
            ) : (
                <div className="flex w-full flex-col gap-4">
                    {items.map((item) => (
                        <WishlistItem
                            key={item.id}
                            productPostId={
                                item.productPostId
                            }
                            onClick={
                                onItemClick
                            }
                            onRemove={
                                onRemove
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    );
}