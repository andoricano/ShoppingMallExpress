// components/inventory/SkuTableForm.tsx
"use client";

import React, { useMemo } from "react";
import { StockStatus } from "@mall/types";

export interface SkuFormInput {
  customSkuId: string;
  optionName: string;
  currentStock: number;
  safetyStock: number;
  status: StockStatus | "AUTO";
}

export interface SkuTableFormProps {
  skus: SkuFormInput[];
  baseGroupId?: string;
  disabled?: boolean;
  isEditMode?: boolean; // 수정 모드 여부
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onChangeRow: <K extends keyof SkuFormInput>(
    index: number,
    field: K,
    value: SkuFormInput[K]
  ) => void;
}

export const SkuTableForm: React.FC<SkuTableFormProps> = ({
  skus,
  baseGroupId = "",
  disabled = false,
  isEditMode = false,
  onAddRow,
  onRemoveRow,
  onChangeRow,
}) => {
  // 총 재고 실시간 계산
  const totalStock = useMemo(
    () => skus.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0),
    [skus]
  );

  return (
    <div className="space-y-3">
      {/* 헤더 및 옵션 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            SKU 목록
          </h3>
          <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
            총 재고: {totalStock}개
          </span>
        </div>
        <button
          type="button"
          onClick={onAddRow}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
        >
          + 옵션 추가
        </button>
      </div>

      {/* 테이블 영역 */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse text-xs min-w-[650px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="p-2.5 min-w-[130px]">옵션명 *</th>
              <th className="p-2.5 min-w-[160px]">커스텀 SKU ID (선택)</th>
              <th className="p-2.5 w-24">현재 재고</th>
              <th className="p-2.5 w-24">안전 재고</th>
              <th className="p-2.5 w-32">상태</th>
              <th className="p-2.5 w-10 text-center">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {skus.map((sku, index) => {
              const defaultPlaceholder = baseGroupId
                ? `${baseGroupId}-${sku.optionName || index + 1}`
                : "자동 생성";

              return (
                <tr key={index} className="hover:bg-slate-50/50">
                  {/* 옵션명 */}
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="예: 250, XL"
                      value={sku.optionName}
                      onChange={(e) => onChangeRow(index, "optionName", e.target.value)}
                      disabled={disabled}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                      required
                    />
                  </td>

                  {/* 커스텀 SKU ID */}
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder={defaultPlaceholder}
                      value={sku.customSkuId}
                      onChange={(e) => onChangeRow(index, "customSkuId", e.target.value)}
                      disabled={disabled || (isEditMode && Boolean(sku.customSkuId))} // 수정 모드 시 기존 ID 수정 방지
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-500 font-mono text-[11px] disabled:bg-slate-50"
                    />
                  </td>

                  {/* 현재 재고 */}
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={sku.currentStock}
                      onChange={(e) => onChangeRow(index, "currentStock", Number(e.target.value))}
                      disabled={disabled}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </td>

                  {/* 안전 재고 */}
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={sku.safetyStock}
                      onChange={(e) => onChangeRow(index, "safetyStock", Number(e.target.value))}
                      disabled={disabled}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </td>

                  {/* 상태 선택 */}
                  <td className="p-2">
                    <select
                      value={sku.status}
                      onChange={(e) =>
                        onChangeRow(index, "status", e.target.value as StockStatus | "AUTO")
                      }
                      disabled={disabled}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-500 text-[11px] disabled:bg-slate-50"
                    >
                      <option value="AUTO">자동 계산</option>
                      <option value="IN_STOCK">IN_STOCK (정상)</option>
                      <option value="LOW_STOCK">LOW_STOCK (임박)</option>
                      <option value="SOLD_OUT">SOLD_OUT (품절)</option>
                      <option value="DISABLED">DISABLED (비활성)</option>
                    </select>
                  </td>

                  {/* 삭제 버튼 */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(index)}
                      disabled={disabled}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};