// app/cart/page.tsx

"use client";

import {
    useEffect,
    useState,
} from "react";

import CartListSection from "@/components/cart/CartListSection";
import CartProductsResult from "@/components/cart/CartProductsResult";

import { useCart } from "@/hooks/user/useCart";

import type { CartItem } from "@mall/types";

export default function CartPage() {
    const {
        cart,
        loading,
        error,
        fetchCart,
    } = useCart();

    const [
        editedCart,
        setEditedCart,
    ] = useState<CartItem[]>([]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    useEffect(() => {
        setEditedCart(cart);
    }, [cart]);

    const totalPrice =
        editedCart.reduce(
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
            <div className="mx-auto w-full max-w-5xl space-y-6">
                <CartListSection
                    items={cart}
                    onChange={
                        setEditedCart
                    }
                />

                {editedCart.length > 0 && (
                    <CartProductsResult
                        totalPrice={
                            totalPrice
                        }
                    />
                )}
            </div>
        </main>
    );
}