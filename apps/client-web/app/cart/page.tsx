// app/cart/page.tsx

"use client";

import { useEffect } from "react";
import Link from "next/link";

import CartListSection from "@/components/cart/CartListSection";
import CartProductsResult from "@/components/cart/CartProductsResult";

import {
    LOGIN_REQUIRED_MESSAGE,
    useCart,
} from "@/hooks/user/useCart";

export default function CartPage() {
    const {
        cart,
        items,
        loading,
        error,
        fetchCart,
        updateCartQuantity,
        removeCart,
    } = useCart();

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Unavailable items stay visible but are not part of the payable total.
    const totalPrice =
        items
            .filter((item) => item.isAvailable)
            .reduce(
                (total, item) =>
                    total + item.price * item.quantity,
                0,
            );

    if (!cart && loading) {
        return (
            <main className="min-h-screen p-6">
                장바구니 불러오는 중...
            </main>
        );
    }

    if (!cart && error === LOGIN_REQUIRED_MESSAGE) {
        return (
            <main className="min-h-screen p-6">
                <p className="text-sm text-slate-600">
                    장바구니는 로그인 후 이용할 수 있습니다.
                </p>
                <Link
                    href="/auth"
                    className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                    로그인
                </Link>
            </main>
        );
    }

    if (!cart && error) {
        return (
            <main className="min-h-screen p-6 text-red-600">
                {error}
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/50 px-6 py-10">
            <div className="mx-auto w-full max-w-5xl space-y-6">
                {error && (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </p>
                )}

                <CartListSection
                    items={items}
                    disabled={loading}
                    onQuantityChange={(item, quantity) => {
                        updateCartQuantity(item.id, quantity);
                    }}
                    onRemove={(item) => {
                        removeCart(item.id);
                    }}
                />

                {items.length > 0 && (
                    <>
                        {/* Order is connected in the Order migration (create_order_from_cart). */}
                        <CartProductsResult
                            totalPrice={totalPrice}
                            disabled
                        />
                        <p className="text-center text-xs text-slate-400">
                            주문 기능은 준비 중입니다.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}
