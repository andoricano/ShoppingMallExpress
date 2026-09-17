// hooks/products/useProductPostEdit.ts

"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import type {
    Product,
    ProductPost,
} from "@mall/types";

import { API_ENDPOINTS } from "@mall/constants";
import { useImageApi } from "../images/useImageApi";
import type { PendingImage } from "@/component/products/post/editor/useEditSection";


// ==========================================
// Types
// ==========================================

interface ProductPostDetailRelation {
    id: string;
    productId: string;
    displayOrder: number;
    products: Product;
}

interface ProductPostDetailResponse
    extends ProductPost {
    productPostProducts: ProductPostDetailRelation[];
}

export interface ProductPostEditDraft {
    post: ProductPost;
    products: Product[];
}

// ==========================================
// Hook
// ==========================================

export function useProductPostEdit(
    productPostId: string,
) {
    const [draftPost, setDraftPost] =
        useState<ProductPost | null>(null);

    const [draftProducts, setDraftProducts] =
        useState<Product[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const { uploadImage } = useImageApi();

    const [
        thumbnailFile,
        setThumbnailFileState,
    ] = useState<File | null>(null);


    const [
        pendingImages,
        setPendingImages,
    ] = useState<PendingImage[]>([]);


    // ==========================================
    // 1. ProductPost 조회
    // ==========================================
    const fetchProductPost = useCallback(
        async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCT_POSTS.BY_ID(
                        productPostId,
                    ),
                );

                const result = await res
                    .json()
                    .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "상품 게시물을 불러오지 못했습니다.",
                    );
                }

                const data =
                    result.data as ProductPostDetailResponse;

                const relations =
                    data.productPostProducts ?? [];

                const sortedRelations = [...relations].sort(
                    (a, b) =>
                        a.displayOrder - b.displayOrder,
                );

                const nextPost: ProductPost = {
                    id: data.id,
                    title: data.title,
                    thumbnail: data.thumbnail,
                    imageUrls: data.imageUrls,
                    content: data.content,
                    productIds: sortedRelations.map(
                        (item) => item.productId,
                    ),
                    isPublished: data.isPublished,
                    viewCount: data.viewCount,
                    publishedAt: data.publishedAt,
                    metadata: data.metadata,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                };

                const nextProducts: Product[] =
                    sortedRelations.map(
                        (item) => item.products,
                    );

                setDraftPost(nextPost);
                setDraftProducts(nextProducts);

                return nextPost;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "상품 게시물 조회에 실패했습니다.";

                setError(message);
                setDraftPost(null);
                setDraftProducts([]);

                return null;
            } finally {
                setLoading(false);
            }
        },
        [productPostId],
    );


    useEffect(() => {
        fetchProductPost();
    }, [fetchProductPost]);

    // ==========================================
    // 2. ProductPost 수정
    // ==========================================

    const updatePost = useCallback(
        (post: ProductPost) => {
            setDraftPost(post);
        },
        [],
    );

    const setThumbnailFile = useCallback(
        (file: File) => {
            setThumbnailFileState(file);
        },
        [],
    );
    // ==========================================
    // 3. Product 추가
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

    // ==========================================
    // 3. Product 수정
    // ==========================================

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

    // ==========================================
    // 4. Product 제거
    // ==========================================

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

    // ==========================================
    // 5. Product 순서 변경
    // ==========================================

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

                next.splice(
                    toIndex,
                    0,
                    moved,
                );

                return next;
            });
        },
        [],
    );

    // ==========================================
    // 6. Update Payload
    // ==========================================

    const buildPayload = useCallback(() => {
        if (!draftPost) {
            throw new Error(
                "상품 게시물 데이터가 없습니다.",
            );
        }

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
                    id: product.id,

                    name: product.name.trim(),
                    mainImageUrl:
                        product.mainImageUrl,
                    imageUrls:
                        product.imageUrls,
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
    // 7. ProductPost 수정 API
    // ==========================================
    const saveProductPost =
        useCallback(async () => {
            if (!draftPost?.id) {
                throw new Error(
                    "상품 게시물 ID가 필요합니다.",
                );
            }

            setSaving(true);
            setError(null);

            try {
                let thumbnail =
                    draftPost.thumbnail;

                // ==========================================
                // Thumbnail 이미지 업로드
                // ==========================================

                if (thumbnailFile) {
                    const { imageUrl } =
                        await uploadImage(
                            thumbnailFile,
                        );

                    thumbnail = {
                        ...thumbnail,
                        imageUrl,
                    };
                }

                // ==========================================
                // Tiptap 이미지 업로드
                // ==========================================

                let content =
                    draftPost.content;

                if (pendingImages.length > 0) {
                    const uploadedImages =
                        await Promise.all(
                            pendingImages.map(
                                async (image) => {
                                    const result =
                                        await uploadImage(
                                            image.file,
                                        );

                                    console.log(
                                        "[TIPTAP IMAGE] uploaded:",
                                        {
                                            previewUrl:
                                                image.previewUrl,
                                            imageUrl:
                                                result.imageUrl,
                                            path: result.path,
                                        },
                                    );

                                    return {
                                        previewUrl:
                                            image.previewUrl,
                                        imageUrl:
                                            result.imageUrl,
                                    };
                                },
                            ),
                        );

                    const contentJson =
                        JSON.parse(content);

                    const replaceImageUrls = (
                        node: any,
                    ): any => {
                        if (
                            node.type ===
                            "image" &&
                            node.attrs?.src
                        ) {
                            const uploaded =
                                uploadedImages.find(
                                    (image) =>
                                        image.previewUrl ===
                                        node.attrs.src,
                                );

                            if (uploaded) {
                                return {
                                    ...node,
                                    attrs: {
                                        ...node.attrs,
                                        src: uploaded.imageUrl,
                                    },
                                };
                            }
                        }

                        if (
                            Array.isArray(
                                node.content,
                            )
                        ) {
                            return {
                                ...node,
                                content:
                                    node.content.map(
                                        replaceImageUrls,
                                    ),
                            };
                        }

                        return node;
                    };

                    content = JSON.stringify(
                        replaceImageUrls(
                            contentJson,
                        ),
                    );
                }

                // ==========================================
                // Payload
                // ==========================================

                const payload = {
                    ...buildPayload(),
                    thumbnail,
                    content,
                };

                // ==========================================
                // ProductPost 수정
                // ==========================================

                const res = await fetch(
                    API_ENDPOINTS.PRODUCT_POSTS.BY_ID(
                        draftPost.id,
                    ),
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            payload,
                        ),
                    },
                );

                const result = await res
                    .json()
                    .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "상품 게시물을 수정하지 못했습니다.",
                    );
                }

                const updatedPost =
                    result.data as ProductPost;

                setDraftPost(updatedPost);
                setThumbnailFileState(null);
                setPendingImages([]);

                return updatedPost;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "상품 게시물 수정에 실패했습니다.";

                setError(message);

                throw err;
            } finally {
                setSaving(false);
            }
        }, [
            draftPost,
            buildPayload,
            thumbnailFile,
            pendingImages,
            uploadImage,
        ]);


    // ==========================================
    // 8. ProductPost 삭제 API
    // ==========================================

    const deleteProductPost =
        useCallback(async () => {
            if (!draftPost?.id) {
                throw new Error(
                    "상품 게시물 ID가 필요합니다.",
                );
            }

            setSaving(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCT_POSTS.BY_ID(
                        draftPost.id,
                    ),
                    {
                        method: "DELETE",
                    },
                );

                const result = await res
                    .json()
                    .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "상품 게시물을 삭제하지 못했습니다.",
                    );
                }

                setDraftPost(null);
                setDraftProducts([]);

                return true;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "상품 게시물 삭제에 실패했습니다.";

                setError(message);

                throw err;
            } finally {
                setSaving(false);
            }
        }, [draftPost?.id]);


    return {
        draftPost,
        draftProducts,

        thumbnailFile,
        setThumbnailFile,

        pendingImages,
        setPendingImages,

        loading,
        saving,
        error,

        fetchProductPost,

        updatePost,

        addProduct,
        updateProduct,
        removeProduct,
        moveProduct,

        saveProductPost,
        deleteProductPost,
    };
}