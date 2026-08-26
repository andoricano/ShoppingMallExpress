"use client";

import React, { useState, useEffect } from "react";
import { AdjustmentReason } from "@mall/types";
import { ModalFrame } from "../modal/ModalFrame";
import { SummaryCard } from "../common/SummaryCard";
import { StockQtyInput } from "../modal/StockQtyInput";
import { OptionSelect } from "../common/OptionSelect";
import { ModalLabelInput } from "../modal/ModalLabelInput";

interface AdjustStockModalProps {
  isOpen: boolean;
  skuId: string;
  optionName?: string;
  currentQty: number;
  adminId?: string;
  onClose: () => void;
  onSubmit: (
    skuId: string,
    deltaQty: number,
    reason: AdjustmentReason,
    memo: string,
    adminId?: string
  ) => Promise<void>;
}

const REASON_OPTIONS: { value: AdjustmentReason; label: string; description: string }[] = [
  { value: "INCOMING", label: "신규 입고 (INCOMING)", description: "물류 센터 입고 및 수량 추가" },
  { value: "AUDIT", label: "재고 조사 (AUDIT)", description: "실재고 실사 후 오차 수정" },
  { value: "DAMAGED", label: "파손/손실 (DAMAGED)", description: "상품 파손, 분실, 불량 처리" },
  { value: "OTHER", label: "기타 (OTHER)", description: "기타 관리자 수동 조정" },
];

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  skuId,
  optionName,
  currentQty,
  adminId = "ADMIN-SYSTEM",
  onClose,
  onSubmit,
}) => {
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<AdjustmentReason>("AUDIT");
  const [adjustMemo, setAdjustMemo] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState(adminId);
  const [submitting, setSubmitting] = useState(false);

  // 모달 열림 / 대상 SKU 변경 시 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setAdjustQty(0);
      setAdjustReason("AUDIT");
      setAdjustMemo("");
      setCurrentAdminId(adminId);
    }
  }, [isOpen, skuId, adminId]);

  // 제출 시 유효성 검증용
  const isNegativeStock = currentQty + adjustQty < 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (adjustQty === 0) {
      alert("변동 수량을 입력해주세요. (0개 조정은 불가능합니다.)");
      return;
    }

    if (isNegativeStock) {
      alert("조정 후 재고 수량은 0개 이상이어야 합니다.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(skuId, adjustQty, adjustReason, adjustMemo.trim(), currentAdminId);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "재고 조정 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="어드민 수동 재고 조정"
      description="실시간 실재고 증감 및 감사 로그 사유를 등록합니다."
      maxWidth="md"
      onSubmit={handleSubmit}
      submitText="조정 적용 완료"
      cancelText="취소"
      isSubmitting={submitting}
      isSubmitDisabled={isNegativeStock || adjustQty === 0}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SKU 및 현재 재고 요약 카드 */}
        <SummaryCard
          items={[
            { label: "대상 SKU ID", value: skuId, isMono: true },
            ...(optionName ? [{ label: "옵션명", value: optionName }] : []),
            { label: "현재 실재고", value: `${currentQty} 개`, isHighlighted: true },
          ]}
        />

        {/* 변동 수량 입력 및 빠른 버튼 */}
        <StockQtyInput
          value={adjustQty}
          currentQty={currentQty}
          onChange={setAdjustQty}
          disabled={submitting}
        />

        {/* 조정 사유 선택 */}
        <OptionSelect<AdjustmentReason>
          label="조정 사유"
          required
          value={adjustReason}
          options={REASON_OPTIONS}
          onChange={setAdjustReason}
          disabled={submitting}
        />

        {/* 사유 메모 */}
        <ModalLabelInput
          label="어드민 사유 메모 (선택)"
          value={adjustMemo}
          onChange={setAdjustMemo}
          placeholder="예: 실사 결과 2개 파손 확인되어 차감 처리함"
          disabled={submitting}
          multiline={true}
          rows={2}
        />

        {/* 담당 어드민 ID */}
        <ModalLabelInput
          label="담당 어드민 계정 ID"
          value={currentAdminId}
          onChange={setCurrentAdminId}
          disabled={submitting}
          multiline={false}
        />
      </form>
    </ModalFrame>
  );
};