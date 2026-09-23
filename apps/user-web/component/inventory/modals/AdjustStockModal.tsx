"use client";

import React, { useEffect, useState } from "react";
import { ModalFrame } from "../../modal/ModalFrame";
import { SummaryCard } from "../../common/SummaryCard";
import { StockQtyInput } from "../../modal/StockQtyInput";

interface AdjustStockModalProps {
  isOpen: boolean;
  wareId: string;
  currentQty: number;
  onClose: () => void;
  onSubmit: (
    wareId: string,
    adjustmentQty: number
  ) => Promise<void>;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  wareId,
  currentQty,
  onClose,
  onSubmit,
}) => {
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAdjustQty(0);
    }
  }, [isOpen, wareId]);

  const isNegativeStock = currentQty + adjustQty < 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (adjustQty === 0) {
      alert("변동 수량을 입력해주세요.");
      return;
    }

    if (isNegativeStock) {
      alert("조정 후 재고 수량은 0개 이상이어야 합니다.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(wareId, adjustQty);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "재고 조정 중 오류가 발생했습니다.";

      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="재고 수동 조정"
      description="선택한 Ware의 재고 수량을 조정합니다."
      maxWidth="md"
      onSubmit={handleSubmit}
      submitText="조정 적용"
      cancelText="취소"
      isSubmitting={submitting}
      isSubmitDisabled={isNegativeStock || adjustQty === 0}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <SummaryCard
          items={[
            {
              label: "대상 Ware",
              value: wareId,
              isMono: true,
            },
            {
              label: "현재 재고",
              value: `${currentQty} 개`,
              isHighlighted: true,
            },
            {
              label: "조정 후 재고",
              value: `${currentQty + adjustQty} 개`,
            },
          ]}
        />

        <StockQtyInput
          value={adjustQty}
          currentQty={currentQty}
          onChange={setAdjustQty}
          disabled={submitting}
        />
      </form>
    </ModalFrame>
  );
};
