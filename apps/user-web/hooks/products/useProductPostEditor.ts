import { useCallback, useState } from "react";
import type { Product, ProductPost } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

export interface ProductPostForm {
    title: string;
    thumbnail: ProductPost["thumbnail"];
    imageUrls: string[];
    content: string;
    isPublished: boolean;
    metadata?: Record<string, unknown>;
}

interface UseProductPostEditorProps {
    productPostId?: string;
}

export function useProductPostEditor({
    productPostId,
}: UseProductPostEditorProps = {}) {
    const [productPost, setProductPost] =
        useState<ProductPost | null>(null);

    const [products, setProducts] =
        useState<Product[]>([]);

    const [selectedProducts, setSelectedProducts] =
        useState<Product[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                API_ENDPOINTS.PRODUCTS.BASE
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);

                throw new Error(
                    data?.message ||
                    "상품 목록을 불러오지 못했습니다."
                );
            }

            const result = await res.json();

            setProducts(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "상품 목록 조회에 실패했습니다."
            );

            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProductPost = useCallback(async () => {
        if (!productPostId) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_ENDPOINTS.PRODUCT_POSTS.BASE}/${productPostId}`
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);

                throw new Error(
                    data?.message ||
                    "상품 게시물을 불러오지 못했습니다."
                );
            }

            const result = await res.json();
            setProductPost(result.data ?? null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "상품 게시물 조회에 실패했습니다."
            );

            setProductPost(null);
        } finally {
            setLoading(false);
        }
    }, [productPostId]);

    const addProduct = useCallback(
        (product: Product) => {
            setSelectedProducts((current) => {
                if (
                    current.some(
                        (item) => item.id === product.id
                    )
                ) {
                    return current;
                }

                return [...current, product];
            });
        },
        []
    );

    const removeProduct = useCallback(
        (productId: string) => {
            setSelectedProducts((current) =>
                current.filter(
                    (product) => product.id !== productId
                )
            );
        },
        []
    );

    const moveProduct = useCallback(
        (from: number, to: number) => {
            setSelectedProducts((current) => {
                const next = [...current];

                if (
                    from < 0 ||
                    to < 0 ||
                    from >= next.length ||
                    to >= next.length
                ) {
                    return current;
                }

                const [item] = next.splice(from, 1);

                if (!item) return current;

                next.splice(to, 0, item);

                return next;
            });
        },
        []
    );

    const createProductPost = useCallback(
        async (data: ProductPostForm) => {
            setSaving(true);
            setError(null);

            try {
                const payload = {
                    ...data,
                    productIds: selectedProducts.map(
                        (product, index) => ({
                            productId: product.id,
                            displayOrder: index,
                        })
                    ),
                };

                const res = await fetch(
                    API_ENDPOINTS.PRODUCT_POSTS.BASE,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!res.ok) {
                    const result =
                        await res.json().catch(() => null);

                    throw new Error(
                        result?.message ||
                        "상품 게시물 등록에 실패했습니다."
                    );
                }

                const result = await res.json();

                setProductPost(result.data);

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
        },
        [selectedProducts]
    );

    const updateProductPost = useCallback(
        async (data: Partial<ProductPostForm>) => {
            if (!productPostId) {
                throw new Error(
                    "상품 게시물 ID가 없습니다."
                );
            }

            setSaving(true);
            setError(null);

            try {
                const payload = {
                    ...data,
                    productIds: selectedProducts.map(
                        (product, index) => ({
                            productId: product.id,
                            displayOrder: index,
                        })
                    ),
                };

                const res = await fetch(
                    `${API_ENDPOINTS.PRODUCT_POSTS.BASE}/${productPostId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!res.ok) {
                    const result =
                        await res.json().catch(() => null);

                    throw new Error(
                        result?.message ||
                        "상품 게시물 수정에 실패했습니다."
                    );
                }

                const result = await res.json();

                setProductPost(result.data);

                return result.data as ProductPost;
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
        },
        [productPostId, selectedProducts]
    );


    const deleteProductPost = useCallback(async () => {
        if (!productPostId) {
            throw new Error(
                "상품 게시물 ID가 없습니다."
            );
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_ENDPOINTS.PRODUCT_POSTS.BASE}/${productPostId}`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) {
                const result =
                    await res.json().catch(() => null);

                throw new Error(
                    result?.message ||
                    "상품 게시물을 삭제하지 못했습니다."
                );
            }

            setProductPost(null);

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
    }, [productPostId]);


    return {
        productPost,
        products,
        selectedProducts,

        loading,
        saving,
        error,

        fetchProducts,
        fetchProductPost,

        addProduct,
        removeProduct,
        moveProduct,

        createProductPost,
        updateProductPost,
        deleteProductPost,
    };
}