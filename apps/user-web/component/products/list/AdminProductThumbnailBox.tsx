// component/products/post/list/AdminProductPostCard.tsx

"use client";

import type { ProductPost } from "@mall/types";
import { ProductPostCard } from "@mall/tiptap";

interface AdminProductPostCardProps {
    post: ProductPost;
    onEdit?: (post: ProductPost) => void;
    onDelete?: (postId: string) => void;
}

export function AdminProductPostCard({
    post,
    onEdit,
    onDelete,
}: AdminProductPostCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ProductPostCard
                imageUrl={post.thumbnail.imageUrl}
                title={post.thumbnail.title}
                summary={post.thumbnail.summary}
                discount={post.thumbnail.discount}
                price={post.thumbnail.price}
                tags={post.thumbnail.tags}
            />

            <div className="p-4 pt-0">
                {/* 게시 상태 */}
                <div className="mb-4">
                    <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${post.isPublished
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-500"
                            }`}
                    >
                        {post.isPublished ? "게시" : "비공개"}
                    </span>
                </div>

                {/* 날짜 */}
                <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    <div className="flex justify-between gap-3">
                        <span>생성</span>
                        <span className="text-right text-slate-500">
                            {new Date(
                                post.createdAt,
                            ).toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-between gap-3">
                        <span>수정</span>
                        <span className="text-right text-slate-500">
                            {new Date(
                                post.updatedAt,
                            ).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* 관리 버튼 */}
                <div className="mt-4 flex items-center gap-2">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(post)}
                            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            수정
                        </button>
                    )}

                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(post.id)}
                            className="flex-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100"
                        >
                            삭제
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}