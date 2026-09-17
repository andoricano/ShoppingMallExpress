// component/post/category/PostList.tsx

"use client";

import type { ProductPost } from "@mall/types";
import PostCategoryPostCard from "./PostCategoryPostCard";

interface CategoryEditorPostListProps {
    posts: ProductPost[];
    selectedIds?: string[];
    onSelect?: (post: ProductPost) => void;
}

export default function CategoryEditorPostList({
    posts,
    selectedIds = [],
    onSelect,
}: CategoryEditorPostListProps) {
    return (
        <div className="w-full rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    게시물
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    카테고리에 등록할 게시물을 선택하세요.
                </p>
            </div>

            <div className="p-4">
                {posts.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">
                        게시물이 없습니다.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {posts.map((post) => (
                            <PostCategoryPostCard
                                key={post.id}
                                post={post}
                                selected={selectedIds.includes(
                                    post.id,
                                )}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}