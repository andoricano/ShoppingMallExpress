"use client";

import { Heart } from "lucide-react";

import type { ProductCardData } from "../../types/mainPage";

interface ProductCardProps {
    product: ProductCardData;
    cardType: "NO_DISCOUNT" | "DISCOUNT";

    onClick?: (id: string) => void;

    isWishlisted?: boolean;
    onWishlistClick?: () => void;
}

export function ProductCard({
    product,
    cardType,
    onClick,
    isWishlisted = false,
    onWishlistClick,
}: ProductCardProps) {
    const handleClick = () => {
        onClick?.(product.id);
    };

    const handleWishlistClick = (
        event: React.MouseEvent<
            HTMLButtonElement
        >,
    ) => {
        event.stopPropagation();
        onWishlistClick?.();
    };

    const hasPrice =
        typeof product.price === "number";

    const hasDiscount =
        hasPrice &&
        cardType === "DISCOUNT" &&
        typeof product.discount ===
        "number" &&
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

                {onWishlistClick && (
                    <button
                        type="button"
                        onClick={
                            handleWishlistClick
                        }
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-105"
                        aria-label="관심상품"
                    >
                        <Heart
                            className={[
                                "h-5 w-5 transition-colors",
                                isWishlisted
                                    ? "fill-rose-500 text-rose-500"
                                    : "text-slate-400",
                            ].join(" ")}
                            strokeWidth={2}
                        />
                    </button>
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
                {hasPrice && (
                    <div className="mt-3">
                        {hasDiscount ? (
                            <>
                                <p className="text-sm text-slate-400 line-through">
                                    {product.price!.toLocaleString()}
                                    원
                                </p>

                                <p className="mt-0.5 text-xl font-bold text-rose-600">
                                    {product.discount!.toLocaleString()}
                                    원
                                </p>
                            </>
                        ) : (
                            <p className="text-xl font-bold text-neutral-900">
                                {product.price!.toLocaleString()}
                                원
                            </p>
                        )}
                    </div>
                )}

                {/* Tags */}
                {product.tags &&
                    product.tags.length >
                    0 && (
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