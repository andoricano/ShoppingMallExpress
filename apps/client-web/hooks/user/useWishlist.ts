// hooks/wishlist/useWishlist.ts

"use client";

import {
    useCallback,
    useState,
} from "react";


import {
    API_ENDPOINTS,
} from "@mall/constants";

import { authProfile } from "@/lib/authClient";
import { WishlistItem } from "@mall/types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

export function useWishlist() {
    const [
        wishlist,
        setWishlist,
    ] = useState<WishlistItem[]>([]);

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
                        ? (result.data as WishlistItem[])
                        : [];

                setWishlist(data);

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
                setWishlist([]);

                return [];
            } finally {
                setLoading(false);
            }
        }, []);

    // ==========================================
    // 2. Wishlist 추가
    // ==========================================

    const addWishlist =
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
                                        productId,
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
                        | WishlistItem
                        | undefined;

                    if (item) {
                        setWishlist(
                            (current) => [
                                item,
                                ...current,
                            ],
                        );
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

                    setError(
                        message,
                    );

                    return null;
                } finally {
                    setLoading(
                        false,
                    );
                }
            },
            [],
        );

    // ==========================================
    // 3. Wishlist 삭제
    // ==========================================

    const removeWishlist =
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
                            `${API_BASE_URL}${API_ENDPOINTS.CLIENT_WISHLIST.BASE}/${productId}`,
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

                    setWishlist(
                        (current) =>
                            current.filter(
                                (
                                    item,
                                ) =>
                                    item.productId !==
                                    productId,
                            ),
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

                    setError(
                        message,
                    );

                    return false;
                } finally {
                    setLoading(
                        false,
                    );
                }
            },
            [],
        );

    // ==========================================
    // 4. Wishlist 여부
    // ==========================================

    const isWishlisted =
        useCallback(
            (
                productId: string,
            ) =>
                wishlist.some(
                    (item) =>
                        item.productId ===
                        productId,
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