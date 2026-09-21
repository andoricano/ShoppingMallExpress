// hooks/category/usePostCategoryApi.ts

"use client";

import { useCallback } from "react";

import type {
    ProductPostCategory,
    ProductPostCategoryItem,
} from "@mall/types";

import {
    API_ENDPOINTS,
} from "@mall/constants";
import { fetchAdminApi } from "@/lib/api/admin";

interface CreateCategoryPayload {
    parentId?: string | null;
    name: string;
    slug: string;
    depth?: number;
    displayOrder?: number;
    isActive?: boolean;
}

interface UpdateCategoryPayload {
    parentId?: string | null;
    name?: string;
    slug?: string;
    depth?: number;
    displayOrder?: number;
    isActive?: boolean;
}

export function usePostCategoryApi() {
    const fetchCategories = useCallback(
        async (): Promise<ProductPostCategory[]> => {
            const res = await fetchAdminApi(
                API_ENDPOINTS.PRODUCT_POST_CATEGORIES.BASE,
            );

            const result =
                await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    "카테고리 목록 조회에 실패했습니다.",
                );
            }

            return Array.isArray(result?.data)
                ? (result.data as ProductPostCategory[])
                : [];
        },
        [],
    );

    const createCategory = useCallback(
        async (
            data: CreateCategoryPayload,
        ): Promise<ProductPostCategory> => {
            const res = await fetchAdminApi(
                API_ENDPOINTS.PRODUCT_POST_CATEGORIES.BASE,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(data),
                },
            );

            const result =
                await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    "카테고리 생성에 실패했습니다.",
                );
            }

            return result.data as ProductPostCategory;
        },
        [],
    );

    const updateCategory = useCallback(
        async (
            categoryId: string,
            data: UpdateCategoryPayload,
        ): Promise<ProductPostCategory> => {
            const res = await fetchAdminApi(
                API_ENDPOINTS.PRODUCT_POST_CATEGORIES.BY_ID(
                    categoryId,
                ),
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(data),
                },
            );

            const result =
                await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    "카테고리 수정에 실패했습니다.",
                );
            }

            return result.data as ProductPostCategory;
        },
        [],
    );

    const deleteCategory = useCallback(
        async (
            categoryId: string,
        ): Promise<ProductPostCategory> => {
            const res = await fetchAdminApi(
                API_ENDPOINTS.PRODUCT_POST_CATEGORIES.BY_ID(
                    categoryId,
                ),
                {
                    method: "DELETE",
                },
            );

            const result =
                await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    "카테고리 삭제에 실패했습니다.",
                );
            }

            return result.data as ProductPostCategory;
        },
        [],
    );

    const fetchPostsByCategory = useCallback(
        async (
            categoryId: string,
        ): Promise<ProductPostCategoryItem[]> => {
            const res = await fetchAdminApi(
                `${API_ENDPOINTS.PRODUCT_POST_CATEGORIES.BY_ID(categoryId)}/posts`,
            );

            const result =
                await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    "카테고리 게시물 조회에 실패했습니다.",
                );
            }

            return Array.isArray(result?.data)
                ? result.data
                : [];
        },
        [],
    );

    const addPostsToCategory = useCallback(
        async (
            categoryId: string,
            postIds: string[],
        ): Promise<void> => {
            const res = await fetchAdminApi(
                `${API_ENDPOINTS.PRODUCT_POST_CATEGORIES.BY_ID(categoryId)}/posts`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        postIds,
                    }),
                },
            );

            const result =
                await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    "카테고리에 게시물을 등록하는 데 실패했습니다.",
                );
            }
        },
        [],
    );

    const removePostFromCategory = useCallback(
        async (
            categoryId: string,
            postId: string,
        ): Promise<void> => {
            const res = await fetchAdminApi(
                `${API_ENDPOINTS.PRODUCT_POST_CATEGORIES.BY_ID(categoryId)}/posts/${postId}`,
                {
                    method: "DELETE",
                },
            );

            const result =
                await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    "카테고리에서 게시물 연결을 해제하는 데 실패했습니다.",
                );
            }
        },
        [],
    );

    return {
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,

        fetchPostsByCategory,
        addPostsToCategory,
        removePostFromCategory,
    };
}
