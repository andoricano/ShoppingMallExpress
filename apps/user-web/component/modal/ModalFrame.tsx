// components/common/ModalFrame.tsx
"use client";

import React from "react";

export interface ModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  children: React.ReactNode;

  // --- Footer 관련 옵션들 ---
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  customFooter?: React.ReactNode;
}

export const ModalFrame: React.FC<ModalFrameProps> = ({
  isOpen,
  onClose,
  title,
  description,
  maxWidth = "md",
  children,
  onSubmit,
  submitText = "확인",
  cancelText = "취소",
  isSubmitting = false,
  isSubmitDisabled = false,
  customFooter,
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl", // ~672px
    "3xl": "max-w-3xl", // ~768px
    "4xl": "max-w-4xl", // ~896px
    "5xl": "max-w-5xl", // ~1024px
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full ${maxWidthClasses} max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-100`}>

        {/* 1. Header (고정) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 2. Body (내용이 길어지면 내부 스크롤) */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>

        {/* 3. Footer (하단 고정) */}
        {customFooter !== undefined ? (
          // 사용자가 직접 지정한 커스텀 Footer가 있을 때 (null이면 숨김)
          customFooter && <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30">{customFooter}</div>
        ) : onSubmit ? (
          // onSubmit이 전달되었을 때 기본 Footer 자동 생성
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || isSubmitDisabled}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              {isSubmitting ? "처리 중..." : submitText}
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
};