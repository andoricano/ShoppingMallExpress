"use client";

import React from "react";
import type { SkuInventory } from "@mall/types";

interface InventoryTableProps {
  items: SkuInventory[];
  isLoading?: boolean;
  onAdjustStock?: (skuId: string, currentQty: number) => void;
  onToggleStatus?: (skuId: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items = [],
  isLoading = false,
  onAdjustStock,
  onToggleStatus,
}) => {
  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[20%]" />
          <col className="w-[25%]" />
          <col className="w-[15%]" />
          <col className="w-[10%]" />
          <col className="w-[20%]" />
        </colgroup>

        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
            <th className="p-3 px-4">재고 ID</th>
            <th className="p-3 px-4">SKU 코드</th>
            <th className="p-3 px-4">메타 정보</th>
            <th className="p-3 px-4">재고 수량</th>
            <th className="p-3 px-4">상태</th>
            <th className="p-3 px-4 text-right">관리</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr>
              <td
                colSpan={6}
                className="py-16 text-center text-slate-400 text-sm"
              >
                재고 목록을 불러오는 중입니다...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-16 text-center text-slate-400 text-sm"
              >
                조회된 재고 항목이 없습니다.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/50 transition-colors text-xs"
              >
                <td className="p-3 px-4">
                  <span className="font-mono text-slate-500">
                    {item.id}
                  </span>
                </td>

                <td className="p-3 px-4">
                  <span className="font-semibold text-slate-700">
                    {item.skuCode}
                  </span>
                </td>

                <td className="p-3 px-4">
                  {item.meta &&
                  typeof item.meta === "object" &&
                  Object.keys(item.meta).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(item.meta).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-600"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                <td className="p-3 px-4">
                  <span className="font-bold text-slate-800">
                    {item.currentStock.toLocaleString()}개
                  </span>
                </td>

                <td className="p-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {item.isActive ? "활성" : "비활성"}
                  </span>
                </td>

                <td className="p-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onAdjustStock && (
                      <button
                        type="button"
                        onClick={() =>
                          onAdjustStock(item.id, item.currentStock)
                        }
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
                      >
                        수량 조정
                      </button>
                    )}

                    {onToggleStatus && (
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item.id)}
                        className={`px-2.5 py-1 text-xs font-medium border rounded-md transition-colors shadow-sm ${
                          item.isActive
                            ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        {item.isActive ? "비활성화" : "활성화"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};