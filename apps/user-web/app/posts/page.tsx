// app/posts/page.tsx

"use client";

import { useEffect, useState } from "react";


import { useAdminPostProducts } from "@/hooks/products/useAdminPostProducts";
import { usePostCategoryApi } from "@/hooks/category/usePostCategoryApi";

import PostCategoryEditor from "@/component/post/product/PostCategoryEditor";
import { ProductPostCategory } from "@mall/types";

export default function PostsPage() {
    const {
        postList,
        loading: postLoading,
        error: postError,
        fetchPosts,
    } = useAdminPostProducts();

    const {
        fetchCategories,
        updateCategory,
    } = usePostCategoryApi();

    const [
        categoryList,
        setCategoryList,
    ] = useState<ProductPostCategory[]>([]);

    const [
        categoryLoading,
        setCategoryLoading,
    ] = useState(true);

    const [
        categoryError,
        setCategoryError,
    ] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setCategoryLoading(true);
            setCategoryError(null);

            try {
                await fetchPosts();

                const categories =
                    await fetchCategories();

                setCategoryList(categories);
            } catch (err) {
                setCategoryError(
                    err instanceof Error
                        ? err.message
                        : "카테고리 조회에 실패했습니다.",
                );
            } finally {
                setCategoryLoading(false);
            }
        };

        load();
    }, [fetchPosts, fetchCategories]);

    const loading =
        postLoading || categoryLoading;

    const error =
        postError || categoryError;

    const handleSave = async (
        categories: ProductPostCategory[],
    ) => {
        // Category 자체에 대해서는 U만 사용
        //
        // TODO:
        // categoryList와 categories를 비교해서
        // 변경된 Category만 updateCategory() 호출
        //
        // 다만 현재 PostCategoryEditor에서 변경하는
        // 핵심 데이터는 productPosts 관계이므로
        // 별도의 Post-Category 관계 API가 필요함.
        console.log(categories);
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