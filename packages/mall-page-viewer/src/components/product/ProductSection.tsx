"use client";

import type {
    ProductCardData,
    ProductSectionConfig,
} from "../../types/mainPage";

import { ProductCard } from "./ProductCard";
import { ProductDetailedThumbnailCard } from "./ProductDetailedThumbnailCard";

interface ProductSectionProps {
    section: ProductSectionConfig;

    onNavigate?: (
        path: string,
    ) => void;

    isWishlisted?: (
        productPostId: string,
    ) => boolean;

    onWishlistClick?: (
        productPostId: string,
    ) => void;
}

export default function ProductSection({
    section,
    onNavigate,
    isWishlisted,
    onWishlistClick,
}: ProductSectionProps) {
    const products: ProductCardData[] =
        Array.isArray(section.products)
            ? section.products
            : [];

    if (!section.isActive) {
        return null;
    }

    if (products.length === 0) {
        return (
            <section className="py-20 text-center text-neutral-500">
                등록된 상품이 없습니다.
            </section>
        );
    }

    const renderProductCard = (
        product: ProductCardData,
    ) => {
        if (
            section.cardType === "DETAILED"
        ) {
            return (
                <ProductDetailedThumbnailCard
                    key={product.id}
                    product={product}
                    onClick={() =>
                        onNavigate?.(
                            `/products/${product.id}`,
                        )
                    }
                />
            );
        }

        return (
            <ProductCard
                key={product.id}
                product={product}
                cardType={section.cardType}
                onClick={() =>
                    onNavigate?.(
                        `/products/${product.id}`,
                    )
                }
                isWishlisted={
                    isWishlisted?.(
                        product.id,
                    )
                }
                onWishlistClick={
                    onWishlistClick
                        ? () =>
                            onWishlistClick(
                                product.id,
                            )
                        : undefined
                }
            />
        );
    };

    return (
        <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex items-end justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                        {section.title}
                    </h2>

                    <button
                        type="button"
                        onClick={() =>
                            onNavigate?.(
                                "/products",
                            )
                        }
                        className="text-sm font-medium text-neutral-900 hover:underline"
                    >
                        전체보기 →
                    </button>
                </div>

                {section.layout ===
                    "HORIZONTAL_SCROLL" ? (
                    <div className="flex gap-5 overflow-x-auto pb-2">
                        {products.map(
                            (product) => (
                                <div
                                    key={
                                        product.id
                                    }
                                    className="w-[360px] shrink-0"
                                >
                                    {renderProductCard(
                                        product,
                                    )}
                                </div>
                            ),
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map(
                            renderProductCard,
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}