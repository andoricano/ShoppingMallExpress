"use client";

import { useAdminAuthStore } from "@/store/useAdminAuth";
import { AdjustmentReason, InventoryFilterParams, InventoryItem, InventoryLog } from "@mall/types";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useInventoryDev() {
    const { user } = useAdminAuthStore();

    const isAdmin = user?.role === "ADMIN";
    const currentAdminId = user?.id || "SYSTEM_ADMIN";
    console.log("현재 user 상태:", user);
    console.log("user.role 값:", user?.role);

    // 서버 데이터를 담을 상태
    const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 재고 목록 서버 조회 (GET /api/inventory-items)
    const fetchInventoryList = useCallback(async (params?: InventoryFilterParams) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (params?.searchQuery) queryParams.append("searchQuery", params.searchQuery);
            if (params?.status) queryParams.append("status", params.status);
            if (params?.category) queryParams.append("category", params.category);

            const response = await fetch(`${API_BASE_URL}/api/inventory-items?${queryParams.toString()}`);
            if (!response.ok) throw new Error("재고 목록을 불러오는데 실패했습니다.");

            const responseData = await response.json();

            let rawList: any[] = [];
            if (Array.isArray(responseData)) {
                rawList = responseData;
            } else if (Array.isArray(responseData.data)) {
                rawList = responseData.data;
            } else {
                console.error("[useInventory] 백엔드 응답이 배열 형식이 아닙니다:", responseData);
                rawList = [];
            }

            const formattedList: InventoryItem[] = rawList.map((item: any) => ({
                skuId: item.sku_id ?? item.skuId,
                productId: item.product_id ?? item.productId,
                productName: item.product_name ?? item.productName,
                category: item.category,
                currentStock: item.current_stock ?? item.currentStock,
                safetyStock: item.safety_stock ?? item.safetyStock,
                status: item.status,
            }));

            setInventoryList(formattedList);
        } catch (err: any) {
            console.error("[useInventory] fetchInventoryList 오류:", err);
            setError(err.message || "서버 통신 오류");
            setInventoryList([]); // 통신 실패 시 빈 배열로 안전하게 처리
        } finally {
            setLoading(false);
        }
    }, []);

    // [2] 감사 로그 서버 조회 (GET /api/inventory-items/logs)
    const fetchLogs = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/inventory-items/logs`);
            if (!response.ok) throw new Error("감사 로그를 불러오는데 실패했습니다.");

            const data = await response.json();

            // 수정: 백엔드 응답이 배열인지 확인 후 state 설정
            if (Array.isArray(data)) {
                setLogs(data);
            } else if (Array.isArray(data.data)) {
                setLogs(data.data);
            } else {
                console.error("[useInventory] logs 응답이 배열 형식이 아닙니다:", data);
                setLogs([]); // 배열이 아니면 빈 배열로 안전하게 설정
            }
        } catch (err: any) {
            console.error("[useInventory] fetchLogs 오류:", err);
            setLogs([]); // 에러 발생 시 빈 배열 처리
        }
    }, []);

    // [3.1] 신규 SKU 생성 및 초기 재고 등록 (POST /api/inventory-items)
    const createSku = async (newItem: {
        skuId: string;
        productId: string;
        productName: string;
        initialStock: number;
        safetyStock: number;
        category?: string;
    }) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/inventory-items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem),
            });

            if (!response.ok) throw new Error("SKU 생성에 실패했습니다.");

            // 성공 시 서버 최신 목록 재조회
            await fetchInventoryList();
        } catch (err: any) {
            console.error("[useInventory] createSku 오류:", err);
            alert(err.message || "SKU 생성 중 오류가 발생했습니다.");
        }
    };

    // [3.3] 어드민 재고 수동 조정 (POST /api/inventory-items/adjust)
    const adjustStock = async (
        skuId: string,
        deltaQty: number,
        reason: AdjustmentReason,
        memo: string,
        adminId?: string
    ) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return;
        }

        const activeAdminId = adminId || currentAdminId;

        try {
            const response = await fetch(`${API_BASE_URL}/api/inventory-items/adjust`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skuId,
                    adjustmentQty: deltaQty,
                    reasonType: reason,
                    reasonMemo: memo,
                    adminId: activeAdminId,
                }),
            });

            if (!response.ok) throw new Error("재고 수동 조정에 실패했습니다.");

            // 재고 및 감사로그 재조회
            await Promise.all([fetchInventoryList(), fetchLogs()]);
        } catch (err: any) {
            console.error("[useInventory] adjustStock 오류:", err);
            alert(err.message || "재고 조정 중 오류가 발생했습니다.");
        }
    };

    // [3.7] SKU 비활성화 / 활성화 (DELETE /api/inventory-items/:skuId)
    const toggleSkuStatus = async (skuId: string) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/inventory-items/${skuId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("SKU 상태 변경에 실패했습니다.");

            await fetchInventoryList();
        } catch (err: any) {
            console.error("[useInventory] toggleSkuStatus 오류:", err);
            alert(err.message || "상태 변경 중 오류가 발생했습니다.");
        }
    };

    // 마운트 시 초기 목록 및 로그 로드
    useEffect(() => {
        fetchInventoryList();
        fetchLogs();
    }, [fetchInventoryList, fetchLogs]);

    return {
        isAdmin,
        currentAdminId,
        inventoryList,
        logs,
        loading,
        error,
        fetchInventoryList,
        fetchLogs,
        createSku,
        adjustStock,
        toggleSkuStatus,
    };
}