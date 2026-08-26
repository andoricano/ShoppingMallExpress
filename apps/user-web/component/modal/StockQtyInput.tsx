"use client";

import React from "react";

export interface StockQtyInputProps {
  /** 현재 입력된 변동 수량 (+/-) */
  value: number;
  /** 현재 기준 재고 수량 */
  currentQty: number;
  /** 수량 변경 핸들러 */
  onChange: (value: number) => void;
  /** 증감 퀵 버튼 목록 (기본값: [-10, -1, 1, 10, 50]) */
  quickDeltas?: number[];
  /** 비활성화 여부 */
  disabled?: boolean;
}

const DEFAULT_DELTAS = [-10, -1, 1, 10, 50];

export const StockQtyInput: React.FC<StockQtyInputProps> = ({
  value,
  currentQty,
  onChange,
  quickDeltas = DEFAULT_DELTAS,
  disabled = false,
}) => {
  // Pure UI 내부 계산
  const afterQty = currentQty + (Number(value) || 0);
  const isNegativeStock = afterQty < 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = Number(e.target.value);
    onChange(isNaN(nextVal) ? 0 : nextVal);
  };

  const handleQuickDelta = (delta: number) => {
    onChange(value + delta);
  };

  const handleReset = () => {
    onChange(0);
  };

  return (
    <div className="space-y-2">
      {/* Label & 예상 재고 */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-600">
          변동 수량 (+ 입고 / - 차감) *
        </label>
        <div className="text-xs">
          예상 재고:{" "}
          <span
            className={`font-bold ${
              isNegativeStock ? "text-rose-600" : "text-blue-600"
            }`}
          >
            {afterQty} 개
          </span>
        </div>
      </div>

      {/* 수량 Input */}
      <input
        type="number"
        placeholder="예: 10 또는 -5"
        value={value || ""}
        onChange={handleInputChange}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
          isNegativeStock
            ? "border-rose-300 focus:ring-rose-500/20 text-rose-600"
            : "border-slate-200 focus:ring-blue-500/20 text-slate-800"
        }`}
        required
      />

      {/* 증감 퀵 버튼 */}
      <div className="flex items-center gap-1.5 pt-1">
        {quickDeltas.map((delta) => (
          <button
            key={delta}
            type="button"
            disabled={disabled}
            onClick={() => handleQuickDelta(delta)}
            className="flex-1 py-1 text-[11px] font-medium border border-slate-200 rounded hover:bg-slate-50 active:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50"
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={handleReset}
          className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          리셋
        </button>
      </div>

      {/* 에러 메시지 */}
      {isNegativeStock && (
        <p className="text-[11px] font-medium text-rose-500">
          ⚠️ 조정 후 재고 수량이 음수가 될 수 없습니다.
        </p>
      )}
    </div>
  );
};