"use client";

import { useCallback, useState } from "react";
import type {
    Product,
    ProductCreateInput,
    ProductVariantCreateInput,
} from "@mall/types";

/** Admin-only request: wareId is linked on the server boundary only. */
export type AdminProductVariantCreateInput = ProductVariantCreateInput & {
    wareId?: string;
};

export type AdminProductCreateInput = Omit<ProductCreateInput, "variants"> & {
    variants: AdminProductVariantCreateInput[];
};

export function useAdminProductCreate() {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createProduct = useCallback(async (input: AdminProductCreateInput): Promise<Product> => {
        setSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.data) {
                throw new Error(result?.message ?? "상품 등록에 실패했습니다.");
            }

            return result.data as Product;
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "상품 등록에 실패했습니다.";
            setError(message);
            throw cause;
        } finally {
            setSaving(false);
        }
    }, []);

    return { createProduct, saving, error };
}
