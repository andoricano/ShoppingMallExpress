"use client";

import { useEffect, useMemo } from "react";

import { useAdminPostCategories } from "@/hooks/category/useAdminPostCategories";

import { toCategoryTree } from "@/utils/postCategory";
import PostCategoryView from "@/component/post/category/PostCategoryView";
import { useAdminPostProducts } from "@/hooks/products/useAdminPostProducts";

export default function PostsPage() {
    const {
        postList,
        loading: postLoading,
        error: postError,
        fetchPosts,
    } = useAdminPostProducts();

    const {
        categoryList,
        loading: categoryLoading,
        error: categoryError,
        fetchCategories,
    } = useAdminPostCategories();

    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, [fetchPosts, fetchCategories]);

    const categoryTree = useMemo(
        () => toCategoryTree(categoryList),
        [categoryList],
    );

    const loading =
        postLoading || categoryLoading;

    const error =
        postError || categoryError;

    return (
        <div className="w-full">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    상품 게시물 관리
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    상품 게시물의 카테고리를 관리합니다.
                </p>
            </header>

            {loading && (
                <p className="text-sm text-slate-500">
                    게시물과 카테고리를 불러오는 중...
                </p>
            )}

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <PostCategoryView
                    categories={categoryTree}
                />
            )}
        </div>
    );
}