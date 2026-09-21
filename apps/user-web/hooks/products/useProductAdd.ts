// hooks/products/useProductAdd.ts

import { useCallback, useState } from "react";
import type { SkuInventory } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";
import { fetchAdminApi } from "@/lib/api/admin";

// ==========================================
// Types
// ==========================================

interface InventorySearchParams {
    search?: string;
}

// ==========================================
// Hook
// ==========================================

export function useProductAdd() {
    const [inventoryList, setInventoryList] = useState<SkuInventory[]>([]);

    const [selectedInventory, setSelectedInventory] =
        useState<SkuInventory | null>(null);

    const [loadingInventory, setLoadingInventory] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // ==========================================
    // 1. 활성 Inventory 조회 / 검색
    // ==========================================

    const fetchInventories = useCallback(
        async (params?: InventorySearchParams) => {
            setLoadingInventory(true);
            setError(null);

            try {
                const query = new URLSearchParams();

                query.set("isActive", "true");

                if (params?.search?.trim()) {
                    query.set(
                        "search",
                        params.search.trim(),
                    );
                }

                const url =
                    `${API_ENDPOINTS.INVENTORY.BASE}?${query.toString()}`;

                const res = await fetchAdminApi(url);

                if (!res.ok) {
                    const data = await res
                        .json()
                        .catch(() => null);

                    throw new Error(
                        data?.message ||
                        "사용 가능한 Inventory를 불러오지 못했습니다.",
                    );
                }

                const result = await res.json();

                setInventoryList(
                    Array.isArray(result.data)
                        ? result.data
                        : [],
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 에러",
                );

                setInventoryList([]);
            } finally {
                setLoadingInventory(false);
            }
        },
        [],
    );

    // ==========================================
    // 2. Inventory 선택
    // ==========================================

    const selectInventory = useCallback(
        (inventory: SkuInventory) => {
            setSelectedInventory(inventory);
            setError(null);
        },
        [],
    );

    // ==========================================
    // 3. 선택된 Inventory 해제
    // ==========================================

    const clearSelectedInventory = useCallback(() => {
        setSelectedInventory(null);
    }, []);

    return {
        inventoryList,
        selectedInventory,

        loadingInventory,
        error,

        fetchInventories,
        selectInventory,
        clearSelectedInventory,
    };
}
