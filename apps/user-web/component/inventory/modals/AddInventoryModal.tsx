"use client";

import React from "react";
import type { CreateInventoryInput } from "@mall/types";
import { ModalLabelInput } from "@/component/modal/ModalLabelInput";
import { ModalFrame } from "@/component/modal/ModalFrame";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventoryInput) => Promise<void>;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [skuCode, setSkuCode] = React.useState("");
  const [currentStock, setCurrentStock] = React.useState("0");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const trimmedSkuCode = skuCode.trim();
    const stock = Number(currentStock);

    if (!trimmedSkuCode) {
      setError("SKU 코드를 입력해주세요.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("재고 수량은 0 이상의 정수여야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        skuCode: trimmedSkuCode,
        currentStock: stock,
        isActive: true,
      });

      setSkuCode("");
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
      title="신규 SKU 재고 등록"
      description="SKU의 기본 재고 정보를 등록합니다."
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
          label="SKU 코드"
          value={skuCode}
          onChange={setSkuCode}
          placeholder="예: NIKE-W-250-BLK"
          required
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
