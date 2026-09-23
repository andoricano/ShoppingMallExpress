"use client";

import React, { useEffect, useState } from "react";
import {
  useAdminWare,
  type CreateWareInput,
  type UpdateWareInput,
} from "@/hooks/useAdminInventory";
import { InventoryHeader } from "@/component/inventory/InventoryHeader";
import { InventorySearchToolbar } from "@/component/inventory/InventorySearchToolbar";
import { InventoryTable } from "@/component/inventory/InventoryTable";
import { AddInventoryModal } from "@/component/inventory/modals/AddInventoryModal";
import { EditInventoryModal } from "@/component/inventory/modals/EditInventoryModal";
import { AdjustStockModal } from "@/component/inventory/modals/AdjustStockModal";
import type { Ware } from "@mall/types";

interface AdjustTarget {
  wareId: string;
  currentQty: number;
}

export default function AdminInventoryPage() {
  const {
    wareList,
    warehouseList,
    loading,
    error,
    fetchWareList,
    fetchWarehouseList,
    createWare,
    updateWare,
    adjustWareStock,
  } = useAdminWare();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ware | null>(null);
  const [adjustTargetSku, setAdjustTargetSku] =
    useState<AdjustTarget | null>(null);

  // 초기 재고 목록 조회
  useEffect(() => {
    void fetchWareList();
    void fetchWarehouseList();
  }, [fetchWareList, fetchWarehouseList]);

  // 신규 재고 등록
  const handleCreateWare = async (
    data: CreateWareInput
  ) => {
    await createWare(data);
    setIsAddModalOpen(false);
  };

  // 재고 정보 수정
  const handleUpdateWare = async (
    id: string,
    payload: UpdateWareInput
  ) => {
    await updateWare(id, payload);
    setEditTarget(null);
  };

  // 재고 수량 조정
  const handleAdjustStock = async (
    wareId: string,
    adjustmentQty: number
  ) => {
    await adjustWareStock(wareId, adjustmentQty);
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
            onSearch={fetchWareList}
            onReset={fetchWareList}
          />

          <InventoryTable
            items={wareList}
            isLoading={loading}
            onEdit={setEditTarget}
            onEditStock={(inventory) =>
              setAdjustTargetSku({
                wareId: inventory.id,
                currentQty: inventory.currentStock,
              })
            }
            onToggleStatus={(wareId) => {
              const ware = wareList.find((item) => item.id === wareId);
              if (ware) {
                void updateWare(wareId, { isActive: !ware.isActive });
              }
            }}
          />
        </div>

        <AddInventoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          warehouses={warehouseList}
          onSubmit={handleCreateWare}
        />

        <EditInventoryModal
          isOpen={!!editTarget}
          ware={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdateWare}
        />

        <AdjustStockModal
          isOpen={!!adjustTargetSku}
          wareId={adjustTargetSku?.wareId ?? ""}
          currentQty={adjustTargetSku?.currentQty ?? 0}
          onClose={() => setAdjustTargetSku(null)}
          onSubmit={handleAdjustStock}
        />
      </div>
    </div>
  );
}
