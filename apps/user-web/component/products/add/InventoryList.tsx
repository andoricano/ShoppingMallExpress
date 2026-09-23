// components/products/add/InventoryList.tsx

"use client";

import React from "react";
import type { Ware } from "@mall/types";

interface InventoryListProps {
    items: Ware[];
    selectedId?: string;
    isLoading?: boolean;
    onSelect: (inventory: Ware) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
    items,
    selectedId,
    isLoading = false,
    onSelect,
}) => {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">
                    Inventory 목록
                </h3>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
                {isLoading ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">
                        Inventory를 불러오는 중입니다...
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">
                        조회된 Inventory가 없습니다.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {items.map((inventory) => {
                            const isSelected =
                                selectedId === inventory.id;

                            return (
                                <button
                                    key={inventory.id}
                                    type="button"
                                    onClick={() => onSelect(inventory)}
                                    className={`w-full px-4 py-3 text-left transition-colors ${isSelected
                                        ? "bg-blue-50"
                                        : "hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`font-mono text-xs ${isSelected
                                                ? "text-blue-700"
                                                : "text-slate-700"
                                                }`}
                                        >
                                            {inventory.wareCode ?? inventory.name}
                                        </span>

                                        <span className="text-xs font-semibold text-emerald-600">
                                            활성
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
