// app/posts/category/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";

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

            const created =
                [...changes.created].sort(
                    (a, b) => a.depth - b.depth,
                );

            for (const category of created) {
                const parentId =
                    category.parentId
                        ? createdIdMap.get(
                            category.parentId,
                        ) ??
                        category.parentId
                        : null;

                const result =
                    await createCategory({
                        parentId,
                        name: category.name,
                        slug: category.slug,
                        depth: category.depth,
                        displayOrder:
                            category.displayOrder,
                        isActive:
                            category.isActive,
                    });

                createdIdMap.set(
                    category.id,
                    result.id,
                );
            }

            for (const category of changes.updated) {
                const parentId =
                    category.parentId
                        ? createdIdMap.get(
                            category.parentId,
                        ) ??
                        category.parentId
                        : null;

                await updateCategory(
                    category.id,
                    {
                        parentId,
                        name: category.name,
                        slug: category.slug,
                        depth: category.depth,
                        displayOrder:
                            category.displayOrder,
                        isActive:
                            category.isActive,
                    },
                );
            }

            const deleted =
                [...changes.deleted].sort(
                    (a, b) => b.depth - a.depth,
                );

            for (const category of deleted) {
                await deleteCategory(category.id);
            }

            // 성공했으므로 서버 재조회하지 않음
            // 여기서 로컬 categoryList만 갱신해야 함
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "카테고리 저장에 실패했습니다.",
            );

            // 실패한 경우 서버 상태로 복구
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
        } finally {
            setSaving(false);
        }
    };

    const categoryTree =
        toCategoryTreeList(
            categoryList,
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