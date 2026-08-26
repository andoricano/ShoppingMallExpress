import { useState, useCallback } from "react";
import type {
    InventoryItem,
    InventoryLog,
    InventoryFilterParams,
    AdjustStockPayload,
} from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";
import { toCamelCase } from "@/utils/camelCase";

export interface PaginationState {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export function useAdminInventory() {
    const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
    const [inventoryPagination, setInventoryPagination] = useState<PaginationState>({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0,
    });

    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [logsPagination, setLogsPagination] = useState<PaginationState>({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // 1. 재고 목록 조회 (PRD 3.2 - 필터링 및 페이징 지원)
    const fetchInventoryList = useCallback(
        async (params?: InventoryFilterParams & { page?: number; limit?: number }) => {
            setLoading(true);
            setError(null);
            try {
                const query = new URLSearchParams();
                if (params?.searchQuery) query.append("searchQuery", params.searchQuery);
                if (params?.status) query.append("status", params.status);
                if (params?.category) query.append("category", params.category);
                if (params?.page) query.append("page", String(params.page));
                if (params?.limit) query.append("limit", String(params.limit));

                const url = query.toString()
                    ? `${API_ENDPOINTS.INVENTORY.BASE}?${query.toString()}`
                    : API_ENDPOINTS.INVENTORY.BASE;

                const res = await fetch(url);
                if (!res.ok) throw new Error("재고 목록을 불러오지 못했습니다.");

                const resData = await res.json();
                const camelData = toCamelCase<InventoryItem[]>(resData.data || []);

                setInventoryList(Array.isArray(camelData) ? camelData : []);
                if (resData.pagination) {
                    setInventoryPagination(resData.pagination);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "알 수 없는 에러");
                setInventoryList([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // 2. 재고 감사 로그 조회 (PRD 3.6 - 페이징 처리 및 toCamelCase 파싱 반영)
    const fetchLogs = useCallback(async (page = 1, limit = 50) => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_ENDPOINTS.INVENTORY.LOGS}?page=${page}&limit=${limit}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("재고 이력을 불러오지 못했습니다.");

            const resData = await res.json();
            const camelLogs = toCamelCase<InventoryLog[]>(resData.data || []);

            setLogs(Array.isArray(camelLogs) ? camelLogs : []);
            if (resData.pagination) {
                setLogsPagination(resData.pagination);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 에러");
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. 신규 재고 그룹 및 SKU 등록 (PRD 3.1)
    const createInventoryItem = useCallback(
        async (newItemPayload: Record<string, any>) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(API_ENDPOINTS.INVENTORY.BASE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newItemPayload),
                });
                if (!res.ok) throw new Error("신규 재고 등록 실패");
                await fetchInventoryList();
            } catch (err) {
                setError(err instanceof Error ? err.message : "알 수 없는 에러");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [fetchInventoryList]
    );

    // 4. 어드민 재고 수동 조정 (PRD 3.3 - RPC 트랜잭션 연동)
    const adjustStock = useCallback(
        async (payload: AdjustStockPayload) => {
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
        },
        [fetchInventoryList]
    );

    // 5. SKU 정보 수정 - 옵션명 및 안전재고 (PRD 3.1)
    const updateSkuInfo = useCallback(
        async (uuid: string, payload: { optionName?: string; safetyStock?: number }) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(API_ENDPOINTS.INVENTORY.BY_UUID(uuid), {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("SKU 정보 수정 실패");
                await fetchInventoryList();
            } catch (err) {
                setError(err instanceof Error ? err.message : "알 수 없는 에러");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [fetchInventoryList]
    );

    // 6. SKU 논리적 비활성화 / 활성화 토글 (PRD 3.7)
    const toggleSkuStatus = useCallback(
        async (uuid: string) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_ENDPOINTS.INVENTORY.BY_UUID(uuid)}/toggle`, {
                    method: "PATCH",
                });
                if (!res.ok) throw new Error("SKU 상태 토글 실패");
                await fetchInventoryList();
            } catch (err) {
                setError(err instanceof Error ? err.message : "알 수 없는 에러");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [fetchInventoryList]
    );

    return {
        inventoryList,
        inventoryPagination,
        logs,
        logsPagination,
        loading,
        error,
        fetchInventoryList,
        fetchLogs,
        createInventoryItem,
        adjustStock,
        updateSkuInfo,
        toggleSkuStatus,
    };
}