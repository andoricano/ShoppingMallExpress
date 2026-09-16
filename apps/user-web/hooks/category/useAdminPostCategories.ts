// hooks/category/useAdminPostCategories.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    ProductPostCategory,
} from "@mall/types";

import {
    API_ENDPOINTS,
} from "@mall/constants";

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

export function useAdminPostCategories() {
    const [
        categoryList,
        setCategoryList,
    ] = useState<ProductPostCategory[]>(
        [],
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
    // 1. Category 조회
    // ==========================================

    const fetchCategories =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const res =
                    await fetch(
                        API_ENDPOINTS
                            .PRODUCT_POST_CATEGORIES
                            .BASE,
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
                            "카테고리 목록 조회에 실패했습니다.",
                    );
                }

                const result =
                    await res.json();

                const categories =
                    Array.isArray(
                        result?.data,
                    )
                        ? (result.data as ProductPostCategory[])
                        : [];

                setCategoryList(
                    categories,
                );

                return categories;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "카테고리 목록 조회에 실패했습니다.";

                setError(message);

                return [];
            } finally {
                setLoading(false);
            }
        }, []);

    // ==========================================
    // 2. Category 생성
    // ==========================================

    const createCategory =
        useCallback(
            async (
                data: CreateCategoryPayload,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const res =
                        await fetch(
                            API_ENDPOINTS
                                .PRODUCT_POST_CATEGORIES
                                .BASE,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body:
                                    JSON.stringify(
                                        data,
                                    ),
                            },
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
                                "카테고리 생성에 실패했습니다.",
                        );
                    }

                    return (
                        result?.data as
                            | ProductPostCategory
                            | undefined
                    ) ?? null;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "카테고리 생성에 실패했습니다.";

                    setError(message);

                    throw err;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    // ==========================================
    // 3. Category 수정
    // ==========================================

    const updateCategory =
        useCallback(
            async (
                categoryId: string,
                data: UpdateCategoryPayload,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const res =
                        await fetch(
                            API_ENDPOINTS
                                .PRODUCT_POST_CATEGORIES
                                .BY_ID(
                                    categoryId,
                                ),
                            {
                                method: "PATCH",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body:
                                    JSON.stringify(
                                        data,
                                    ),
                            },
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
                                "카테고리 수정에 실패했습니다.",
                        );
                    }

                    return (
                        result?.data as
                            | ProductPostCategory
                            | undefined
                    ) ?? null;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "카테고리 수정에 실패했습니다.";

                    setError(message);

                    throw err;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    // ==========================================
    // 4. Category 삭제
    // ==========================================

    const deleteCategory =
        useCallback(
            async (
                categoryId: string,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const res =
                        await fetch(
                            API_ENDPOINTS
                                .PRODUCT_POST_CATEGORIES
                                .BY_ID(
                                    categoryId,
                                ),
                            {
                                method: "DELETE",
                            },
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
                                "카테고리 삭제에 실패했습니다.",
                        );
                    }

                    return (
                        result?.data as
                            | ProductPostCategory
                            | undefined
                    ) ?? null;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "카테고리 삭제에 실패했습니다.";

                    setError(message);

                    throw err;
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    return {
        categoryList,

        loading,
        error,

        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    };
}