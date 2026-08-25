import { useState, useCallback } from "react";
import {
    InventoryItem,
    InventoryLog,
    InventoryFilterParams,
    AdjustStockPayload,
    StockStatus
} from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";
import { toCamelCase } from "@/utils/camelCase";

export function useAdminInventory() {
    const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // 1. 재고 목록 조회 (GET /api/inventory-items)
    const fetchInventoryList = useCallback(async (params?: InventoryFilterParams) => {
        setLoading(true);
        setError(null);
        try {
            const query = params ? new URLSearchParams(params as Record<string, string>).toString() : "";
            const url = query ? `${API_ENDPOINTS.INVENTORY.BASE}?${query}` : API_ENDPOINTS.INVENTORY.BASE;

            const res = await fetch(url);
            if (!res.ok) throw new Error("재고 목록을 불러오지 못했습니다.");

            const resData = await res.json();

            // resData.data 전체(하위 skus의 option_name, current_stock 등까지) 카멜케이스로 일괄 변환
            const camelData = toCamelCase<InventoryItem[]>(resData.data || resData);

            setInventoryList(Array.isArray(camelData) ? camelData : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 에러");
            setInventoryList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. 재고 이력 조회 (GET /api/inventory-items/logs)
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_ENDPOINTS.INVENTORY.LOGS);
            if (!res.ok) throw new Error("재고 이력을 불러오지 못했습니다.");
            const data: InventoryLog[] = await res.json();
            setLogs(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 에러");
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. 신규 재고 등록 (POST /api/inventory-items)
    const createInventoryItem = useCallback(async (newItem: InventoryItem) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_ENDPOINTS.INVENTORY.BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem),
            });
            if (!res.ok) throw new Error("신규 재고 등록 실패");
            await fetchInventoryList();
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 에러");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInventoryList]);

    // 4. 재고 수동 조정 (POST /api/inventory-items/adjust)
    const adjustStock = useCallback(async (payload: AdjustStockPayload) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_ENDPOINTS.INVENTORY.ADJUST, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("재고 조정 실패");
            await fetchInventoryList();
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 에러");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInventoryList]);

    // 5. SKU 상태/정보 수정 (PATCH /api/inventory-items/:uuid)
    const updateSkuStatus = useCallback(async (uuid: string, status: StockStatus) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_ENDPOINTS.INVENTORY.BY_UUID(uuid), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("SKU 상태 변경 실패");
            await fetchInventoryList();
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 에러");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInventoryList]);

    return {
        inventoryList,
        logs,
        loading,
        error,
        fetchInventoryList,
        fetchLogs,
        createInventoryItem,
        adjustStock,
        updateSkuStatus,
    };
}