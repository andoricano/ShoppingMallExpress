"use client";

import React, { useState } from "react";
import { InventoryItem, SkuInventory, StockStatus } from "@mall/types";

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  onAdjustStock?: (skuId: string, currentQty: number, optionName?: string) => void;
  onUpdateSkuStatus?: (skuId: string, status: StockStatus) => void;
}

const renderStatusBadge = (status: StockStatus) => {
  const config: Record<StockStatus, { label: string; className: string }> = {
    IN_STOCK: {
      label: "정상",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    LOW_STOCK: {
      label: "재고부족",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    SOLD_OUT: {
      label: "품절",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    DISABLED: {
      label: "비활성화",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };

  const currentConfig = config[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${currentConfig.className}`}
    >
      {currentConfig.label}
    </span>
  );
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items = [],
  isLoading = false,
  onAdjustStock,
  onUpdateSkuStatus,
}) => {
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  const toggleExpand = (itemId: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === undefined ? false : !prev[itemId],
    }));
  };

  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <colgroup>
          <col className="w-[5%]" />
          <col className="w-[25%]" />
          <col className="w-[15%]" />
          <col className="w-[20%]" />
          <col className="w-[15%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
            <th className="p-3 text-center"></th>
            <th className="p-3 px-4">상품명 / ID</th>
            <th className="p-3 px-4">카테고리</th>
            <th className="p-3 px-4">보유 옵션</th>
            <th className="p-3 px-4">총 재고 수량</th>
            <th className="p-3 px-4 text-right">상태 / 관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                재고 목록을 불러오는 중입니다...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                조회된 재고 항목이 없습니다.
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const isExpanded = expandedProducts[item.id] !== false;

              return (
                <React.Fragment key={item.id}>
                  {/* 1. 상품 메인 그룹 행 */}
                  <tr className="bg-slate-50/70 hover:bg-slate-100/60 font-semibold transition-colors">
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="p-1 text-xs text-slate-500 hover:text-slate-800 rounded transition-colors"
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                    </td>
                    <td className="p-3 px-4">
                      <div className="text-slate-800 font-bold">{item.name}</div>
                      <div className="text-xs font-mono font-normal text-slate-400">
                        {item.id}
                      </div>
                    </td>
                    <td className="p-3 px-4 text-slate-600 font-normal">
                      <span className="px-2 py-0.5 text-xs bg-slate-200/60 text-slate-700 rounded font-medium">
                        {item.category || "-"}
                      </span>
                    </td>
                    <td className="p-3 px-4 font-normal">
                      <div className="flex gap-1.5 flex-wrap">
                        {item.skus.map((sku) => (
                          <span
                            key={sku.id}
                            className="text-[11px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600"
                          >
                            {sku.optionName}: <strong>{sku.currentStock}</strong>개
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 px-4 text-blue-600 font-bold">
                      {item.totalStock.toLocaleString()} 개
                    </td>
                    <td className="p-3 px-4 text-right">
                      <span className="text-xs text-slate-400 font-normal">
                        총 {item.skus.length}개 옵션
                      </span>
                    </td>
                  </tr>

                  {/* 2. SKU 옵션 상세 행 */}
                  {isExpanded &&
                    item.skus.map((sku: SkuInventory) => (
                      <tr
                        key={sku.id}
                        className="hover:bg-slate-50/50 text-xs transition-colors"
                      >
                        <td></td>
                        <td className="p-2.5 px-4 pl-8">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300">└</span>
                            <strong className="text-slate-700 font-semibold">
                              옵션: {sku.optionName}
                            </strong>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 pl-4">
                            SKU: {sku.id}
                          </div>
                        </td>
                        <td className="p-2.5 px-4 text-slate-400">
                          안전재고: <span className="font-semibold">{sku.safetyStock}</span>개
                        </td>
                        <td className="p-2.5 px-4">{renderStatusBadge(sku.status)}</td>
                        <td className="p-2.5 px-4 font-bold text-slate-800">
                          {sku.currentStock} 개
                        </td>
                        <td className="p-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onAdjustStock && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAdjustStock(sku.id, sku.currentStock, sku.optionName)
                                }
                                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
                              >
                                수량 조정
                              </button>
                            )}
                            {onUpdateSkuStatus && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus: StockStatus =
                                    sku.status === "DISABLED" ? "IN_STOCK" : "DISABLED";
                                  onUpdateSkuStatus(sku.id, nextStatus);
                                }}
                                className={`px-2.5 py-1 text-xs font-medium border rounded-md transition-colors shadow-sm ${
                                  sku.status === "DISABLED"
                                    ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {sku.status === "DISABLED" ? "활성화" : "비활성화"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};