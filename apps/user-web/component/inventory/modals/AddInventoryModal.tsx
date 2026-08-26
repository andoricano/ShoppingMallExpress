"use client";

import React, { useMemo } from "react";
import { InventoryItem } from "@mall/types";
import { useAddInventoryForm } from "./useAddInventoryForm";
import { ModalLabelInput } from "@/component/modal/ModalLabelInput";
import { ModalFrame } from "@/component/modal/ModalFrame";
import { ModalSelectOrInput } from "./ModalSelectOrInput";
import { SkuTableForm } from "./SkuTableForm";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryItem) => Promise<void>;
  categories?: string[];
}

const DEFAULT_CATEGORIES = ["SHOES", "CLOTHES", "ACC", "EQUIPMENT", "ELECTRONICS"];

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories = DEFAULT_CATEGORIES,
}) => {
  const memoizedCategories = useMemo(
    () => (categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES),
    [categories]
  );

  const { state, actions } = useAddInventoryForm({
    isOpen,
    categories: memoizedCategories,
    onSubmit,
    onClose,
  });

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="신규 재고 아이템 등록"
      description="재고 그룹 및 세부 SKU 옵션을 등록합니다."
      maxWidth="4xl"
      onSubmit={actions.handleSubmit}
      submitText="재고 등록 완료"
      cancelText="취소"
      isSubmitting={state.isSubmitting}
    >
      {/* ModalFrame 버튼을 사용할 경우 form의 onSubmit 제거 */}
      <form className="space-y-6">
        {/* 그룹 기본 정보 */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModalLabelInput
              label="재고 그룹 식별자 (ID)"
              value={state.id}
              onChange={actions.setId}
              placeholder="예: INV-SHOE-01"
              required
              disabled={state.isSubmitting}
            />

            <ModalSelectOrInput
              label="카테고리"
              options={memoizedCategories}
              value={state.category}
              onChange={actions.setCategory}
              placeholder="카테고리명 직접 입력"
              disabled={state.isSubmitting}
            />

            <div className="md:col-span-2">
              <ModalLabelInput
                label="아이템명"
                value={state.name}
                onChange={actions.setName}
                placeholder="예: 나이키 에어 포스 1"
                required
                disabled={state.isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* SKU 옵션 정보 */}
        <SkuTableForm
          skus={state.skus}
          baseGroupId={state.id}
          disabled={state.isSubmitting}
          onAddRow={actions.handleAddSkuRow}
          onRemoveRow={actions.handleRemoveSkuRow}
          onChangeRow={actions.handleSkuChange}
        />
      </form>
    </ModalFrame>
  );
};