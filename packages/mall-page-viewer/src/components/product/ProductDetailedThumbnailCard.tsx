"use client";

import type { ProductCardData } from "../../types/mainPage";

interface ProductDetailedThumbnailCardProps {
    product: ProductCardData;
    onClick?: (id: string) => void;
}

export function ProductDetailedThumbnailCard({
    product,
    onClick,
}: ProductDetailedThumbnailCardProps) {
    const handleClick = () => {
        onClick?.(product.id);
    };

    const hasDiscount =
        typeof product.discount === "number" &&
        product.discount > 0;

    return (
        <article
            onClick={
                onClick
                    ? handleClick
                    : undefined
            }
            className={[
                "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
                onClick
                    ? "cursor-pointer transition-shadow hover:shadow-md"
                    : "",
            ].join(" ")}
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                        대표 이미지 없음
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="truncate text-sm font-semibold text-neutral-900">
                    {product.title}
                </h3>

                {product.summary && (
                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                        {product.summary}
                    </p>
                )}

                {/* Price */}
                <div className="mt-3">
                    {hasDiscount ? (
                        <>
                            <p className="text-sm text-slate-400 line-through">
                                {product.price.toLocaleString()}
                                원
                            </p>

                            <p className="mt-0.5 text-xl font-bold text-rose-600">
                                {product.discount!.toLocaleString()}
                                원
                            </p>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-neutral-900">
                            {product.price.toLocaleString()}
                            원
                        </p>
                    )}
                </div>

                {/* Tags */}
                {product.tags &&
                    product.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {product.tags.map(
                                (tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                                    >
                                        #{tag}
                                    </span>
                                ),
                            )}
                        </div>
                    )}
            </div>
        </article>
    );
}