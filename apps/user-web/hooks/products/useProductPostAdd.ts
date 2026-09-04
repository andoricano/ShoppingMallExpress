// hooks/products/useProductPostAdd.ts

"use client";

import { useCallback, useState } from "react";
import type { Product, ProductPost } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

// ==========================================
// Types
// ==========================================

export interface ProductPostDraft {
    post: ProductPost;
    products: Product[];
}

export interface ProductPostSavePayload {
    title: string;
    thumbnail: ProductPost["thumbnail"];
    imageUrls: string[];
    content: string;
    isPublished: boolean;
    metadata?: Record<string, unknown>;

    products: Array<{
        name: string;
        mainImageUrl: string;
        imageUrls: string[];
        description: string;
        price: number;
        inventoryId: string;
        displayOrder: number;
    }>;
}

// ==========================================
// Empty Post
// ==========================================

const createEmptyProductPost = (): ProductPost => ({
    id: "",
    title: "",
    thumbnail: {
        imageUrl: "",
        title: "",
        summary: "",
        discount: 0,
        price: 0,
        tags: [],
    },
    imageUrls: [],
    content: "",
    productIds: [],
    isPublished: false,
    viewCount: 0,
    publishedAt: undefined,
    metadata: {},
    createdAt: "",
    updatedAt: "",
});

// ==========================================
// Hook
// ==========================================

export function useProductPostAdd() {
    const [draftPost, setDraftPost] =
        useState<ProductPost>(
            createEmptyProductPost(),
        );

    const [draftProducts, setDraftProducts] =
        useState<Product[]>([]);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // ==========================================
    // ProductPost Draft
    // ==========================================

    const updatePost = useCallback(
        (post: ProductPost) => {
            setDraftPost(post);
        },
        [],
    );

    // ==========================================
    // Draft Product
    // ==========================================

    const addProduct = useCallback(
        (product: Product) => {
            setDraftProducts((current) => {
                if (
                    current.some(
                        (item) => item.id === product.id,
                    )
                ) {
                    return current;
                }

                return [...current, product];
            });
        },
        [],
    );

    const updateProduct = useCallback(
        (product: Product) => {
            setDraftProducts((current) =>
                current.map((item) =>
                    item.id === product.id
                        ? product
                        : item,
                ),
            );
        },
        [],
    );

    const removeProduct = useCallback(
        (productId: string) => {
            setDraftProducts((current) =>
                current.filter(
                    (product) =>
                        product.id !== productId,
                ),
            );
        },
        [],
    );

    const moveProduct = useCallback(
        (
            fromIndex: number,
            toIndex: number,
        ) => {
            setDraftProducts((current) => {
                if (
                    fromIndex < 0 ||
                    toIndex < 0 ||
                    fromIndex >= current.length ||
                    toIndex >= current.length
                ) {
                    return current;
                }

                const next = [...current];

                const [moved] = next.splice(
                    fromIndex,
                    1,
                );

                if (!moved) {
                    return current;
                }

                next.splice(toIndex, 0, moved);

                return next;
            });
        },
        [],
    );

    // ==========================================
    // Payload
    // ==========================================

    const buildPayload =
        useCallback((): ProductPostSavePayload => {
            return {
                title: draftPost.title.trim(),

                thumbnail: draftPost.thumbnail,

                imageUrls: draftPost.imageUrls,

                content: draftPost.content,

                isPublished:
                    draftPost.isPublished,

                metadata: draftPost.metadata,

                products: draftProducts.map(
                    (product, index) => ({
                        name: product.name.trim(),
                        mainImageUrl:
                            product.mainImageUrl,
                        imageUrls: product.imageUrls,
                        description:
                            product.description,
                        price: product.price,
                        inventoryId:
                            product.inventoryId,
                        displayOrder: index,
                    }),
                ),
            };
        }, [draftPost, draftProducts]);

    // ==========================================
    // ProductPost 생성
    // ==========================================

    const createProductPost =
        useCallback(async () => {
            setSaving(true);
            setError(null);

            try {
                const payload = buildPayload();

                const res = await fetch(
                    API_ENDPOINTS.PRODUCT_POSTS.BASE,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(payload),
                    },
                );

                const result = await res
                    .json()
                    .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "상품 게시물을 등록하지 못했습니다.",
                    );
                }

                return result.data as ProductPost;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "상품 게시물 등록에 실패했습니다.";

                setError(message);

                throw err;
            } finally {
                setSaving(false);
            }
        }, [buildPayload]);

    // ==========================================
    // Draft 초기화
    // ==========================================

    const clearDraft = useCallback(() => {
        setDraftPost(createEmptyProductPost());
        setDraftProducts([]);
        setSaving(false);
        setError(null);
    }, []);

    return {
        draftPost,
        draftProducts,

        saving,
        error,

        updatePost,

        addProduct,
        updateProduct,
        removeProduct,
        moveProduct,

        createProductPost,

        clearDraft,
    };
}