"use client";

import type {
    ProductDetail,
    ProductPostDetail,
} from "@mall/types";

import { ProductPostSummary } from "./ProductPostSummary";
import {
    ProductPurchase,
    type ProductVariantSelection,
} from "../purchase/ProductPurchase";
import ProductPostActions from "./ProductPostActions";

interface ProductPostHeaderProps {
    post: ProductPostDetail;
    products: ProductDetail[];

    isWishlisted?: boolean;

    onWishlistClick?: () => void;
    onCartClick?: () => void;

    onSelectionChange?: (
        selection: ProductVariantSelection | null,
    ) => void;
}

export function ProductPostHeader({
    post,
    products,
    isWishlisted = false,
    onWishlistClick,
    onCartClick,
    onSelectionChange,
}: ProductPostHeaderProps) {
    return (
        <section className="w-full py-10">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 2xl:max-w-6xl">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                    <ProductPostSummary
                        post={post}
                    />

                    <div className="space-y-5">
                        <div className="flex justify-end">
                            <ProductPostActions
                                isWishlisted={
                                    isWishlisted
                                }
                                onWishlistClick={
                                    onWishlistClick
                                }
                                onCartClick={
                                    onCartClick
                                }
                            />
                        </div>

                        <ProductPurchase
                            products={products}
                            onSelectionChange={
                                onSelectionChange
                            }
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}