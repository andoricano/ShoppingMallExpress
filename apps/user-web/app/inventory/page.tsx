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
import { InventoryItem, AdjustmentReason } from "@mall/types";

interface AdjustTarget {
  skuId: string;
  optionName?: string;
  currentQty: number;
}

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
    toggleSkuStatus, // 💡 updateSkuStatus 대신 toggleSkuStatus 사용
  } = useAdminInventory();

  const [activeTab, setActiveTab] = useState<InventoryTabType>("inventory");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustTargetSku, setAdjustTargetSku] = useState<AdjustTarget | null>(null);

  // 1. 탭 전환 및 초기 데이터 로딩
  useEffect(() => {
    if (activeTab === "inventory") {
      fetchInventoryList();
    } else if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, fetchInventoryList, fetchLogs]);

  // 2. 신규 재고 그룹/SKU 등록
  const handleCreateInventory = async (data: InventoryItem) => {
    await createInventoryItem(data);
    setIsAddModalOpen(false);
  };

  // 3. 재고 수동 조정
  const handleAdjustStock = async (
    skuId: string,
    adjustmentQty: number,
    reasonType: AdjustmentReason,
    reasonMemo: string,
    adminId?: string
  ) => {
    await adjustStock({
      skuId,
      adjustmentQty,
      reasonType,
      reasonMemo,
      adminId: adminId || "ADMIN",
    });
    setAdjustTargetSku(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 헤더 */}
        <InventoryHeader onOpenAddModal={() => setIsAddModalOpen(true)} />

        {/* 탭 메인 메뉴 */}
        <InventoryTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 에러 피드백 배너 */}
        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in">
            <span className="font-semibold">⚠️ 오류 발생:</span>
            <span>{error}</span>
          </div>
        )}

        {/* 탭별 메인 콘텐츠 */}
        {activeTab === "inventory" ? (
          <div className="space-y-4">
            <InventorySearchToolbar
              onSearch={(params) => fetchInventoryList(params)}
              onReset={() => fetchInventoryList()}
            />
            <InventoryTable
              items={inventoryList}
              isLoading={loading}
              onAdjustStock={(skuId, currentQty, optionName) =>
                setAdjustTargetSku({ skuId, currentQty, optionName })
              }
              onUpdateSkuStatus={(skuId) => toggleSkuStatus(skuId)}
            />
          </div>
        ) : (
          <InventoryAuditLogTable logs={logs} isLoading={loading} />
        )}

        {/* 모달 레이어 */}
        <AddInventoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateInventory}
        />

        <AdjustStockModal
          isOpen={!!adjustTargetSku}
          skuId={adjustTargetSku?.skuId || ""}
          optionName={adjustTargetSku?.optionName}
          currentQty={adjustTargetSku?.currentQty || 0}
          onClose={() => setAdjustTargetSku(null)}
          onSubmit={handleAdjustStock}
        />
      </div>
    </div>
  );
}