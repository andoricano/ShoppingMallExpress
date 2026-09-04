// component/products/post/ProductPost.tsx

"use client";

import type { Product } from "@mall/types";

import { ProductPostHeader } from "./ProductHeader";
import { ProductDescription } from "./ProductDescription";
import { ProductReview } from "./ProductReview";

interface ProductReviewData {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    content: string;
    createdAt: string;
}

interface ProductPostProps {
    product: Product;
    reviews: ProductReviewData[];
}

export function ProductPost({
    product,
    reviews,
}: ProductPostProps) {
    return (
        <main className="min-h-screen bg-white">
            <ProductPostHeader product={product} />

            <ProductDescription
                description={product.description}
            />

            <ProductReview
                reviews={reviews}
                productId={product.id}
            />
        </main>
    );
}