"use client";

import { useAdminAuthStore } from "@/store/useAdminAuth";
import {
    AdjustmentReason,
    InventoryFilterParams,
    InventoryLog,
    SkuInventory,
} from "@mall/types";
import { useCallback, useState } from "react";

export function useAdminInventory() {
    const { user } = useAdminAuthStore();

    const isAdmin = user?.role === "ADMIN";
    const currentAdminId = user?.id || "";

    const [inventoryList, setInventoryList] = useState<SkuInventory[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 재고 목록 API 조회
    const fetchInventoryList = useCallback(async (params?: InventoryFilterParams) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (params?.searchQuery) queryParams.append("searchQuery", params.searchQuery);
            if (params?.status) queryParams.append("status", params.status);
            if (params?.category) queryParams.append("category", params.category);

            const res = await fetch(`/api/admin/inventory?${queryParams.toString()}`);
            if (!res.ok) throw new Error("재고 목록을 불러오지 못했습니다.");

            const data: SkuInventory[] = await res.json();
            setInventoryList(data);
        } catch (err: any) {
            setError(err.message || "재고 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    // [2] 감사 로그 API 조회
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/inventory/logs");
            if (!res.ok) throw new Error("감사 로그를 불러오지 못했습니다.");

            const data: InventoryLog[] = await res.json();
            setLogs(data);
        } catch (err: any) {
            setError(err.message || "감사 로그를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    // [3] SKU 신규 등록 API
    const createSkuInventory = async (data: {
        id: string;
        optionName: string;
        initialStock: number;
        safetyStock: number;
    }) => {
        if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");
        setLoading(true);

        try {
            const res = await fetch("/api/admin/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("SKU 등록에 실패했습니다.");

            await fetchInventoryList();
        } catch (err: any) {
            setError(err.message || "SKU 등록 중 오류가 발생했습니다.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // [4] 특정 SKU 수동 재고 조정 API
    const adjustStock = async (
        skuId: string,
        deltaQty: number,
        reason: AdjustmentReason,
        memo: string,
        adminId?: string
    ) => {
        if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/inventory/${skuId}/adjust`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deltaQty,
                    reasonType: reason,
                    reasonMemo: memo,
                    adminId: adminId || currentAdminId,
                }),
            });

            if (!res.ok) throw new Error("재고 조정에 실패했습니다.");

            await Promise.all([fetchInventoryList(), fetchLogs()]);
        } catch (err: any) {
            setError(err.message || "재고 조정 중 오류가 발생했습니다.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // [5] 특정 SKU 활성화 / 비활성화 토글 API
    const toggleSkuStatus = async (skuId: string) => {
        if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/inventory/${skuId}/status`, {
                method: "PATCH",
            });

            if (!res.ok) throw new Error("상태 변경에 실패했습니다.");

            await fetchInventoryList();
        } catch (err: any) {
            setError(err.message || "상태 변경 중 오류가 발생했습니다.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        isAdmin,
        currentAdminId,
        inventoryList,
        logs,
        loading,
        error,
        fetchInventoryList,
        fetchLogs,
        createSkuInventory,
        adjustStock,
        toggleSkuStatus,
    };
}