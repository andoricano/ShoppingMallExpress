"use client";

import { useCallback, useState } from "react";
import type { ProductPost } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

interface ProductPostQuery {
    search?: string;
    isPublished?: boolean;
}

export function useAdminPostProducts() {
    const [postList, setPostList] = useState<ProductPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(
        async (params?: ProductPostQuery) => {
            setLoading(true);
            setError(null);

            try {
                const searchParams = new URLSearchParams();

                if (params?.search) {
                    searchParams.set(
                        "search",
                        params.search,
                    );
                }

                if (params?.isPublished !== undefined) {
                    searchParams.set(
                        "isPublished",
                        String(params.isPublished),
                    );
                }

                const queryString =
                    searchParams.toString();

                const url = queryString
                    ? `${API_ENDPOINTS.PRODUCT_POSTS.BASE}?${queryString}`
                    : API_ENDPOINTS.PRODUCT_POSTS.BASE;

                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error(
                        "상품 게시물 목록 조회에 실패했습니다.",
                    );
                }

                const result = await res.json();

                setPostList(result.data ?? []);
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

    const deletePost = useCallback(
        async (postId: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCT_POSTS.BY_ID(postId),
                    {
                        method: "DELETE",
                    },
                );

                if (!res.ok) {
                    const result = await res
                        .json()
                        .catch(() => null);

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
        deletePost
    };
}