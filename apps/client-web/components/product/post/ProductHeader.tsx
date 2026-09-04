// component/products/post/ProductPostHeader.tsx

"use client";

import type { Product } from "@mall/types";

import { ProductSummary } from "./ProductSummary";
import { ProductPurchase } from "./ProductPurchase";

interface ProductPostHeaderProps {
    product: Product;
}

export function ProductPostHeader({
    product,
}: ProductPostHeaderProps) {
    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                <ProductSummary product={product} />

                <ProductPurchase product={product} />
            </div>
        </section>
    );
}