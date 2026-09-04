// components/products/add/InventoryInspector.tsx

"use client";

import React from "react";
import type { SkuInventory } from "@mall/types";

interface InventoryInspectorProps {
    inventory: SkuInventory | null;
    onRegister: (inventory: SkuInventory) => void;
}

export const InventoryInspector: React.FC<InventoryInspectorProps> = ({
    inventory,
    onRegister,
}) => {
    if (!inventory) {
        return (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="text-center">
                    <p className="text-sm font-medium text-slate-500">
                        Inventory를 선택해주세요.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        위 목록에서 상품으로 등록할 Inventory를 선택할 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">
                            Inventory Inspector
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                            선택한 Inventory 정보를 확인합니다.
                        </p>
                    </div>

                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        활성
                    </span>
                </div>
            </div>

            {/* Inventory 정보 */}
            <div className="space-y-5 p-5">
                <div>
                    <p className="text-xs font-semibold text-slate-400">
                        Inventory ID
                    </p>
                    <p className="mt-1 break-all font-mono text-sm text-slate-700">
                        {inventory.id}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-400">
                        SKU 코드
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                        {inventory.skuCode}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-400">
                        현재 재고
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                        {inventory.currentStock.toLocaleString()}개
                    </p>
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-400">
                        Meta
                    </p>

                    {inventory.meta &&
                        Object.keys(inventory.meta).length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(inventory.meta).map(
                                ([key, value]) => (
                                    <span
                                        key={key}
                                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                                    >
                                        <span className="font-medium">
                                            {key}
                                        </span>
                                        : {String(value)}
                                    </span>
                                )
                            )}
                        </div>
                    ) : (
                        <p className="mt-1 text-sm text-slate-400">
                            등록된 Meta 정보가 없습니다.
                        </p>
                    )}
                </div>

                {/* 상품 등록 */}
                <div className="border-t border-slate-100 pt-5">
                    <button
                        type="button"
                        onClick={() => onRegister(inventory)}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                    >
                        상품 등록
                    </button>
                </div>
            </div>
        </div>
    );
};