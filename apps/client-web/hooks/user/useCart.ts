// hooks/user/useCart.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    CartEntry,
    CartItem,
} from "@mall/types";

import {
    API_ENDPOINTS,
} from "@mall/constants";

import { authProfile } from "@/lib/authClient";

import { API_BASE_URL } from "@/lib/api";

import { useCartStore } from "@/store/cartStore";

export function useCart() {
    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    const setItems =
        useCartStore(
            (state) => state.setItems,
        );

    const addItem =
        useCartStore(
            (state) => state.addItem,
        );

    const removeItem =
        useCartStore(
            (state) => state.removeItem,
        );

    // ==========================================
    // 1. Cart 조회
    // ==========================================

    const fetchCart =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const session =
                    await authProfile.getSession();

                if (
                    !session?.access_token
                ) {
                    throw new Error(
                        "로그인이 필요합니다.",
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_CART.BASE}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                        },
                    );

                const result =
                    await response
                        .json()
                        .catch(
                            () => null,
                        );

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                            "장바구니를 불러오지 못했습니다.",
                    );
                }

                const data =
                    Array.isArray(
                        result?.data,
                    )
                        ? (result.data as CartEntry[])
                            .flatMap(
                                ({ product, quantity }) =>
                                    product
                                        ? [{ product, quantity }]
                                        : [],
                            )
                        : [];

                setItems(data);

                return data;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "장바구니 조회에 실패했습니다.";

                console.error(
                    "[useCart] 조회 실패:",
                    err,
                );

                setError(message);

                return [];
            } finally {
                setLoading(false);
            }
        }, [setItems]);

    // ==========================================
    // 2. Cart 추가
    // ==========================================

    const addCart =
        useCallback(
            async (
                productId: string,
                quantity: number,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const session =
                        await authProfile.getSession();

                    if (
                        !session?.access_token
                    ) {
                        throw new Error(
                            "로그인이 필요합니다.",
                        );
                    }

                    const response =
                        await fetch(
                            `${API_BASE_URL}${API_ENDPOINTS.CLIENT_CART.BASE}`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                    Authorization:
                                        `Bearer ${session.access_token}`,
                                },
                                body:
                                    JSON.stringify({
                                        productId,
                                        quantity,
                                    }),
                            },
                        );

                    const result =
                        await response
                            .json()
                            .catch(
                                () => null,
                            );

                    if (!response.ok) {
                        throw new Error(
                            result?.message ||
                                "장바구니에 상품을 담지 못했습니다.",
                        );
                    }

                    return true;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "장바구니 등록에 실패했습니다.";

                    console.error(
                        "[useCart] 추가 실패:",
                        err,
                    );

                    setError(message);

                    return false;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    // ==========================================
    // 3. Cart 삭제
    // ==========================================

    const removeCart =
        useCallback(
            async (
                productId: string,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const session =
                        await authProfile.getSession();

                    if (
                        !session?.access_token
                    ) {
                        throw new Error(
                            "로그인이 필요합니다.",
                        );
                    }

                    const response =
                        await fetch(
                            `${API_BASE_URL}${API_ENDPOINTS.CLIENT_CART.BASE}/${productId}`,
                            {
                                method: "DELETE",
                                headers: {
                                    Authorization:
                                        `Bearer ${session.access_token}`,
                                },
                            },
                        );

                    const result =
                        await response
                            .json()
                            .catch(
                                () => null,
                            );

                    if (!response.ok) {
                        throw new Error(
                            result?.message ||
                                "장바구니 상품 삭제에 실패했습니다.",
                        );
                    }

                    removeItem(
                        productId,
                    );

                    return true;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "장바구니 상품 삭제에 실패했습니다.";

                    console.error(
                        "[useCart] 삭제 실패:",
                        err,
                    );

                    setError(message);

                    return false;
                } finally {
                    setLoading(false);
                }
            },
            [removeItem],
        );

    return {
        loading,
        error,

        fetchCart,
        addCart,
        removeCart,
    };
}
