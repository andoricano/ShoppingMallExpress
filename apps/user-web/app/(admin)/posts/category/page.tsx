// app/posts/category/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { CategoryTree } from "@mall/category-tree";

import { CategoryTreeEditor } from "@mall/category-tree";

import {
    usePostCategoryApi,
} from "@/hooks/category/usePostCategoryApi";

import {
    diffProductPostCategories,
    toCategoryTreeList,
    toProductPostCategoryList,
} from "@/utils/postCategory";
import { ProductPostCategory } from "@mall/types";


export default function CategoryPage() {
    const {
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    } = usePostCategoryApi();

    const [
        categoryList,
        setCategoryList,
    ] = useState<ProductPostCategory[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const [
        editorKey,
        setEditorKey,
    ] = useState(0);

    const loadCategories =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const categories =
                    await fetchCategories();

                setCategoryList(categories);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "카테고리 조회에 실패했습니다.",
                );
            } finally {
                setLoading(false);
            }
        }, [fetchCategories]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);


    const handleSave = async (
        tree: CategoryTree[],
    ) => {
        setSaving(true);
        setError(null);

        try {
            const currentCategories =
                toProductPostCategoryList(
                    tree,
                    categoryList,
                );

            const changes =
                diffProductPostCategories(
                    categoryList,
                    currentCategories,
                );

            const createdIdMap =
                new Map<string, string>();

            const createdResultMap =
                new Map<string, ProductPostCategory>();

            const updatedResultMap =
                new Map<string, ProductPostCategory>();

            // ------------------------------------------
            // CREATE
            // ------------------------------------------

            const created = changes.created;

            for (const category of created) {
                const result =
                    await createCategory({
                        name: category.name,
                        slug: category.slug ?? undefined,
                        displayOrder:
                            category.displayOrder,
                        isActive:
                            category.isActive,
                    });

                createdIdMap.set(
                    category.id,
                    result.id,
                );

                createdResultMap.set(
                    category.id,
                    result,
                );
            }

            // ------------------------------------------
            // UPDATE
            // ------------------------------------------

            for (const category of changes.updated) {
                const result =
                    await updateCategory(
                        category.id,
                        {
                            name: category.name,
                            slug: category.slug ?? undefined,
                            displayOrder:
                                category.displayOrder,
                            isActive:
                                category.isActive,
                        },
                    );

                updatedResultMap.set(
                    category.id,
                    result,
                );
            }

            // ------------------------------------------
            // DELETE
            // ------------------------------------------

            const deleted = changes.deleted;

            const deletedIds = new Set(
                changes.deleted.map(
                    (category) => category.id,
                ),
            );

            for (const category of deleted) {
                await deleteCategory(
                    category.id,
                );
            }

            // ------------------------------------------
            // 성공한 서버 상태를 로컬에 반영
            // ------------------------------------------

            const originalMap =
                new Map(
                    categoryList.map(
                        (category) => [
                            category.id,
                            category,
                        ],
                    ),
                );

            const savedCategories =
                currentCategories
                    .filter(
                        (category) =>
                            !deletedIds.has(
                                category.id,
                            ),
                    )
                    .map((category) => {
                        // 새 Category
                        const created =
                            createdResultMap.get(
                                category.id,
                            );

                        if (created) {
                            return created;
                        }

                        // 수정된 Category
                        const updated =
                            updatedResultMap.get(
                                category.id,
                            );

                        if (updated) {
                            return updated;
                        }

                        // 변경되지 않은 기존 Category
                        return (
                            originalMap.get(
                                category.id,
                            ) ?? category
                        );
                    });

            setCategoryList(
                savedCategories,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "카테고리 저장에 실패했습니다.",
            );

            // 실패한 경우에만 서버 상태 복구
            try {
                const categories =
                    await fetchCategories();

                setCategoryList(categories);
            } catch (reloadError) {
                setError(
                    reloadError instanceof Error
                        ? reloadError.message
                        : "카테고리 상태 복구에 실패했습니다.",
                );
            }

            throw err;
        } finally {
            setSaving(false);
        }
    };


    

    const categoryTree = useMemo(
        () => toCategoryTreeList(categoryList),
        [categoryList],
    );

    return (
        <div className="w-full">
            {loading && (
                <p className="text-sm text-slate-500">
                    카테고리 처리 중...
                </p>
            )}

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {!loading &&
                !error && (
                    <CategoryTreeEditor
                        key={editorKey}
                        nodes={categoryTree}
                        onSave={handleSave}
                    />
                )}

            {saving && (
                <p className="mt-3 text-sm text-slate-500">
                    카테고리를 저장하는 중...
                </p>
            )}
        </div>
    );
}
