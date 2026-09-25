"use client";

import React from "react";
import type { Ware } from "@mall/types";
import { InventoryActionButton } from "./InventoryActionButton";

interface InventoryTableProps {
  items: Ware[];
  isLoading?: boolean;
  onEdit?: (ware: Ware) => void;
  onEditStock?: (ware: Ware) => void;
  onToggleStatus?: (wareId: string) => void;
  onLinkVariants?: (ware: Ware) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items = [],
  isLoading = false,
  onEdit,
  onEditStock,
  onToggleStatus,
  onLinkVariants,
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
            <th className="p-3 px-4">Ware 코드</th>
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
                    {item.wareCode ?? item.name}
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
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {item.currentStock.toLocaleString()}개
                    </span>

                    {onEditStock && (
                      <button
                        type="button"
                        onClick={() => onEditStock(item)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="재고 수량 수정"
                        aria-label="재고 수량 수정"
                      >
                        ✎
                      </button>
                    )}
                  </div>
                </td>

                <td className="p-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${item.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                  >
                    {item.isActive ? "활성" : "비활성"}
                  </span>
                </td>

                <td className="p-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onEdit && (
                      <InventoryActionButton
                        onClick={() => onEdit(item)}
                      >
                        수정
                      </InventoryActionButton>
                    )}

                    {onLinkVariants && (
                      <InventoryActionButton
                        onClick={() => onLinkVariants(item)}
                      >
                        Variant 연결
                      </InventoryActionButton>
                    )}

                    {onToggleStatus && (
                      <InventoryActionButton
                        onClick={() => onToggleStatus(item.id)}
                        variant={item.isActive ? "default" : "active"}
                      >
                        {item.isActive ? "비활성화" : "활성화"}
                      </InventoryActionButton>
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
