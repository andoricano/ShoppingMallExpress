"use client";

import React, { useEffect, useState } from "react";
import type { Ware } from "@mall/types";
import type { UpdateWareInput } from "@/hooks/useAdminInventory";
import { ModalFrame } from "../../modal/ModalFrame";
import { ModalLabelInput } from "../../modal/ModalLabelInput";

interface EditInventoryModalProps {
  isOpen: boolean;
  ware: Ware | null;
  onClose: () => void;
  onSubmit: (
    id: string,
    payload: UpdateWareInput
  ) => Promise<void>;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  ware,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [wareCode, setWareCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [meta, setMeta] = useState("{}");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ware) {
      return;
    }

    setName(ware.name);
    setWareCode(ware.wareCode ?? "");
    setIsActive(ware.isActive);
    setMeta(
      ware.meta
        ? JSON.stringify(ware.meta, null, 2)
        : "{}"
    );
    setError(null);
  }, [isOpen, ware]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!ware) {
      return;
    }

    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Ware 이름을 입력해주세요.");
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

      await onSubmit(ware.id, {
        name: trimmedName,
        wareCode: wareCode.trim() || null,
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
      description="Ware 정보, 메타 정보 및 활성 상태를 수정합니다."
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
            value={ware?.id ?? ""}
            disabled
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-400"
          />
        </div>

        <ModalLabelInput
          label="Ware 이름"
          value={name}
          onChange={setName}
          placeholder="예: Black M 재고"
          required
          disabled={submitting}
          multiline={false}
        />

        <ModalLabelInput
          label="Ware 코드"
          value={wareCode}
          onChange={setWareCode}
          placeholder="예: NIKE-W-250-BLK"
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
