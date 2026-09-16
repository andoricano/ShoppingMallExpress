// hooks/wishlist/useWishlist.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import {
    API_ENDPOINTS,
} from "@mall/constants";

import type { Wishlist } from "@mall/types";

import { authProfile } from "@/lib/authClient";
import { useWishlistStore } from "@/store/wishlistStore";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

export function useWishlist() {
    const wishlist =
        useWishlistStore(
            (state) => state.items,
        );

    const setItems =
        useWishlistStore(
            (state) => state.setItems,
        );

    const addItem =
        useWishlistStore(
            (state) => state.addItem,
        );

    const removeItem =
        useWishlistStore(
            (state) => state.removeItem,
        );

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

    // ==========================================
    // 1. Wishlist 조회
    // ==========================================

    const fetchWishlist =
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
                        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_WISHLIST.BASE}`,
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
                            "관심상품을 불러오지 못했습니다.",
                    );
                }

                const data =
                    Array.isArray(
                        result?.data,
                    )
                        ? (result.data as Wishlist[])
                        : [];

                setItems(data);

                return data;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "관심상품 조회에 실패했습니다.";

                console.error(
                    "[useWishlist] 조회 실패:",
                    err,
                );

                setError(message);

                return [];
            } finally {
                setLoading(false);
            }
        }, [setItems]);

    // ==========================================
    // 2. Wishlist 추가
    // ==========================================

    const addWishlist =
        useCallback(
            async (
                productPostId: string,
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
                            `${API_BASE_URL}${API_ENDPOINTS.CLIENT_WISHLIST.BASE}`,
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
                                        productPostId,
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
                                "관심상품 등록에 실패했습니다.",
                        );
                    }

                    const item =
                        result?.data as
                            | Wishlist
                            | undefined;

                    if (item) {
                        addItem(item);
                    }

                    return item ?? null;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "관심상품 등록에 실패했습니다.";

                    console.error(
                        "[useWishlist] 추가 실패:",
                        err,
                    );

                    setError(message);

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            [addItem],
        );

    // ==========================================
    // 3. Wishlist 삭제
    // ==========================================

    const removeWishlist =
        useCallback(
            async (
                productPostId: string,
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
                            `${API_BASE_URL}${API_ENDPOINTS.CLIENT_WISHLIST.BASE}/${productPostId}`,
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
                                "관심상품 삭제에 실패했습니다.",
                        );
                    }

                    removeItem(
                        productPostId,
                    );

                    return true;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "관심상품 삭제에 실패했습니다.";

                    console.error(
                        "[useWishlist] 삭제 실패:",
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

    // ==========================================
    // 4. Wishlist 여부
    // ==========================================

    const isWishlisted =
        useCallback(
            (
                productPostId: string,
            ) =>
                wishlist.some(
                    (item) =>
                        item.productPostId ===
                        productPostId,
                ),
            [wishlist],
        );

    return {
        wishlist,

        loading,
        error,

        fetchWishlist,
        addWishlist,
        removeWishlist,
        isWishlisted,
    };
}