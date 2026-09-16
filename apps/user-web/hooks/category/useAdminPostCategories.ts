// hooks/category/useAdminPostCategories.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    ProductPostCategory,
} from "@mall/types";

import type {
    CategoryTree,
} from "@mall/category-tree";

import {
    API_ENDPOINTS,
} from "@mall/constants";

import {
    flattenCategoryTree,
} from "@/utils/postCategory";

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

                const result =
                    await res
                        .json()
                        .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "카테고리 목록 조회에 실패했습니다.",
                    );
                }

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
                            .catch(() => null);

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
                    setError(
                        err instanceof Error
                            ? err.message
                            : "카테고리 생성에 실패했습니다.",
                    );

                    throw err;
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
                            .catch(() => null);

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
                    setError(
                        err instanceof Error
                            ? err.message
                            : "카테고리 수정에 실패했습니다.",
                    );

                    throw err;
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
                            .catch(() => null);

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
                    setError(
                        err instanceof Error
                            ? err.message
                            : "카테고리 삭제에 실패했습니다.",
                    );

                    throw err;
                }
            },
            [],
        );

    // ==========================================
    // 5. Category 전체 저장
    //
    // CategoryTreeEditor에서 전달받은
    // 수정 Tree를 기준으로
    // CREATE / UPDATE / DELETE 처리
    // ==========================================

    const saveCategories =
        useCallback(
            async (
                tree: CategoryTree[],
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const editedCategories =
                        flattenCategoryTree(
                            tree,
                        );

                    const originalMap =
                        new Map(
                            categoryList.map(
                                (category) => [
                                    category.id,
                                    category,
                                ],
                            ),
                        );

                    // ------------------------------------------
                    // CREATE
                    // ------------------------------------------

                    const newCategories =
                        editedCategories
                            .filter(
                                (category) =>
                                    category.isNew &&
                                    !category.isDeleted,
                            )
                            .sort(
                                (a, b) =>
                                    a.depth -
                                    b.depth,
                            );

                    const newIdMap =
                        new Map<
                            string,
                            string
                        >();

                    for (const category of newCategories) {
                        const parentId =
                            category.parentId
                                ? newIdMap.get(
                                    category.parentId,
                                ) ??
                                category.parentId
                                : null;

                        const randomValue =
                            Math.floor(
                                Math.random() *
                                100000,
                            );

                        const created =
                            await createCategory(
                                {
                                    name:
                                        category.name,
                                    slug:
                                        `category-${randomValue}`,
                                    parentId,
                                    depth:
                                        category.depth,
                                    displayOrder:
                                        0,
                                    isActive:
                                        true,
                                },
                            );

                        if (!created) {
                            throw new Error(
                                "카테고리 생성에 실패했습니다.",
                            );
                        }

                        newIdMap.set(
                            category.id,
                            created.id,
                        );
                    }

                    // ------------------------------------------
                    // UPDATE
                    // ------------------------------------------

                    for (const category of editedCategories) {
                        if (
                            category.isNew ||
                            category.isDeleted
                        ) {
                            continue;
                        }

                        const original =
                            originalMap.get(
                                category.id,
                            );

                        if (!original) {
                            continue;
                        }

                        const changed =
                            original.name !==
                            category.name ||
                            original.parentId !==
                            category.parentId ||
                            original.depth !==
                            category.depth;

                        if (!changed) {
                            continue;
                        }

                        await updateCategory(
                            category.id,
                            {
                                name:
                                    category.name,
                                parentId:
                                    category.parentId,
                                depth:
                                    category.depth,
                            },
                        );
                    }

                    // ------------------------------------------
                    // DELETE
                    // ------------------------------------------

                    const deletedIds =
                        editedCategories
                            .filter(
                                (category) =>
                                    category.isDeleted &&
                                    !category.isNew,
                            )
                            .map(
                                (category) =>
                                    category.id,
                            );

                    for (const id of deletedIds) {
                        await deleteCategory(
                            id,
                        );
                    }

                    // ------------------------------------------
                    // 서버 상태 갱신
                    // ------------------------------------------

                    await fetchCategories();
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "카테고리 저장에 실패했습니다.",
                    );

                    throw err;
                } finally {
                    setLoading(false);
                }
            },
            [
                categoryList,
                createCategory,
                updateCategory,
                deleteCategory,
                fetchCategories,
            ],
        );

    return {
        categoryList,
        loading,
        error,

        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        saveCategories,
    };
}