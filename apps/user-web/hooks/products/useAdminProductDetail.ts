import { useState, useCallback } from "react";
import { API_ENDPOINTS } from "@mall/constants";
import { toCamelCase } from "@/utils/camelCase";
import { CreateProductPayload, Product, UpdateProductPayload } from "@mall/types";

export function useAdminProductDetail() {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProductById = useCallback(async (productId: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = API_ENDPOINTS?.PRODUCTS?.BY_ID
                ? API_ENDPOINTS.PRODUCTS.BY_ID(productId)
                : `/api/products/${productId}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("상품 상세 정보를 불러오지 못했습니다.");

            const resData = await res.json();
            const camelData = toCamelCase<Product>(resData.data || resData);
            setProduct(camelData);
            return camelData;
        } catch (err) {
            setError(err instanceof Error ? err.message : "상품 조회 오류");
            setProduct(null);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createProduct = useCallback(async (payload: CreateProductPayload) => {
        setLoading(true);
        try {
            const url = API_ENDPOINTS?.PRODUCTS?.BASE || "/api/products";
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("상품 등록에 실패했습니다.");
            const resData = await res.json();
            return toCamelCase<Product>(resData.data || resData);
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProduct = useCallback(async (productId: string, payload: UpdateProductPayload) => {
        setLoading(true);
        try {
            const url = API_ENDPOINTS?.PRODUCTS?.BY_ID
                ? API_ENDPOINTS.PRODUCTS.BY_ID(productId)
                : `/api/products/${productId}`;
            const res = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("상품 수정에 실패했습니다.");
            const resData = await res.json();
            return toCamelCase<Product>(resData.data || resData);
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteProduct = useCallback(async (productId: string) => {
        setLoading(true);
        try {
            const url = API_ENDPOINTS?.PRODUCTS?.BY_ID
                ? API_ENDPOINTS.PRODUCTS.BY_ID(productId)
                : `/api/products/${productId}`;
            const res = await fetch(url, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("상품 삭제에 실패했습니다.");
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { product, loading, error, fetchProductById, createProduct, updateProduct, deleteProduct };
}