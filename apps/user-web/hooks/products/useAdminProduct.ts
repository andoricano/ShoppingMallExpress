import { useState, useCallback } from "react";
import { API_ENDPOINTS } from "@mall/constants";
import { toCamelCase } from "@/utils/camelCase";
import { BatchUpdatePayload, Product, ProductFilterParams, ProductStatus } from "@mall/types";


export interface PaginationState {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export function useAdminProducts() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1, limit: 20, totalCount: 0, totalPages: 0,
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProductList = useCallback(async (params?: ProductFilterParams) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams();
            if (params?.searchQuery) query.append("searchQuery", params.searchQuery.trim());
            if (params?.status) query.append("status", params.status);
            if (params?.categoryId) query.append("categoryId", params.categoryId);
            if (params?.sort) query.append("sort", params.sort);
            if (params?.page) query.append("page", String(params.page));
            if (params?.limit) query.append("limit", String(params.limit ?? 20));

            const baseUrl = API_ENDPOINTS?.PRODUCTS?.ADMIN || "/api/products/admin";
            const url = query.toString() ? `${baseUrl}?${query.toString()}` : baseUrl;

            const res = await fetch(url);
            if (!res.ok) throw new Error("상품 목록을 불러오지 못했습니다.");

            const resData = await res.json();
            const camelData = toCamelCase<Product[]>(resData.data || []);
            setProductList(Array.isArray(camelData) ? camelData : []);
            if (resData.pagination) setPagination(resData.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 에러가 발생했습니다.");
            setProductList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const batchUpdateStatus = useCallback(async (productIds: string[], status: Extract<ProductStatus, "DISPLAY" | "HIDDEN">) => {
        setLoading(true);
        try {
            const payload: BatchUpdatePayload = { productIds, status };
            const baseUrl = API_ENDPOINTS?.PRODUCTS?.BATCH_STATUS || "/api/products/admin/batch-status";
            const res = await fetch(baseUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("상태 일괄 변경에 실패했습니다.");
            return true;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const batchUpdateCategory = useCallback(async (productIds: string[], targetCategoryIds: string[]) => {
        setLoading(true);
        try {
            const payload: BatchUpdatePayload = { productIds, targetCategoryIds };
            const baseUrl = API_ENDPOINTS?.PRODUCTS?.BATCH_CATEGORY || "/api/products/admin/batch-category";
            const res = await fetch(baseUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("카테고리 일괄 이동 중 오류가 발생했습니다.");
            return true;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteProduct = useCallback(async (productId: string) => {
        setLoading(true);
        try {
            const baseUrl = API_ENDPOINTS?.PRODUCTS?.BY_ID
                ? API_ENDPOINTS.PRODUCTS.BY_ID(productId)
                : `/api/products/${productId}`;
            const res = await fetch(baseUrl, { method: "DELETE" });
            if (!res.ok) throw new Error("상품 삭제 처리에 실패했습니다.");
            return true;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { productList, pagination, loading, error, fetchProductList, batchUpdateStatus, batchUpdateCategory, deleteProduct };
}