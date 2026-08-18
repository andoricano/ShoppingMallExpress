// apps/develop-web/components/auth/SelectGroup.tsx
"use client";

import { AuthButton } from "./AuthButton";

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SelectGroupProps<T extends string = string> {
  title?: string;
  options: SelectOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  variant?: "default" | "primary" | "danger";
}

export function SelectGroup<T extends string = string>({
  title,
  options,
  selectedValue,
  onChange,
  variant = "default",
}: SelectGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* [주석] 그룹 제목이 들어올 경우 라벨 표시 */}
      {title && (
        <span className="text-[11px] font-medium text-zinc-400">
          {title}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <AuthButton
            key={option.value}
            label={option.label}
            onClick={() => onChange(option.value)}
            isSelected={selectedValue === option.value}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}