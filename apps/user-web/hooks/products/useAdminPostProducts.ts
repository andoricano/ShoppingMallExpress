"use client";

import { useCallback, useState } from "react";
import type { ProductPost } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";
import { fetchAdminApi } from "@/lib/api/admin";

interface ProductPostQuery {
    search?: string;
    isPublished?: boolean;
}

export function useAdminPostProducts() {
    const [
        postList,
        setPostList,
    ] = useState<ProductPost[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    // ==========================================
    // 전체 Product Post 조회
    // ==========================================

    const fetchPosts = useCallback(
        async (
            params?: ProductPostQuery,
        ) => {
            setLoading(true);
            setError(null);

            try {
                const searchParams =
                    new URLSearchParams();

                if (params?.search) {
                    searchParams.set(
                        "search",
                        params.search,
                    );
                }

                if (
                    params?.isPublished !==
                    undefined
                ) {
                    searchParams.set(
                        "isPublished",
                        String(
                            params.isPublished,
                        ),
                    );
                }

                const queryString =
                    searchParams.toString();

                const url = queryString
                    ? `${API_ENDPOINTS.PRODUCT_POSTS.BASE}?${queryString}`
                    : API_ENDPOINTS.PRODUCT_POSTS.BASE;

                const res =
                    await fetchAdminApi(url);

                const result =
                    await res
                        .json()
                        .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                            "상품 게시물 목록 조회에 실패했습니다.",
                    );
                }

                setPostList(
                    Array.isArray(
                        result?.data,
                    )
                        ? result.data
                        : [],
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "상품 게시물 목록 조회에 실패했습니다.",
                );
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // Category 기준 Product Post 조회
    // ==========================================

    const fetchCategoryPosts =
        useCallback(
            async (
                categoryId: string,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const res =
                        await fetchAdminApi(
                            API_ENDPOINTS.PRODUCT_POSTS.BY_CATEGORY(
                                categoryId,
                            ),
                        );

                    const result =
                        await res
                            .json()
                            .catch(
                                () => null,
                            );

                    if (!res.ok) {
                        throw new Error(
                            result?.message ||
                                "카테고리 상품 게시물 목록 조회에 실패했습니다.",
                        );
                    }

                    setPostList(
                        Array.isArray(
                            result?.data,
                        )
                            ? result.data
                            : [],
                    );
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "카테고리 상품 게시물 목록 조회에 실패했습니다.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    // ==========================================
    // Product Post 삭제
    // ==========================================

    const deletePost =
        useCallback(
            async (
                postId: string,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const res =
                        await fetchAdminApi(
                            API_ENDPOINTS.PRODUCT_POSTS.BY_ID(
                                postId,
                            ),
                            {
                                method: "DELETE",
                            },
                        );

                    if (!res.ok) {
                        const result =
                            await res
                                .json()
                                .catch(
                                    () => null,
                                );

                        throw new Error(
                            result?.message ||
                                "상품 게시물 삭제에 실패했습니다.",
                        );
                    }
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "상품 게시물 삭제에 실패했습니다.",
                    );

                    throw err;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    return {
        postList,
        loading,
        error,

        fetchPosts,
        fetchCategoryPosts,
        deletePost,
    };
}
