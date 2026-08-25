"use client";

import React, { useEffect, useState } from "react";
import { useAdminInventory } from "@/hooks/useAdminInventory";
import { InventoryHeader } from "@/component/inventory/InventoryHeader";
import { InventoryTabNavigation, InventoryTabType } from "@/component/inventory/InventoryTabNavigation";
import { InventorySearchToolbar } from "@/component/inventory/InventorySearchToolbar";
import { InventoryTable } from "@/component/inventory/InventoryTable";
import { InventoryAuditLogTable } from "@/component/inventory/InventoryAuditLogTable";
import { AddInventoryModal } from "@/component/inventory/AddInventoryModal";
import { AdjustStockModal } from "@/component/inventory/AdjustStockModal";
import { InventoryItem, AdjustmentReason, StockStatus } from "@mall/types";

export default function AdminInventoryPage() {
    const {
        inventoryList,
        logs,
        loading,
        error,
        fetchInventoryList,
        fetchLogs,
        createInventoryItem,
        adjustStock,
        updateSkuStatus,
    } = useAdminInventory();

    const [activeTab, setActiveTab] = useState<InventoryTabType>("inventory");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [adjustTargetSku, setAdjustTargetSku] = useState<{ skuId: string; currentQty: number } | null>(null);

    // 1. 페이지 초기 로딩 및 탭 전환 시 자동 데이터 조회
    useEffect(() => {
        if (activeTab === "inventory") {
            fetchInventoryList();
        } else if (activeTab === "logs") {
            fetchLogs();
        }
    }, [activeTab, fetchInventoryList, fetchLogs]);

    const handleCreateInventory = async (data: InventoryItem) => {
        await createInventoryItem(data);
        setIsAddModalOpen(false);
    };

    // 3. 재고 수동 조정 제출 핸들러
    const handleAdjustStock = async (
        skuId: string,
        adjustmentQty: number,
        reasonType: AdjustmentReason,
        reasonMemo?: string
    ) => {
        await adjustStock({
            skuId,
            adjustmentQty,
            reasonType,
            reasonMemo,
            adminId: "ADMIN", // adminId 필수값 누락 방지
        });
        setAdjustTargetSku(null);
    };

    return (
        <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto", fontFamily: "sans-serif" }}>
            {/* 1. 상단 헤더 */}
            <InventoryHeader onOpenAddModal={() => setIsAddModalOpen(true)} />

            {/* 2. 탭 메인 메뉴 */}
            <InventoryTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* 3. 에러 표시 */}
            {error && (
                <div style={{ padding: "12px 16px", backgroundColor: "#ffe3e3", color: "#e03131", borderRadius: "6px", marginBottom: "16px" }}>
                    {error}
                </div>
            )}

            {/* 4. 탭별 콘텐츠 */}
            {activeTab === "inventory" ? (
                <>
                    <InventorySearchToolbar
                        onSearch={(params) => fetchInventoryList(params)}
                        onReset={() => fetchInventoryList()}
                    />
                    <InventoryTable
                        items={inventoryList}
                        isLoading={loading}
                        onAdjustStock={(skuId, currentQty) => setAdjustTargetSku({ skuId, currentQty })}
                        onUpdateSkuStatus={(skuId, status: StockStatus) => updateSkuStatus(skuId, status)}
                    />
                </>
            ) : (
                <InventoryAuditLogTable logs={logs} isLoading={loading} />
            )}

            {/* 5. 모달 영역 */}
            <AddInventoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateInventory}
            />

            <AdjustStockModal
                isOpen={!!adjustTargetSku}
                skuId={adjustTargetSku?.skuId || ""}
                currentQty={adjustTargetSku?.currentQty || 0}
                onClose={() => setAdjustTargetSku(null)}
                onSubmit={handleAdjustStock}
            />
        </div>
    );
}