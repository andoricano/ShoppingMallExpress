// apps/user-web/hooks/products/useProducts.ts

"use client";

import { useCallback, useState } from "react";
import type { Product } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

export function useProducts() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [product, setProduct] = useState<Product | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 활성 상품 목록
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(API_ENDPOINTS.CLIENT_PRODUCTS.BASE);

            if (!res.ok) {
                throw new Error("상품 목록을 불러오지 못했습니다.");
            }

            const result = await res.json();

            setProductList(
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

            setProductList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 상품 상세
    const fetchProduct = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/api/admin/products/${id}`
            );

            if (!res.ok) {
                throw new Error("상품 정보를 불러오지 못했습니다.");
            }

            const result = await res.json();

            setProduct(result.data ?? null);

            return result.data as Product;
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "상품 조회에 실패했습니다."
            );

            setProduct(null);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        productList,
        product,

        loading,
        error,

        fetchProducts,
        fetchProduct,
    };
}