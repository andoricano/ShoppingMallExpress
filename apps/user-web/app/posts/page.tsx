"use client";

import { useEffect } from "react";

import { useAdminPostCategories } from "@/hooks/category/useAdminPostCategories";
import { useAdminPostProducts } from "@/hooks/products/useAdminPostProducts";
import PostCategoryEditor from "@/component/post/product/PostCategoryEditor";

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

    const loading = postLoading || categoryLoading;

    const error = postError || categoryError;

    const handleSave = async () => {
        // TODO: Category API 연결
    };

    return (
        <div className="w-full">
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
                <PostCategoryEditor
                    categories={categoryList}
                    posts={postList}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}