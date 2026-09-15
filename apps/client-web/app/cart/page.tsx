// app/cart/page.tsx

"use client";

import { useEffect } from "react";

import { useCart } from "@/hooks/user/useCart";

export default function CartPage() {
    const {
        cart,
        loading,
        error,
        fetchCart,
        removeCart,
    } = useCart();

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const totalPrice = cart.reduce(
        (total, item) =>
            total +
            item.product.price *
            item.quantity,
        0,
    );

    if (loading) {
        return (
            <main className="min-h-screen p-6">
                장바구니 불러오는 중...
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen p-6 text-red-600">
                {error}
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/50 px-6 py-10">
            <div className="mx-auto w-full max-w-5xl">
                <h1 className="mb-8 text-2xl font-bold text-slate-900">
                    장바구니
                </h1>

                {cart.length === 0 ? (
                    <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                        <p className="text-sm text-slate-500">
                            장바구니가 비어 있습니다.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div
                                key={
                                    item.product.id
                                }
                                className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5"
                            >
                                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                    {item.product
                                        .mainImageUrl ? (
                                        <img
                                            src={
                                                item
                                                    .product
                                                    .mainImageUrl
                                            }
                                            alt={
                                                item
                                                    .product
                                                    .name
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                            이미지 없음
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate font-semibold text-slate-900">
                                        {
                                            item
                                                .product
                                                .name
                                        }
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {item.product.price.toLocaleString(
                                            "ko-KR",
                                        )}
                                        원
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-md border border-slate-200"
                                    >
                                        -
                                    </button>

                                    <span className="w-8 text-center text-sm">
                                        {
                                            item.quantity
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-md border border-slate-200"
                                    >
                                        +
                                    </button>
                                </div>

                                <p className="w-28 text-right font-semibold text-slate-900">
                                    {(
                                        item
                                            .product
                                            .price *
                                        item.quantity
                                    ).toLocaleString(
                                        "ko-KR",
                                    )}
                                    원
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeCart(
                                            item.product.id,
                                        )
                                    }
                                    className="text-sm text-slate-400 hover:text-slate-900"
                                >
                                    삭제
                                </button>
                            </div>
                        ))}

                        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                            <span className="text-sm text-slate-500">
                                총 상품 금액
                            </span>

                            <span className="text-2xl font-bold text-slate-900">
                                {totalPrice.toLocaleString(
                                    "ko-KR",
                                )}
                                원
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}