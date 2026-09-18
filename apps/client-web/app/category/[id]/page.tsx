// apps/client-web/app/category/[id]/page.tsx

"use client";

import {
    use,
    useEffect,
    useState,
} from "react";

import type {
    ProductPostCategoryItem,
} from "@mall/types";

import { API_ENDPOINTS } from "@mall/constants";

import { useProductPostCategories } from "@/hooks/category/useProductPostCategories";
import { ProductPostList } from "@/components/category/ProductPostList";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const CATEGORY_NAME_MAP: Record<
    string,
    string
> = {
    women: "여성",
    men: "남성",
};

export default function CategoryPage({
    params,
}: PageProps) {
    const { id } = use(params);

    const {
        categories,
        loading: categoryLoading,
        error: categoryError,
    } = useProductPostCategories();

    const [
        posts,
        setPosts,
    ] = useState<
        ProductPostCategoryItem[]
    >([]);

    const [
        postLoading,
        setPostLoading,
    ] = useState(false);

    const [
        postError,
        setPostError,
    ] = useState<string | null>(null);

    const categoryName =
        CATEGORY_NAME_MAP[id] ?? id;

    const category =
        categories.find(
            (item) =>
                item.name === categoryName,
        );

    useEffect(() => {
        if (
            categoryLoading ||
            !category?.id
        ) {
            return;
        }

        const fetchCategoryPosts =
            async () => {
                setPostLoading(true);
                setPostError(null);

                try {
                    const url =
                        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_CATEGORY.POSTS(
                            category.id,
                        )}`;

                    const response =
                        await fetch(url);

                    const result =
                        await response
                            .json()
                            .catch(
                                () => null,
                            );

                    if (!response.ok) {
                        throw new Error(
                            result?.message ||
                            "카테고리 게시물을 불러오지 못했습니다.",
                        );
                    }

                    const data =
                        Array.isArray(
                            result?.data,
                        )
                            ? (result.data as ProductPostCategoryItem[])
                            : [];

                    setPosts(data);
                } catch (error) {
                    console.error(
                        "[CategoryPage] 게시물 조회 실패:",
                        error,
                    );

                    setPostError(
                        error instanceof Error
                            ? error.message
                            : "카테고리 게시물을 불러오지 못했습니다.",
                    );
                } finally {
                    setPostLoading(false);
                }
            };

        fetchCategoryPosts();
    }, [
        id,
        category,
        categoryLoading,
    ]);

    if (categoryLoading) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-sm text-slate-500">
                        카테고리를 불러오는 중입니다...
                    </p>
                </div>
            </main>
        );
    }

    if (categoryError) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-sm text-rose-600">
                        {categoryError}
                    </p>
                </div>
            </main>
        );
    }

    if (!category) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-sm text-slate-500">
                        카테고리를 찾을 수 없습니다.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {category.name}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {posts.length}개의 상품 게시물
                    </p>
                </div>

                {postError && (
                    <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {postError}
                    </div>
                )}

                {postLoading ? (
                    <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                        <p className="text-sm text-slate-500">
                            게시물을 불러오는 중입니다...
                        </p>
                    </div>
                ) : (
                    <ProductPostList
                        posts={posts}
                        onClick={(postId) => {
                            console.log(
                                "[CategoryPage] Product Post:",
                                postId,
                            );
                        }}
                    />
                )}
            </div>
        </main>
    );
}