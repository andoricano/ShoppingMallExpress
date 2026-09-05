// component/products/post/ProductPost.tsx

"use client";

import type {
    Product,
    ProductPost as ProductPostType,
} from "@mall/types";

import { ProductPostHeader } from "./ProductPostHeader";
import { ProductPostDescription } from "./ProductPostDescription";
import { ProductReview } from "./ProductReview";

interface ProductReviewData {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    content: string;
    createdAt: string;
}

interface ProductPostSectionProps {
    post: ProductPostType;
    products: Product[];
    reviews: ProductReviewData[];
}

export function ProductPostSection({
    post,
    products,
    reviews,
}: ProductPostSectionProps) {
    return (
        <main className="min-h-screen bg-white">
            <ProductPostHeader
                post={post}
                products={products}
            />

            <ProductPostDescription
                description={post.content}
            />

            <ProductReview
                reviews={reviews}
                productId={products[0]?.id}
            />
        </main>
    );
}