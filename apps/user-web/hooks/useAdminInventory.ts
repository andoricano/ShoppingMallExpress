"use client";

import { useAdminAuthStore } from "@/store/useAdminAuth";
import {
    AdjustmentReason,
    InventoryFilterParams,
    InventoryItem,
    InventoryLog,
    SkuInventory,
} from "@mall/types";
import { useCallback, useEffect, useState } from "react";

const INITIAL_MOCK_INVENTORY: InventoryItem[] = [
    {
        productId: "PROD-SHOE-01",
        productName: "나이키 에어 포스 1",
        category: "SHOES",
        totalStock: 35,
        skus: [
            { skuId: "SHOE-01-250", optionName: "250", currentStock: 10, safetyStock: 3, status: "IN_STOCK" },
            { skuId: "SHOE-01-255", optionName: "255", currentStock: 2, safetyStock: 5, status: "LOW_STOCK" },
            { skuId: "SHOE-01-260", optionName: "260", currentStock: 23, safetyStock: 5, status: "IN_STOCK" },
            { skuId: "SHOE-01-265", optionName: "265", currentStock: 0, safetyStock: 3, status: "SOLD_OUT" },
        ],
    },
    {
        productId: "PROD-TOP-01",
        productName: "오버핏 후드 티셔츠",
        category: "CLOTHES",
        totalStock: 50,
        skus: [
            { skuId: "TOP-01-M", optionName: "M", currentStock: 20, safetyStock: 5, status: "IN_STOCK" },
            { skuId: "TOP-01-L", optionName: "L", currentStock: 30, safetyStock: 5, status: "IN_STOCK" },
            { skuId: "TOP-01-XL", optionName: "XL", currentStock: 0, safetyStock: 2, status: "DISABLED" },
        ],
    },
];

const INITIAL_MOCK_LOGS: InventoryLog[] = [
    {
        id: "LOG-001",
        timestamp: new Date().toISOString(),
        skuId: "SHOE-01-255",
        optionName: "255",
        beforeQty: 5,
        afterQty: 2,
        changeType: "ADMIN_ADJUST",
        reasonType: "AUDIT",
        adminId: "admin-01",
        reasonMemo: "실사용 재고 조사 반영",
    },
];

export function useAdminInventory() {
    const { user } = useAdminAuthStore();

    const isAdmin = user?.role === "ADMIN";
    const currentAdminId = user?.id || "admin-default";

    const [inventoryList, setInventoryList] = useState<InventoryItem[]>(INITIAL_MOCK_INVENTORY);
    const [logs, setLogs] = useState<InventoryLog[]>(INITIAL_MOCK_LOGS);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 재고 목록 필터링 조회 (Mock)
    const fetchInventoryList = useCallback(async (params?: InventoryFilterParams) => {
        setLoading(true);
        setError(null);

        try {
            // 네트워크 지연 모사 (200ms)
            await new Promise((resolve) => setTimeout(resolve, 200));

            let filtered = [...inventoryList];

            if (params?.searchQuery) {
                const q = params.searchQuery.toLowerCase();
                filtered = filtered.filter(
                    (item) =>
                        item.productName.toLowerCase().includes(q) ||
                        item.productId.toLowerCase().includes(q) ||
                        item.skus.some((sku) => sku.skuId.toLowerCase().includes(q))
                );
            }

            if (params?.category) {
                filtered = filtered.filter((item) => item.category === params.category);
            }

            if (params?.status) {
                filtered = filtered.filter((item) =>
                    item.skus.some((sku) => sku.status === params.status)
                );
            }

            setInventoryList(filtered);
        } catch (err: any) {
            setError("재고 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [inventoryList]);

    // [2] 감사 로그 조회 (Mock)
    const fetchLogs = useCallback(async () => {
        setLogs([...logs]);
    }, [logs]);

    // [3] 상품 및 SKU 신규 등록 (Mock)
    const createProductInventory = async (data: {
        productId: string;
        productName: string;
        category: string;
        skus: {
            skuId: string;
            optionName: string;
            initialStock: number;
            safetyStock: number;
        }[];
    }) => {
        if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");

        const formattedSkus: SkuInventory[] = data.skus.map((sku, idx) => {
            const currentStock = Number(sku.initialStock) || 0;
            const safetyStock = Number(sku.safetyStock) || 0;
            let status: SkuInventory["status"] = "IN_STOCK";

            if (currentStock === 0) status = "SOLD_OUT";
            else if (currentStock <= safetyStock) status = "LOW_STOCK";

            return {
                skuId: sku.skuId || `${data.productId}-${sku.optionName || idx}`,
                optionName: sku.optionName || "FREE",
                currentStock,
                safetyStock,
                status,
            };
        });

        const totalStock = formattedSkus.reduce((acc, curr) => acc + curr.currentStock, 0);

        const newItem: InventoryItem = {
            productId: data.productId,
            productName: data.productName,
            category: data.category,
            totalStock,
            skus: formattedSkus,
        };

        setInventoryList((prev) => [newItem, ...prev]);
    };

    // [4] 특정 SKU 수동 재고 조정 (Mock)
    const adjustStock = async (
        skuId: string,
        deltaQty: number,
        reason: AdjustmentReason,
        memo: string,
        adminId?: string
    ) => {
        if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");

        let targetSku: SkuInventory | null = null;
        let beforeQty = 0;
        let afterQty = 0;

        setInventoryList((prevList) =>
            prevList.map((product) => {
                const hasSku = product.skus.some((s) => s.skuId === skuId);
                if (!hasSku) return product;

                const updatedSkus = product.skus.map((sku) => {
                    if (sku.skuId !== skuId) return sku;

                    targetSku = sku;
                    beforeQty = sku.currentStock;
                    afterQty = Math.max(0, beforeQty + deltaQty);

                    let status = sku.status;
                    if (status !== "DISABLED") {
                        if (afterQty === 0) status = "SOLD_OUT";
                        else if (afterQty <= sku.safetyStock) status = "LOW_STOCK";
                        else status = "IN_STOCK";
                    }

                    return { ...sku, currentStock: afterQty, status };
                });

                const totalStock = updatedSkus.reduce((acc, curr) => acc + curr.currentStock, 0);
                return { ...product, totalStock, skus: updatedSkus };
            })
        );

        if (targetSku) {
            const newLog: InventoryLog = {
                id: `LOG-${Date.now()}`,
                timestamp: new Date().toISOString(),
                skuId,
                optionName: (targetSku as SkuInventory).optionName,
                beforeQty,
                afterQty,
                changeType: "ADMIN_ADJUST",
                reasonType: reason,
                adminId: adminId || currentAdminId,
                reasonMemo: memo,
            };
            setLogs((prev) => [newLog, ...prev]);
        }
    };

    // [5] 특정 SKU 활성화 / 비활성화 토글 (Mock)
    const toggleSkuStatus = async (skuId: string) => {
        if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");

        setInventoryList((prevList) =>
            prevList.map((product) => ({
                ...product,
                skus: product.skus.map((sku) => {
                    if (sku.skuId !== skuId) return sku;

                    let newStatus: SkuInventory["status"] = "IN_STOCK";
                    if (sku.status === "DISABLED") {
                        if (sku.currentStock === 0) newStatus = "SOLD_OUT";
                        else if (sku.currentStock <= sku.safetyStock) newStatus = "LOW_STOCK";
                        else newStatus = "IN_STOCK";
                    } else {
                        newStatus = "DISABLED";
                    }

                    return { ...sku, status: newStatus };
                }),
            }))
        );
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
        createProductInventory,
        adjustStock,
        toggleSkuStatus,
    };
}