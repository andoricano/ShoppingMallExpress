"use client";

import React from "react";

export interface SelectOptionItem<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export interface OptionSelectProps<T extends string = string> {
  /** 선택된 값 */
  value: T;
  /** 선택 항목 목록 */
  options: SelectOptionItem<T>[];
  /** 값 변경 핸들러 */
  onChange: (value: T) => void;
  /** 필드 상단 라벨 (선택) */
  label?: string;
  /** 필수 입력 표시 여부 (*) */
  required?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export function OptionSelect<T extends string = string>({
  value,
  options,
  onChange,
  label = "선택",
  required = false,
  disabled = false,
}: OptionSelectProps<T>) {
  // 현재 선택된 옵션의 description 찾기
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-600">
          {label} {required && "*"}
        </label>
      )}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white disabled:bg-slate-100 disabled:text-slate-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {selectedOption?.description && (
        <p className="text-[11px] text-slate-400">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
}