// component/post/category/PostCategoryEditor.tsx

"use client";

import { useMemo } from "react";

import type {
    ProductPost,
    ProductPostCategory,
    ProductPostCategoryItem,
} from "@mall/types";
import type { CategoryTree } from "@mall/category-tree";

import { CategoryTreeView } from "@mall/category-tree";

import { usePostCategoryEditor } from "@/hooks/category/usePostCategoryEditor";

import CategoryEditorPostList from "./CategoryEditorPostList";
import PostCategoryEditorToolbar from "./PostCategoryEditorToolbar";
import { toCategoryTreeList } from "@/utils/postCategory";

interface PostCategoryEditorProps {
    categories: ProductPostCategory[];

    posts: ProductPost[];

    onCategorySelect: (
        categoryId: string,
    ) => void | Promise<void>;

    onSave: (
        categories: ProductPostCategory[],
    ) => void | Promise<void>;
}

export default function PostCategoryEditor({
    categories,
    posts,
    onCategorySelect,
    onSave,
}: PostCategoryEditorProps) {
    const {
        draftCategories,
        selectedCategoryId,
        selectedPostIds,
        isDirty,

        selectCategory,
        togglePostInCategory,
    } = usePostCategoryEditor(categories);

    const categoryTree = useMemo<CategoryTree[]>(
        () => toCategoryTreeList(draftCategories),
        [draftCategories],
    );

    const handleSelectCategory = async (
        categoryId: string,
    ) => {
        selectCategory(categoryId);
        await onCategorySelect(categoryId);
    };

    const handleSelectPost = (
        post: ProductPost,
    ) => {
        if (!selectedCategoryId) {
            return;
        }

        const categoryPost: ProductPostCategoryItem = {
            id: post.id,
            thumbnail: post.thumbnail,
        };

        togglePostInCategory(
            selectedCategoryId,
            categoryPost,
        );
    };

    const handleSave = async () => {
        await onSave(draftCategories);
    };

    return (
        <div className="space-y-4">
            <PostCategoryEditorToolbar
                hasChanges={isDirty}
                onSave={handleSave}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                {/* 카테고리 */}
                <div className="w-full rounded-lg border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">
                            카테고리
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            게시물을 등록할 카테고리를 선택하세요.
                        </p>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto p-2">
                        <CategoryTreeView
                            nodes={categoryTree}
                            selectedId={selectedCategoryId}
                            onSelect={(category) =>
                                handleSelectCategory(
                                    category.id,
                                )
                            }
                        />
                    </div>
                </div>

                {/* 게시물 */}
                <CategoryEditorPostList
                    posts={posts}
                    selectedIds={selectedPostIds}
                    onSelect={handleSelectPost}
                />
            </div>
        </div>
    );
}