// component/products/post/ProductPost.tsx

"use client";

import type { Product } from "@mall/types";
import { ProductPostHeader } from "./ProductHeader";
import { ProductDescription } from "./ProductDescription";
import { ProductReview } from "./ProductReview";


interface ProductPostProps {
    product: Product;
}

export function ProductPost({
    product,
}: ProductPostProps) {
    return (
        <main className="min-h-screen bg-white">
            <ProductPostHeader product={product} />

            <ProductDescription
                description={product.description}
            />

            <ProductReview
                productId={product.id}
            />
        </main>
    );
}