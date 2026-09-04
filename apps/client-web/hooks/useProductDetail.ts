// hooks/useProductDetail.ts

"use client";

import { useEffect } from "react";
import { useProduct } from "./useProductPost";
import type { Product } from "@mall/types";

interface ProductReview {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    content: string;
    createdAt: string;
}

const MOCK_REVIEWS: ProductReview[] = [
    {
        id: "review-1",
        productId: "fba87988-a4b3-484b-a388-04475564a46f",
        userName: "홍길동",
        rating: 5,
        content: "상품이 생각보다 훨씬 좋습니다. 만족합니다.",
        createdAt: "2026-09-03",
    },
];

export function useProductDetail(id: string | undefined) {
    const {
        product,
        loading: productLoading,
        error: productError,
        fetchProduct,
    } = useProduct();

    useEffect(() => {
        if (!id) {
            return;
        }

        fetchProduct(id);
    }, [id, fetchProduct]);

    const reviews = id
        ? MOCK_REVIEWS.filter(
            (review) => review.productId === id,
        )
        : [];

    return {
        product: product as Product | null,
        reviews,

        loading: productLoading,
        error: productError,
    };
}