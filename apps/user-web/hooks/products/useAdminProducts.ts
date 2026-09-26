"use client";

import { useCallback } from "react";
import type {
    AdminProductDetail,
    Product,
    ProductUpdateInput,
} from "@mall/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(result?.message ?? "상품 요청에 실패했습니다.");
    }

    return result?.data as T;
}

/** Admin Product read/update through the server-only Admin boundary. */
export function useAdminProducts() {
    const searchProducts = useCallback(
        (search?: string) =>
            request<Product[]>(
                `/api/admin/products${search ? `?search=${encodeURIComponent(search)}` : ""}`,
            ),
        [],
    );

    const fetchProductDetail = useCallback(
        (productId: string) =>
            request<AdminProductDetail>(`/api/admin/products/${productId}`),
        [],
    );

    const updateProduct = useCallback(
        (productId: string, input: ProductUpdateInput) =>
            request<AdminProductDetail>(`/api/admin/products/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            }),
        [],
    );

    /** Explicit Admin-decided sold-out state; independent of stock and isActive. */
    const setVariantSoldOut = useCallback(
        (productId: string, variantId: string, isSoldOut: boolean) =>
            request<{ isSoldOut: boolean }>(
                `/api/admin/products/${productId}/variants/${variantId}/sold-out`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isSoldOut }),
                },
            ),
        [],
    );

    return { searchProducts, fetchProductDetail, updateProduct, setVariantSoldOut };
}
