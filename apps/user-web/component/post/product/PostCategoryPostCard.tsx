// component/post/category/PostCategoryPostCard.tsx

"use client";

import type { ProductPost } from "@mall/types";
import { ProductPostCard } from "@mall/tiptap";

interface PostCategoryPostCardProps {
    post: ProductPost;
    selected?: boolean;
    onSelect?: (post: ProductPost) => void;
}

export default function PostCategoryPostCard({
    post,
    selected = false,
    onSelect,
}: PostCategoryPostCardProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect?.(post)}
            className={[
                "w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-colors",
                selected
                    ? "border-slate-900 ring-1 ring-slate-900"
                    : "border-slate-200 hover:border-slate-300",
            ].join(" ")}
        >
            <div className="pointer-events-none">
                <ProductPostCard
                    imageUrl={post.thumbnailUrl ?? undefined}
                    title={post.title}
                    summary={post.summary ?? undefined}
                />
            </div>

            <div className="border-t border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                        {post.status === "PUBLISHED"
                            ? "게시"
                            : "비공개"}
                    </span>

                    <span
                        className={[
                            "text-xs font-semibold",
                            selected
                                ? "text-slate-900"
                                : "text-slate-400",
                        ].join(" ")}
                    >
                        {selected ? "선택됨" : "선택"}
                    </span>
                </div>
            </div>
        </button>
    );
}
