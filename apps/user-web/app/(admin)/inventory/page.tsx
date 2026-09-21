"use client";

import React, { useEffect, useState } from "react";
import { useAdminInventory } from "@/hooks/useAdminInventory";
import { InventoryHeader } from "@/component/inventory/InventoryHeader";
import { InventorySearchToolbar } from "@/component/inventory/InventorySearchToolbar";
import { InventoryTable } from "@/component/inventory/InventoryTable";
import { AddInventoryModal } from "@/component/inventory/modals/AddInventoryModal";
import { EditInventoryModal } from "@/component/inventory/modals/EditInventoryModal";
import { AdjustStockModal } from "@/component/inventory/modals/AdjustStockModal";
import type {
  CreateInventoryInput,
  SkuInventory,
} from "@mall/types";

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
    updateInventoryItem,
    adjustStock,
    toggleInventoryStatus,
    deleteInventoryItem,
  } = useAdminInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SkuInventory | null>(null);
  const [adjustTargetSku, setAdjustTargetSku] =
    useState<AdjustTarget | null>(null);

  // 초기 재고 목록 조회
  useEffect(() => {
    fetchInventoryList();
  }, [fetchInventoryList]);

  // 신규 재고 등록
  const handleCreateInventory = async (
    data: CreateInventoryInput
  ) => {
    await createInventoryItem(data);
    setIsAddModalOpen(false);
  };

  // 재고 정보 수정
  const handleUpdateInventory = async (
    id: string,
    payload: {
      skuCode: string;
      isActive: boolean;
      meta?: Record<string, unknown>;
    }
  ) => {
    await updateInventoryItem(id, payload);
    setEditTarget(null);
  };

  // 재고 수량 조정
  const handleAdjustStock = async (
    skuId: string,
    adjustmentQty: number
  ) => {
    await adjustStock(skuId, adjustmentQty);
    setAdjustTargetSku(null);
  };

  // 재고 삭제
  const handleDeleteInventory = async (id: string) => {
    const confirmed = window.confirm(
      "비활성화된 재고를 삭제하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    await deleteInventoryItem(id);
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
            onSearch={fetchInventoryList}
            onReset={fetchInventoryList}
          />

          <InventoryTable
            items={inventoryList}
            isLoading={loading}
            onEdit={setEditTarget}
            onEditStock={(inventory) =>
              setAdjustTargetSku({
                skuId: inventory.id,
                currentQty: inventory.currentStock,
              })
            }
            onToggleStatus={toggleInventoryStatus}
            onDelete={handleDeleteInventory}
          />
        </div>

        <AddInventoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateInventory}
        />

        <EditInventoryModal
          isOpen={!!editTarget}
          inventory={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdateInventory}
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
