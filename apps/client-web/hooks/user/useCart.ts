// hooks/user/useCart.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type { Cart } from "@mall/types";

import { createClient } from "@/lib/supabase/client";

/** Selection of one purchasable unit; Cart identity is Product + ProductVariant. */
export interface AddCartItemInput {
    productId: string;
    productVariantId: string;
    quantity: number;
}

export const LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";

// Messages raised by the Mall v2 cart RPCs.
function toCartErrorMessage(error: unknown, fallback: string) {
    const message =
        typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "";

    if (message.includes("Authentication required")) {
        return LOGIN_REQUIRED_MESSAGE;
    }

    if (message.includes("Product or ProductVariant is not available")) {
        return "판매 중이 아닌 상품 옵션입니다.";
    }

    if (message.includes("Quantity must be greater than zero")) {
        return "수량은 1개 이상이어야 합니다.";
    }

    if (message.includes("CartItem not found")) {
        return "장바구니 상품을 찾을 수 없습니다.";
    }

    return fallback;
}

/**
 * Authenticated user's Cart through the Mall v2 cart RPCs (`get_cart`,
 * `add_cart_item`, `update_cart_item_quantity`, `remove_cart_item`). Ownership
 * comes from `auth.uid()`; there is no guest cart. Items carry only
 * consumer-safe fields (price, label, image, availability status).
 */
export function useCart() {
    const [cart, setCart] =
        useState<Cart | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // Returns the browser client only when a session exists; the RPCs would
    // otherwise reject with "Authentication required".
    const getAuthedClient = useCallback(async () => {
        const supabase = createClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        return session ? supabase : null;
    }, []);

    // ==========================================
    // 1. Cart 조회
    // ==========================================
    const fetchCart = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = await getAuthedClient();

            if (!supabase) {
                setCart(null);
                setError(LOGIN_REQUIRED_MESSAGE);

                return null;
            }

            const { data, error: rpcError } =
                await supabase.rpc("get_cart");

            if (rpcError) {
                throw rpcError;
            }

            const nextCart = data as Cart;

            setCart(nextCart);

            return nextCart;
        } catch (cause) {
            setError(
                toCartErrorMessage(cause, "장바구니를 불러오지 못했습니다."),
            );

            return null;
        } finally {
            setLoading(false);
        }
    }, [getAuthedClient]);

    // Runs one cart mutation, then reloads the server Cart.
    const mutate = useCallback(
        async (
            run: (supabase: ReturnType<typeof createClient>) => PromiseLike<{ error: unknown }>,
            fallback: string,
            refresh: boolean,
        ) => {
            setError(null);

            try {
                const supabase = await getAuthedClient();

                if (!supabase) {
                    setError(LOGIN_REQUIRED_MESSAGE);

                    return false;
                }

                const { error: rpcError } = await run(supabase);

                if (rpcError) {
                    throw rpcError;
                }

                if (refresh) {
                    await fetchCart();
                }

                return true;
            } catch (cause) {
                setError(toCartErrorMessage(cause, fallback));

                return false;
            }
        },
        [fetchCart, getAuthedClient],
    );

    // ==========================================
    // 2. Cart 추가 (같은 Variant는 수량 합산)
    // ==========================================
    const addCart = useCallback(
        (input: AddCartItemInput) =>
            mutate(
                (supabase) =>
                    supabase.rpc("add_cart_item", {
                        p_product_id: input.productId,
                        p_product_variant_id: input.productVariantId,
                        p_quantity: input.quantity,
                    }),
                "장바구니에 상품을 담지 못했습니다.",
                false,
            ),
        [mutate],
    );

    // ==========================================
    // 3. 수량 변경
    // ==========================================
    const updateCartQuantity = useCallback(
        (cartItemId: string, quantity: number) =>
            mutate(
                (supabase) =>
                    supabase.rpc("update_cart_item_quantity", {
                        p_cart_item_id: cartItemId,
                        p_quantity: quantity,
                    }),
                "수량을 변경하지 못했습니다.",
                true,
            ),
        [mutate],
    );

    // ==========================================
    // 4. Cart 삭제
    // ==========================================
    const removeCart = useCallback(
        (cartItemId: string) =>
            mutate(
                (supabase) =>
                    supabase.rpc("remove_cart_item", {
                        p_cart_item_id: cartItemId,
                    }),
                "장바구니 상품 삭제에 실패했습니다.",
                true,
            ),
        [mutate],
    );

    return {
        cart,
        items: cart?.items ?? [],

        loading,
        error,

        fetchCart,
        addCart,
        updateCartQuantity,
        removeCart,
    };
}
