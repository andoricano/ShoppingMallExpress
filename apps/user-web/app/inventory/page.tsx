"use client";

import React, { useState } from "react";
import { useAdminInventory } from "@/hooks/useAdminInventory";
import { InventoryHeader } from "@/component/inventory/InventoryHeader";
import { InventoryTabNavigation, InventoryTabType } from "@/component/inventory/InventoryTabNavigation";
import { InventorySearchToolbar } from "@/component/inventory/InventorySearchToolbar";
import { InventoryTable } from "@/component/inventory/InventoryTable";
import { InventoryAuditLogTable } from "@/component/inventory/InventoryAuditLogTable";
import { AddInventoryModal } from "@/component/inventory/AddInventoryModal";
import { AdjustStockModal } from "@/component/inventory/AdjustStockModal";

export default function AdminInventoryPage() {
    const {
        inventoryList,
        logs,
        loading,
        error,
        fetchInventoryList,
        createProductInventory,
        adjustStock,
        toggleSkuStatus,
    } = useAdminInventory();

    const [activeTab, setActiveTab] = useState<InventoryTabType>("inventory");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [adjustTargetSku, setAdjustTargetSku] = useState<{ skuId: string; currentQty: number } | null>(null);

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
                        onToggleSkuStatus={toggleSkuStatus}
                    />
                </>
            ) : (
                <InventoryAuditLogTable logs={logs} isLoading={loading} />
            )}

            {/* 5. 모달 영역 */}
            <AddInventoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={createProductInventory}
            />

            <AdjustStockModal
                isOpen={!!adjustTargetSku}
                skuId={adjustTargetSku?.skuId || ""}
                currentQty={adjustTargetSku?.currentQty || 0}
                onClose={() => setAdjustTargetSku(null)}
                onSubmit={adjustStock}
            />
        </div>
    );
}