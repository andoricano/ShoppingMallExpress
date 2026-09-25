"use client";

import type {
    ProductPostSummary,
} from "@mall/types";

import {
    ProductDetailedThumbnailCard,
} from "@mall/mall-page-viewer";

interface ProductPostListProps {
    posts: ProductPostSummary[];
    onClick?: (id: string) => void;
}

export function ProductPostList({
    posts,
    onClick,
}: ProductPostListProps) {
    if (posts.length === 0) {
        return (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                <p className="text-sm text-slate-500">
                    등록된 상품 게시물이 없습니다.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
                <ProductDetailedThumbnailCard
                    key={post.id}
                    product={{
                        id: post.id,
                        imageUrl:
                            post.thumbnailUrl ??
                            undefined,
                        title: post.title,
                        summary:
                            post.summary ??
                            undefined,
                    }}
                    onClick={onClick}
                />
            ))}
        </div>
    );
}