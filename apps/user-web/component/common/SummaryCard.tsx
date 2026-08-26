"use client";

import React from "react";

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
  /** 강조 표시 여부 (예: 강조선 추가, 폰트 굵게) */
  isHighlighted?: boolean;
  /** monospace 폰트 적용 여부 (ID 등에 사용) */
  isMono?: boolean;
}

export interface SummaryCardProps {
  items: SummaryItem[];
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ items }) => {
  return (
    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between text-xs ${
            item.isHighlighted
              ? "pt-1.5 border-t border-slate-200/60 font-semibold"
              : ""
          }`}
        >
          <span className="text-slate-500 font-medium">{item.label}</span>
          <span
            className={`${item.isMono ? "font-mono" : ""} ${
              item.isHighlighted
                ? "font-bold text-slate-900 text-sm"
                : "text-slate-700"
            }`}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};