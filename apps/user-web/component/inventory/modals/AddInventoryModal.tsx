"use client";

import React from "react";
import type { Warehouse } from "@mall/types";
import type { CreateWareInput } from "@/hooks/useAdminInventory";
import { ModalLabelInput } from "@/component/modal/ModalLabelInput";
import { ModalFrame } from "@/component/modal/ModalFrame";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  onSubmit: (data: CreateWareInput) => Promise<void>;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  onSubmit,
}) => {
  const [warehouseId, setWarehouseId] = React.useState("");
  const [name, setName] = React.useState("");
  const [wareCode, setWareCode] = React.useState("");
  const [currentStock, setCurrentStock] = React.useState("0");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const trimmedName = name.trim();
    const stock = Number(currentStock);

    if (!warehouseId || !trimmedName) {
      setError("Warehouse와 Ware 이름을 입력해주세요.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("재고 수량은 0 이상의 정수여야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        warehouseId,
        name: trimmedName,
        wareCode: wareCode.trim() || undefined,
        currentStock: stock,
      });

      setWarehouseId("");
      setName("");
      setWareCode("");
      setCurrentStock("0");
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "재고 등록에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="신규 Ware 등록"
      description="Warehouse에 독립 재고 단위를 등록합니다."
      maxWidth="md"
      onSubmit={handleSubmit}
      submitText="재고 등록"
      cancelText="취소"
      isSubmitting={isSubmitting}
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        <ModalLabelInput
          label="Ware 이름"
          value={name}
          onChange={setName}
          placeholder="예: Black M 재고"
          required
          disabled={isSubmitting}
          multiline={false}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">
            Warehouse <span className="text-rose-500">*</span>
          </label>
          <select
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Warehouse 선택</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <ModalLabelInput
          label="Ware 코드"
          value={wareCode}
          onChange={setWareCode}
          placeholder="예: NIKE-W-250-BLK"
          disabled={isSubmitting}
          multiline={false}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">
            현재 재고 수량 <span className="text-rose-500">*</span>
          </label>

          <input
            type="number"
            min={0}
            step={1}
            value={currentStock}
            onChange={(e) => setCurrentStock(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>
      </div>
    </ModalFrame>
  );
};
