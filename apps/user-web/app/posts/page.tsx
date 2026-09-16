// app/posts/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
} from "react";


import CategoryTab from "@/component/post/category/CategoryTab";
import {
    useAdminPostCategories,
} from "@/hooks/category/useAdminPostCategories";

import type {
    ProductPostCategory,
} from "@mall/types";

import {
    CategoryTreeEditor,
} from "@mall/category-tree";

import type {
    CategoryTree,
} from "@mall/category-tree";
function toCategoryTree(
    categories: ProductPostCategory[],
): CategoryTree[] {
    const nodeMap = new Map<
        string,
        CategoryTree
    >();

    for (const category of categories) {
        nodeMap.set(category.id, {
            id: category.id,
            parentId: category.parentId,
            name: category.name,
            depth: category.depth,
            children: [],
        });
    }

    const roots: CategoryTree[] = [];

    for (const category of categories) {
        const node =
            nodeMap.get(category.id);

        if (!node) {
            continue;
        }

        if (!category.parentId) {
            roots.push(node);
            continue;
        }

        const parent =
            nodeMap.get(
                category.parentId,
            );

        if (!parent) {
            roots.push(node);
            continue;
        }

        parent.children.push(node);
    }

    return roots;
}

export default function PostsPage() {
    const {
        categoryList,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    } =
        useAdminPostCategories();

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const categoryTree =
        useMemo(
            () =>
                toCategoryTree(
                    categoryList,
                ),
            [categoryList],
        );

    const handleCreateCategory =
        useCallback(async () => {
            const randomValue =
                Math.floor(
                    Math.random() *
                    100000,
                );

            await createCategory({
                name: `카테고리 ${randomValue}`,
                slug: `category-${randomValue}`,
                depth: 1,
                displayOrder:
                    categoryList.length,
                isActive: true,
            });

            await fetchCategories();
        }, [
            categoryList.length,
            createCategory,
            fetchCategories,
        ]);

    return (
        <div className="w-full">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    상품 게시물 관리
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    상품 게시물과 카테고리를 관리합니다.
                </p>
            </header>

            {loading && (
                <p className="text-sm text-slate-500">
                    카테고리 불러오는 중...
                </p>
            )}

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <CategoryTreeEditor
                    nodes={
                        categoryTree
                    }
                />
            )}
        </div>
    );
}