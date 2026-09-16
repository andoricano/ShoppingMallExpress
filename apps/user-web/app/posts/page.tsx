// app/posts/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import CategoryTab from "@/component/post/category/CategoryTab";
import { useAdminPostCategories } from "@/hooks/category/useAdminPostCategories";

import type { ProductPostCategory } from "@mall/types";

export default function PostsPage() {
    const {
        categoryList,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useAdminPostCategories();

    const [
        editedCategories,
        setEditedCategories,
    ] = useState<ProductPostCategory[]>(
        [],
    );

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        setEditedCategories(
            categoryList,
        );
    }, [categoryList]);

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

            {!loading && (
                <CategoryTab
                    categories={
                        categoryList
                    }
                    onChange={
                        setEditedCategories
                    }
                    onCreate={
                        handleCreateCategory
                    }
                />
            )}
        </div>
    );
}