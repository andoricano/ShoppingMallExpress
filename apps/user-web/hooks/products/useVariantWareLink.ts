"use client";

import { useCallback, useState } from "react";

import type {
    AdminLinkVariantWareInput,
    AdminLinkVariantWareResult,
    AdminProductDetail,
    AdminProductVariantWares,
    Product,
} from "@mall/types";

async function adminRequest<T>(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<T> {
    const response = await fetch(input, init);
    const payload = await response.json().catch(() => null) as {
        data?: T;
        message?: string;
    } | null;

    if (!response.ok) {
        throw new Error(payload?.message ?? "Admin request failed.");
    }

    return payload?.data as T;
}

/**
 * Admin-only: link existing ProductVariants to a Ware. Ware data is read and
 * written only through Admin Route Handlers (ADMIN check + service role).
 */
export function useVariantWareLink() {
    const [products, setProducts] = useState<Product[]>([]);
    const [detail, setDetail] = useState<AdminProductDetail | null>(null);
    const [links, setLinks] = useState<AdminProductVariantWares[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchProducts = useCallback(async (search: string) => {
        setLoading(true);
        setError(null);

        try {
            const query = search.trim()
                ? `?search=${encodeURIComponent(search.trim())}`
                : "";

            setProducts(
                (await adminRequest<Product[]>(`/api/admin/products${query}`)) ?? [],
            );
        } catch (cause) {
            setProducts([]);
            setError(cause instanceof Error ? cause.message : "Product 검색에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadLinks = useCallback(async (productId: string) => {
        setLinks(
            (await adminRequest<AdminProductVariantWares[]>(
                `/api/admin/products/${productId}/variant-wares`,
            )) ?? [],
        );
    }, []);

    const selectProduct = useCallback(async (productId: string) => {
        setLoading(true);
        setError(null);

        try {
            const [product] = await Promise.all([
                adminRequest<AdminProductDetail>(`/api/admin/products/${productId}`),
                loadLinks(productId),
            ]);

            setDetail(product);
        } catch (cause) {
            setDetail(null);
            setLinks([]);
            setError(cause instanceof Error ? cause.message : "Product를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [loadLinks]);

    const clearProduct = useCallback(() => {
        setDetail(null);
        setLinks([]);
        setError(null);
    }, []);

    // Failures are returned to the calling row instead of the list-level error.
    const linkVariantWare = useCallback(async (
        productId: string,
        input: AdminLinkVariantWareInput,
    ): Promise<
        { ok: true; result: AdminLinkVariantWareResult } | { ok: false; message: string }
    > => {
        try {
            const result = await adminRequest<AdminLinkVariantWareResult>(
                `/api/admin/products/${productId}/variant-wares`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                },
            );

            await loadLinks(productId);
            return { ok: true, result };
        } catch (cause) {
            return {
                ok: false,
                message: cause instanceof Error ? cause.message : "Variant 연결에 실패했습니다.",
            };
        }
    }, [loadLinks]);

    return {
        products,
        detail,
        links,
        loading,
        error,
        searchProducts,
        selectProduct,
        clearProduct,
        linkVariantWare,
    };
}
