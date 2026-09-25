"use client";

import type { WishlistItemView } from "@/store/wishlistStore";

interface WishlistItemProps {
    item: WishlistItemView;

    onClick?: (
        productPostId: string,
    ) => void;

    onRemove?: (
        productPostId: string,
    ) => void;
}

/** ProductPost summary of a wishlist entry (null once unpublished). */
export default function WishlistItem({
    item,
    onClick,
    onRemove,
}: WishlistItemProps) {
    const post = item.productPost;

    return (
        <article
            onClick={() => {
                if (post) {
                    onClick?.(item.productPostId);
                }
            }}
            className={[
                "flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors",
                post ? "cursor-pointer hover:bg-slate-50" : "opacity-60",
            ].join(" ")}
        >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {post?.thumbnailUrl && (
                    <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                    {post?.title ?? "더 이상 판매하지 않는 게시물"}
                </p>

                {post?.summary && (
                    <p className="mt-1 truncate text-sm text-slate-500">
                        {post.summary}
                    </p>
                )}
            </div>

            {onRemove && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();

                        onRemove(item.productPostId);
                    }}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                    삭제
                </button>
            )}
        </article>
    );
}
