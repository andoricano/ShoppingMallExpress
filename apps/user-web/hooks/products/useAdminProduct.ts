import { useCallback, useState } from "react";
import type { Product } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

// ==========================================
// Types
// ==========================================

interface ProductQuery {
    search?: string;
    isActive?: boolean;
}

interface CreateProductPayload {
    name: string;
    mainImageUrl: string;
    imageUrls?: string[];
    description: string;
    price: number;
    inventoryId: string;
    isActive?: boolean;
}

interface UpdateProductPayload {
    name?: string;
    mainImageUrl?: string;
    imageUrls?: string[];
    description?: string;
    price?: number;
    inventoryId?: string;
    isActive?: boolean;
}

// ==========================================
// Hook
// ==========================================

export function useAdminProducts() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // ==========================================
    // 1. Admin 상품 목록 조회 / 검색
    // ==========================================

    const fetchProducts = useCallback(
        async (params?: ProductQuery) => {
            setLoading(true);
            setError(null);

            try {
                const query = new URLSearchParams();

                if (params?.search?.trim()) {
                    query.set("search", params.search.trim());
                }

                if (params?.isActive !== undefined) {
                    query.set("isActive", String(params.isActive));
                }

                const queryString = query.toString();

                const url = queryString
                    ? `${API_ENDPOINTS.PRODUCTS.BASE}?${queryString}`
                    : API_ENDPOINTS.PRODUCTS.BASE;

                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error("상품 목록을 불러오지 못했습니다.");
                }

                const resData = await res.json();

                setProductList(
                    Array.isArray(resData.data)
                        ? resData.data
                        : []
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러"
                );
                setProductList([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // ==========================================
    // 2. 상품 상세 조회
    // ==========================================

    const fetchProduct = useCallback(
        async (id: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCTS.BY_ID(id)
                );

                if (!res.ok) {
                    throw new Error("상품 정보를 불러오지 못했습니다.");
                }

                const resData = await res.json();
                const product = resData.data as Product;

                setSelectedProduct(product);

                return product;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러"
                );
                setSelectedProduct(null);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );


    // ==========================================
    // 3. 상품 등록
    // ==========================================

    const createProduct = useCallback(
        async (payload: CreateProductPayload) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCTS.BASE,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message || "상품 등록에 실패했습니다."
                    );
                }

                const resData = await res.json();

                await fetchProducts();

                return resData.data as Product;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러"
                );
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [fetchProducts]
    );



    // ==========================================
    // 4. 상품 정보 수정
    // ==========================================

    const updateProduct = useCallback(
        async (
            id: string,
            payload: UpdateProductPayload
        ) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCTS.BY_ID(id),
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message || "상품 수정에 실패했습니다."
                    );
                }

                const resData = await res.json();

                await fetchProducts();

                if (selectedProduct?.id === id) {
                    setSelectedProduct(resData.data as Product);
                }

                return resData.data as Product;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러"
                );
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [fetchProducts, selectedProduct]
    );

    // ==========================================
    // 5. 상품 활성 / 비활성
    // ==========================================

    const toggleProductStatus = useCallback(
        async (id: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCTS.STATUS(id),
                    {
                        method: "PATCH",
                    }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message ||
                        "상품 활성 상태 변경에 실패했습니다."
                    );
                }

                const resData = await res.json();

                await fetchProducts();

                if (selectedProduct?.id === id) {
                    setSelectedProduct(resData.data as Product);
                }

                return resData.data as Product;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러"
                );
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [fetchProducts, selectedProduct]
    );

    // ==========================================
    // 6. 비활성 상품 삭제
    // ==========================================

    const deleteProduct = useCallback(
        async (id: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCTS.BY_ID(id),
                    {
                        method: "DELETE",
                    }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message || "상품 삭제에 실패했습니다."
                    );
                }

                await fetchProducts();

                if (selectedProduct?.id === id) {
                    setSelectedProduct(null);
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러"
                );
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [fetchProducts, selectedProduct]
    );

    return {
        productList,
        selectedProduct,
        loading,
        error,

        fetchProducts,
        fetchProduct,
        createProduct,
        updateProduct,
        toggleProductStatus,
        deleteProduct,

        setSelectedProduct,
    };
}