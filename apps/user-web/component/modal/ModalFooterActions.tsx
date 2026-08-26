"use client";

import React from "react";

export interface ModalFooterActionsProps {
  /** 취소 버튼 클릭 핸들러 */
  onCancel: () => void;
  /** 제출/확인 버튼 텍스트 (기본값: "확인") */
  submitText?: string;
  /** 취소 버튼 텍스트 (기본값: "취소") */
  cancelText?: string;
  /** 로딩/처리 중 여부 */
  isSubmitting?: boolean;
  /** 제출/확인 버튼 비활성화 여부 */
  isSubmitDisabled?: boolean;
  /** 제출 버튼 타입 (기본값: "submit") */
  submitType?: "submit" | "button";
  /** 제출 버튼 클릭 핸들러 (submitType이 "button"일 때 사용) */
  onSubmit?: () => void;
}

export const ModalFooterActions: React.FC<ModalFooterActionsProps> = ({
  onCancel,
  submitText = "확인",
  cancelText = "취소",
  isSubmitting = false,
  isSubmitDisabled = false,
  submitType = "submit",
  onSubmit,
}) => {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {cancelText}
      </button>
      <button
        type={submitType}
        onClick={onSubmit}
        disabled={isSubmitting || isSubmitDisabled}
        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
      >
        {isSubmitting ? "처리 중..." : submitText}
      </button>
    </div>
  );
};