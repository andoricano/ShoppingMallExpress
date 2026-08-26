"use client";

import React from "react";

export interface ModalLabelInputProps {
  /** 입력창 상단 라벨 */
  label: string;
  /** 입력 필드 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChange: (value: string) => void;
  /** 안내 문구 (placeholder) */
  placeholder?: string;
  /** 필수 항목 여부 (*) */
  required?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 멀티라인 텍스트 입력 여부 (기본값: true) */
  multiline?: boolean;
  /** multiline일 때 표시할 줄 수 (기본값: 2) */
  rows?: number;
}

export const ModalLabelInput: React.FC<ModalLabelInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  multiline = true,
  rows = 2,
}) => {
  const commonClasses =
    "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${commonClasses} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={commonClasses}
        />
      )}
    </div>
  );
};