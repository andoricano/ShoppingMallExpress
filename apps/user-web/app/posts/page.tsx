// app/posts/page.tsx

"use client";

import {
    useEffect,
    useMemo,
} from "react";

import {
    CategoryTreeEditor,
} from "@mall/category-tree";

import {
    useAdminPostCategories,
} from "@/hooks/category/useAdminPostCategories";

import {
    toCategoryTree,
} from "@/utils/postCategory";

export default function PostsPage() {
    const {
        categoryList,
        loading,
        error,
        fetchCategories,
        saveCategories,
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
                    카테고리 처리 중...
                </p>
            )}

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <CategoryTreeEditor
                    nodes={categoryTree}
                    onSave={
                        saveCategories
                    }
                />
            )}
        </div>
    );
}