// components/modal/ModalSelectOrInput.tsx
"use client";

import React, { useState } from "react";

interface OptionItem {
  label: string;
  value: string;
}

export interface ModalSelectOrInputProps {
  label: string;
  options: (string | OptionItem)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  selectButtonText?: string;
  customButtonText?: string;
}

export const ModalSelectOrInput: React.FC<ModalSelectOrInputProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "직접 입력",
  required = false,
  disabled = false,
  selectButtonText = "선택",
  customButtonText = "직접입력",
}) => {
  const [isCustom, setIsCustom] = useState(false);

  const handleModeToggle = (customMode: boolean) => {
    setIsCustom(customMode);
    // 모드 전환 시 기본값 설정 (선택 모드로 전환될 때 옵션 첫 번째 값 적용)
    if (!customMode && options.length > 0) {
      const firstValue =
        typeof options[0] === "string" ? options[0] : options[0].value;
      onChange(firstValue);
    } else {
      onChange("");
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {!isCustom ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 transition-colors"
          >
            {options.map((option) => {
              const optVal = typeof option === "string" ? option : option.value;
              const optLabel = typeof option === "string" ? option : option.label;
              return (
                <option key={optVal} value={optVal}>
                  {optLabel}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => handleModeToggle(true)}
            disabled={disabled}
            className="px-2.5 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {customButtonText}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 transition-colors"
          />
          <button
            type="button"
            onClick={() => handleModeToggle(false)}
            disabled={disabled}
            className="px-2.5 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {selectButtonText}
          </button>
        </div>
      )}
    </div>
  );
};