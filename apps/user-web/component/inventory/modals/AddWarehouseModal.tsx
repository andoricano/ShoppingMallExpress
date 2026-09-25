"use client";

import React from "react";
import type { CreateWarehouseInput } from "@/hooks/useAdminInventory";
import { ModalLabelInput } from "@/component/modal/ModalLabelInput";
import { ModalFrame } from "@/component/modal/ModalFrame";

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
}

export const AddWarehouseModal: React.FC<AddWarehouseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Warehouse 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      });

      setName("");
      setCode("");
      setDescription("");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Warehouse 등록에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Warehouse 등록"
      description="Ware가 속할 재고 공간을 등록합니다."
      maxWidth="md"
      onSubmit={handleSubmit}
      submitText="Warehouse 등록"
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
          label="Warehouse 이름"
          value={name}
          onChange={setName}
          placeholder="예: 본사 창고"
          required
          disabled={isSubmitting}
          multiline={false}
        />

        <ModalLabelInput
          label="Warehouse 코드"
          value={code}
          onChange={setCode}
          placeholder="예: WH-MAIN"
          disabled={isSubmitting}
          multiline={false}
        />

        <ModalLabelInput
          label="설명"
          value={description}
          onChange={setDescription}
          placeholder="선택 사항"
          disabled={isSubmitting}
          multiline={false}
        />
      </div>
    </ModalFrame>
  );
};
