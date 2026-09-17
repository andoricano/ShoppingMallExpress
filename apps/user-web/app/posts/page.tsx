// app/posts/page.tsx

"use client";

import { useEffect, useState } from "react";

import type {
    ProductPostCategory,
} from "@mall/types";

import {
    useAdminPostProducts,
} from "@/hooks/products/useAdminPostProducts";

import {
    usePostCategoryApi,
} from "@/hooks/category/usePostCategoryApi";

import PostCategoryEditor from "@/component/post/product/PostCategoryEditor";

export default function PostsPage() {
    const {
        postList,
        loading: postLoading,
        error: postError,
        fetchPosts,
    } = useAdminPostProducts();

    const {
        fetchCategories,
        fetchPostsByCategory,
        addPostsToCategory,
        removePostFromCategory,
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
                await Promise.all([
                    fetchPosts(),
                    fetchCategories().then(
                        setCategoryList,
                    ),
                ]);
            } catch (err) {
                setCategoryError(
                    err instanceof Error
                        ? err.message
                        : "게시물과 카테고리를 불러오는 중 오류가 발생했습니다.",
                );
            } finally {
                setCategoryLoading(false);
            }
        };

        load();
    }, [
        fetchPosts,
        fetchCategories,
    ]);

    const loading =
        postLoading || categoryLoading;

    const error =
        postError || categoryError;

    const handleSave = async (
        categories: ProductPostCategory[],
    ) => {
        try {
            for (const category of categories) {
                const original =
                    categoryList.find(
                        (item) =>
                            item.id === category.id,
                    );

                if (!original) {
                    continue;
                }

                const originalPostIds =
                    new Set(
                        (
                            original.productPosts ??
                            []
                        ).map(
                            (post) => post.id,
                        ),
                    );

                const currentPostIds =
                    new Set(
                        (
                            category.productPosts ??
                            []
                        ).map(
                            (post) => post.id,
                        ),
                    );

                const addedPostIds =
                    (
                        category.productPosts ??
                        []
                    )
                        .filter(
                            (post) =>
                                !originalPostIds.has(
                                    post.id,
                                ),
                        )
                        .map(
                            (post) =>
                                post.id,
                        );

                const removedPostIds =
                    (
                        original.productPosts ??
                        []
                    )
                        .filter(
                            (post) =>
                                !currentPostIds.has(
                                    post.id,
                                ),
                        )
                        .map(
                            (post) =>
                                post.id,
                        );

                if (
                    addedPostIds.length > 0
                ) {
                    await addPostsToCategory(
                        category.id,
                        addedPostIds,
                    );
                }

                if (
                    removedPostIds.length > 0
                ) {
                    await Promise.all(
                        removedPostIds.map(
                            (postId) =>
                                removePostFromCategory(
                                    category.id,
                                    postId,
                                ),
                        ),
                    );
                }
            }

            // 저장 성공 후에는 재조회하지 않음.
            // 현재 Editor의 데이터가 이미 저장된 상태이므로
            // 로컬 기준만 최신 상태로 맞춰준다.
            setCategoryList(categories);
        } catch (err) {
            setCategoryError(
                err instanceof Error
                    ? err.message
                    : "카테고리 게시물 저장에 실패했습니다.",
            );

            throw err;
        }
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

            {!loading &&
                !error && (
                    <PostCategoryEditor
                        categories={
                            categoryList
                        }
                        posts={postList}
                        onSave={handleSave}
                    />
                )}
        </div>
    );
}