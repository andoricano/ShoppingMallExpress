"use client";

import type {
    CartItem,
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

    isWishlisted?: boolean;

    onWishlistClick?: () => void;
    onCartClick?: () => void;

    onSelectionChange?: (
        item: CartItem,
    ) => void;
}

export function ProductPostSection({
    post,
    products,
    reviews,
    isWishlisted = false,
    onWishlistClick,
    onCartClick,
    onSelectionChange,
}: ProductPostSectionProps) {
    return (
        <main className="min-h-screen bg-white">
            <ProductPostHeader
                post={post}
                products={products}
                isWishlisted={
                    isWishlisted
                }
                onWishlistClick={
                    onWishlistClick
                }
                onCartClick={
                    onCartClick
                }
                onSelectionChange={
                    onSelectionChange
                }
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