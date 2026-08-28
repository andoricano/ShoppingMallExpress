"use client";

import React, { useEffect, useState } from "react";
import type { SkuInventory } from "@mall/types";
import { ModalFrame } from "../../modal/ModalFrame";
import { ModalLabelInput } from "../../modal/ModalLabelInput";

interface EditInventoryModalProps {
  isOpen: boolean;
  inventory: SkuInventory | null;
  onClose: () => void;
  onSubmit: (
    id: string,
    payload: {
      skuCode: string;
      isActive: boolean;
      meta?: Record<string, unknown>;
    }
  ) => Promise<void>;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  inventory,
  onClose,
  onSubmit,
}) => {
  const [skuCode, setSkuCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [meta, setMeta] = useState("{}");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !inventory) {
      return;
    }

    setSkuCode(inventory.skuCode);
    setIsActive(inventory.isActive);
    setMeta(
      inventory.meta
        ? JSON.stringify(inventory.meta, null, 2)
        : "{}"
    );
    setError(null);
  }, [isOpen, inventory]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inventory) {
      return;
    }

    setError(null);

    const trimmedSkuCode = skuCode.trim();

    if (!trimmedSkuCode) {
      setError("SKU 코드를 입력해주세요.");
      return;
    }

    let parsedMeta: Record<string, unknown> | undefined;

    if (meta.trim()) {
      try {
        const parsed = JSON.parse(meta);

        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          throw new Error();
        }

        parsedMeta = parsed;
      } catch {
        setError("메타 정보는 올바른 JSON 형식이어야 합니다.");
        return;
      }
    }

    try {
      setSubmitting(true);

      await onSubmit(inventory.id, {
        skuCode: trimmedSkuCode,
        isActive,
        meta: parsedMeta,
      });

      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "재고 수정에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="재고 정보 수정"
      description="SKU 코드, 메타 정보 및 활성 상태를 수정합니다."
      maxWidth="md"
      onSubmit={handleSubmit}
      submitText="수정 적용"
      cancelText="취소"
      isSubmitting={submitting}
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">
            재고 ID
          </label>

          <input
            type="text"
            value={inventory?.id ?? ""}
            disabled
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-400"
          />
        </div>

        <ModalLabelInput
          label="SKU 코드"
          value={skuCode}
          onChange={setSkuCode}
          placeholder="예: NIKE-W-250-BLK"
          required
          disabled={submitting}
          multiline={false}
        />

        <ModalLabelInput
          label="메타 정보"
          value={meta}
          onChange={setMeta}
          placeholder='예: {"size": 250, "color": "black"}'
          disabled={submitting}
          multiline
          rows={5}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={submitting}
          />
          재고 활성화
        </label>
      </div>
    </ModalFrame>
  );
};