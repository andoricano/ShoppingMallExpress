// packages/mall-page-viewer/src/components/product/ProductSection.tsx

"use client";



import { ProductDetailedThumbnailCard } from "./ProductDetailedThumbnailCard";
import { ProductCard } from "./ProductCard";
import { ProductCardData, ProductSectionConfig } from "../../types/mainPage";

interface ProductSectionProps {
    section: ProductSectionConfig;
    onNavigate?: (path: string) => void;
}

export default function ProductSection({
    section,
    onNavigate,
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
            <section className="mx-auto max-w-7xl px-4 py-20 text-center text-neutral-500 sm:px-6 lg:px-8">
                등록된 상품이 없습니다.
            </section>
        );
    }

    const renderProductCard = (
        product: ProductCardData,
    ) => {
        if (section.cardType === "DETAILED") {
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
                cardType={
                    section.cardType
                }
                onClick={() =>
                    onNavigate?.(
                        `/products/${product.id}`,
                    )
                }
            />
        );
    };

    return (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            {/* Section Header */}
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

            {/* GRID */}
            {section.layout === "GRID" && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map(
                        renderProductCard,
                    )}
                </div>
            )}

            {/* HORIZONTAL SCROLL */}
            {section.layout ===
                "HORIZONTAL_SCROLL" && (
                    <div className="flex gap-6 overflow-x-auto pb-2">
                        {products.map(
                            (product) => (
                                <div
                                    key={
                                        product.id
                                    }
                                    className="w-[220px] shrink-0"
                                >
                                    {renderProductCard(
                                        product,
                                    )}
                                </div>
                            ),
                        )}
                    </div>
                )}

            {/* LARGE */}
            {section.layout === "LARGE" && (
                <div className="grid grid-cols-1 gap-6">
                    {products.map(
                        renderProductCard,
                    )}
                </div>
            )}
        </section>
    );
}