"use client";

import { useEffect } from "react";

import { useProductPost } from "@/hooks/useProductPost";
import { ProductPostList } from "@/components/category/ProductPostList";

export default function ProductsPage() {
    const {
        postList,
        loading,
        error,
        fetchPosts,
    } = useProductPost();

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-sm text-slate-500">
                        상품 게시물을 불러오는 중입니다...
                    </p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-sm text-rose-600">
                        {error}
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
                        상품
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        상품 게시물을 확인해보세요.
                    </p>
                </div>

                <ProductPostList
                    posts={postList}
                    onClick={(postId) => {
                        window.location.href =
                            `/products/${postId}`;
                    }}
                />
            </div>
        </main>
    );
}