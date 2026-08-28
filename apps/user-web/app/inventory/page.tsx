"use client";

import React, { useEffect, useState } from "react";
import { useAdminInventory } from "@/hooks/useAdminInventory";
import { InventoryHeader } from "@/component/inventory/InventoryHeader";
import { InventorySearchToolbar } from "@/component/inventory/InventorySearchToolbar";
import { InventoryTable } from "@/component/inventory/InventoryTable";
import { AddInventoryModal } from "@/component/inventory/modals/AddInventoryModal";
import { AdjustStockModal } from "@/component/inventory/modals/AdjustStockModal";
import type { SkuInventory } from "@mall/types";

interface AdjustTarget {
  skuId: string;
  currentQty: number;
}

export default function AdminInventoryPage() {
  const {
    inventoryList,
    loading,
    error,
    fetchInventoryList,
    createInventoryItem,
    adjustStock,
    toggleInventoryStatus,
  } = useAdminInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustTargetSku, setAdjustTargetSku] =
    useState<AdjustTarget | null>(null);

  // 초기 재고 목록 조회
  useEffect(() => {
    fetchInventoryList();
  }, [fetchInventoryList]);

  // 신규 재고 등록
  const handleCreateInventory = async (
    data: Omit<SkuInventory, "id">
  ) => {
    await createInventoryItem(data);
    setIsAddModalOpen(false);
  };

  // 재고 수동 조정
  const handleAdjustStock = async (
    skuId: string,
    adjustmentQty: number
  ) => {
    await adjustStock(skuId, adjustmentQty);
    setAdjustTargetSku(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <InventoryHeader
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in">
            <span className="font-semibold">⚠️ 오류 발생:</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <InventorySearchToolbar
            onRefresh={fetchInventoryList}
          />

          <InventoryTable
            items={inventoryList}
            isLoading={loading}
            onAdjustStock={(skuId, currentQty) =>
              setAdjustTargetSku({
                skuId,
                currentQty,
              })
            }
            onToggleStatus={toggleInventoryStatus}
          />
        </div>

        <AddInventoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateInventory}
        />

        <AdjustStockModal
          isOpen={!!adjustTargetSku}
          skuId={adjustTargetSku?.skuId ?? ""}
          currentQty={adjustTargetSku?.currentQty ?? 0}
          onClose={() => setAdjustTargetSku(null)}
          onSubmit={handleAdjustStock}
        />
      </div>
    </div>
  );
}