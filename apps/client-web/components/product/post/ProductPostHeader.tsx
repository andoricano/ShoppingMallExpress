// component/products/post/ProductPostHeader.tsx

"use client";

import type {
    Product,
    ProductPost,
} from "@mall/types";

import { ProductPostSummary } from "./ProductPostSummary";
import { ProductPurchase } from "./ProductPurchase";

interface ProductPostHeaderProps {
    post: ProductPost;
    products: Product[];
}

export function ProductPostHeader({
    post,
    products,
}: ProductPostHeaderProps) {
    return (
        <section className="w-full py-10">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 2xl:max-w-6xl">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                    <ProductPostSummary post={post} />

                    <ProductPurchase
                        products={products}
                    />
                </div>
            </div>
        </section>
    );
}