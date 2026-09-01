import { useCallback, useState } from "react";
import type { Product } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

export function useProductEdit(productId: string) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProduct = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_ENDPOINTS.PRODUCTS.BASE}/${productId}`
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);

                throw new Error(
                    data?.message ||
                    "상품 정보를 불러오지 못했습니다."
                );
            }

            const resData = await res.json();
            setProduct(resData.data ?? null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "알 수 없는 에러"
            );

            setProduct(null);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const updateProduct = useCallback(
        async (data: Partial<Product>) => {
            setSaving(true);
            setError(null);

            try {
                const res = await fetch(
                    `${API_ENDPOINTS.PRODUCTS.BASE}/${productId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data),
                    }
                );

                if (!res.ok) {
                    const result = await res.json().catch(() => null);

                    throw new Error(
                        result?.message ||
                        "상품 정보를 수정하지 못했습니다."
                    );
                }

                const result = await res.json();
                const updatedProduct = result.data as Product;

                setProduct(updatedProduct);

                return updatedProduct;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러";

                setError(message);
                throw err;
            } finally {
                setSaving(false);
            }
        },
        [productId]
    );

    return {
        product,
        loading,
        saving,
        error,
        fetchProduct,
        updateProduct,
    };
}