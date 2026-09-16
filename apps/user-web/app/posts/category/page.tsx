// app/posts/category/page.tsx

"use client";

import CategoryTab from "@/component/post/category/CategoryTab";
import { useAdminPostCategories } from "@/hooks/category/useAdminPostCategories";
import { useEffect } from "react";


export default function CategoryPage() {
    const {
        categoryList,
        loading,
        error,
        fetchCategories,
    } = useAdminPostCategories();

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return (
        <main className="min-h-screen bg-slate-50/50 px-6 py-10">
            <div className="mx-auto w-full max-w-5xl">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        상품 게시물 관리
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        상품 게시물과 카테고리를
                        관리합니다.
                    </p>
                </header>

                {loading ? (
                    <p className="text-sm text-slate-500">
                        카테고리 불러오는 중...
                    </p>
                ) : error ? (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                ) : (
                    <CategoryTab
                        categories={
                            categoryList
                        }
                    />
                )}
            </div>
        </main>
    );
}