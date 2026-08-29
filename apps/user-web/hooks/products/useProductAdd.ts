import { useCallback, useState } from "react";
import type { Product, SkuInventory } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

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

    const [productList, setProductList] = useState<Product[]>([]);

    const [loadingInventory, setLoadingInventory] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ==========================================
    // 1. 활성 Inventory 조회 / 검색
    // ==========================================

    const fetchInventories = useCallback(
        async (params?: InventorySearchParams) => {
            setLoadingInventory(true);
            setError(null);

            try {
                const query = new URLSearchParams();

                // 상품 등록에서는 활성 Inventory만 조회
                query.set("isActive", "true");

                if (params?.search?.trim()) {
                    query.set("search", params.search.trim());
                }

                const url = `${API_ENDPOINTS.INVENTORY.BASE}?${query.toString()}`;

                const res = await fetch(url);

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message ||
                        "사용 가능한 Inventory를 불러오지 못했습니다."
                    );
                }

                const resData = await res.json();

                setInventoryList(
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

                setInventoryList([]);
            } finally {
                setLoadingInventory(false);
            }
        },
        []
    );

    // ==========================================
    // 2. Inventory 선택
    // ==========================================

    const selectInventory = useCallback(
        (inventory: SkuInventory) => {
            setSelectedInventory(inventory);
            setError(null);
        },
        []
    );

    // ==========================================
    // 3. 전체 Product 조회
    // ==========================================

    const fetchProducts = useCallback(
        async () => {
            setLoadingProducts(true);
            setError(null);

            try {
                const res = await fetch(
                    API_ENDPOINTS.PRODUCTS.BASE
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message ||
                        "상품 목록을 불러오지 못했습니다."
                    );
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
                setLoadingProducts(false);
            }
        },
        []
    );

    // ==========================================
    // 4. 선택 초기화
    // ==========================================

    const clearSelectedInventory = useCallback(() => {
        setSelectedInventory(null);
    }, []);

    return {
        inventoryList,
        selectedInventory,
        productList,

        loadingInventory,
        loadingProducts,
        error,

        fetchInventories,
        selectInventory,
        fetchProducts,
        clearSelectedInventory,
    };
}