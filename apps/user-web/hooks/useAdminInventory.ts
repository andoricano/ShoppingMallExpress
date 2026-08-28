import { useState, useCallback } from "react";
import type { SkuInventory } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

// ==========================================
// Types
// ==========================================
interface InventoryQuery {
    search?: string;
    isActive?: boolean;
}

interface CreateInventoryPayload {
    skuCode: string;
    currentStock?: number;
    isActive?: boolean;
    meta?: Record<string, unknown>;
}

interface UpdateInventoryPayload {
    skuCode?: string;
    isActive?: boolean;
    meta?: Record<string, unknown>;
}

// ==========================================
// Hook
// ==========================================

export function useAdminInventory() {
    const [inventoryList, setInventoryList] = useState<SkuInventory[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // ==========================================
    // 1. SKU 재고 조회
    // ==========================================
    const fetchInventoryList = useCallback(
        async (params?: InventoryQuery) => {
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
                    ? `${API_ENDPOINTS.INVENTORY.BASE}?${queryString}`
                    : API_ENDPOINTS.INVENTORY.BASE;

                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error("재고 목록을 불러오지 못했습니다.");
                }

                const resData = await res.json();

                setInventoryList(
                    Array.isArray(resData.data) ? resData.data : []
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러"
                );
                setInventoryList([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // ==========================================
    // 2. SKU 재고 등록
    // ==========================================

    const createInventoryItem = useCallback(
        async (payload: CreateInventoryPayload) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.INVENTORY.BASE,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!res.ok) {
                    throw new Error("신규 재고 등록에 실패했습니다.");
                }

                await fetchInventoryList();
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
        [fetchInventoryList]
    );

    // ==========================================
    // 3. 재고 수동 조정
    // ==========================================

    const adjustStock = useCallback(
        async (skuId: string, adjustmentQty: number) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.INVENTORY.STOCK(skuId),
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            adjustmentQty,
                        }),
                    }
                );

                if (!res.ok) {
                    throw new Error("재고 조정에 실패했습니다.");
                }

                await fetchInventoryList();
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
        [fetchInventoryList]
    );

    // ==========================================
    // 4. SKU 정보 수정
    // ==========================================

    const updateInventoryItem = useCallback(
        async (
            skuId: string,
            payload: UpdateInventoryPayload
        ) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.INVENTORY.BY_ID(skuId),
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!res.ok) {
                    throw new Error("재고 정보 수정에 실패했습니다.");
                }

                await fetchInventoryList();
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
        [fetchInventoryList]
    );

    // ==========================================
    // 5. SKU 활성 / 비활성
    // ==========================================

    const toggleInventoryStatus = useCallback(
        async (skuId: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.INVENTORY.STATUS(skuId),
                    {
                        method: "PATCH",
                    }
                );

                if (!res.ok) {
                    throw new Error(
                        "재고 활성 상태 변경에 실패했습니다."
                    );
                }

                await fetchInventoryList();
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
        [fetchInventoryList]
    );

    // ==========================================
    // 6. 비활성 SKU 삭제
    // ==========================================

    const deleteInventoryItem = useCallback(
        async (skuId: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.INVENTORY.BY_ID(skuId),
                    {
                        method: "DELETE",
                    }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message || "재고 삭제에 실패했습니다."
                    );
                }

                await fetchInventoryList();
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
        [fetchInventoryList]
    );

    return {
        inventoryList,
        loading,
        error,
        fetchInventoryList,
        createInventoryItem,
        adjustStock,
        updateInventoryItem,
        toggleInventoryStatus,
        deleteInventoryItem,
    };
}