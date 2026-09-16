"use client";

import type { CategoryTree } from "@mall/category-tree";
import { CategoryTreeView } from "@mall/category-tree";

interface PostCategoryViewProps {
    categories: CategoryTree[];

    selectedId?: string | null;

    onSelect?: (
        category: CategoryTree,
    ) => void;
}

export default function PostCategoryView({
    categories,
    selectedId = null,
    onSelect,
}: PostCategoryViewProps) {
    return (
        <div className="w-full rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    카테고리
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    게시물을 분류할 카테고리를 선택하세요.
                </p>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-2">
                <CategoryTreeView
                    nodes={categories}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            </div>
        </div>
    );
}