// @/components/inventory/InventoryOverviewPanel.tsx
"use client";

import { AdjustmentReason, InventoryItem } from "@mall/types";
import { useState } from "react";
import { InventoryTable } from "./InventoryTable"; // [수정] 덤 컴포넌트 임포트

interface InventoryOverviewPanelProps {
    inventoryList: InventoryItem[];
    onAdjustStock: (
        skuId: string,
        deltaQty: number,
        reason: AdjustmentReason,
        memo: string,
        adminId: string
    ) => void;
    onToggleSkuStatus: (skuId: string) => void;
}

export function InventoryOverviewPanel({
    inventoryList,
    onAdjustStock,
    onToggleSkuStatus,
}: InventoryOverviewPanelProps) {
    const [selectedSku, setSelectedSku] = useState("SKU-001");
    const [adjustQty, setAdjustQty] = useState(1);
    const [adjustReason, setAdjustReason] = useState<AdjustmentReason>("INCOMING");
    const [adjustMemo, setAdjustMemo] = useState("");

    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdjustStock(selectedSku, adjustQty, adjustReason, adjustMemo, "ADMIN_DEV");
        setAdjustMemo("");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. 재고 목록 읽기 표기 */}
            <div className="lg:col-span-2 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <h3 className="text-md font-semibold text-white mb-4">
                    실시간 SKU 재고 현황
                </h3>
                {/* [수정] 기존 inline table을 독립된 덤 컴포넌트로 교체 */}
                <InventoryTable
                    inventoryList={inventoryList}
                    onToggleSkuStatus={onToggleSkuStatus}
                />
            </div>

            {/* 2. 수동 조정 적용 */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <h3 className="text-md font-semibold text-white mb-4">
                    어드민 재고 수동 조정
                </h3>
                <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-3 text-xs">
                    <div>
                        <label className="text-zinc-400 block mb-1">SKU 선택</label>
                        <select
                            value={selectedSku}
                            onChange={(e) => setSelectedSku(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        >
                            {inventoryList.map((item) => (
                                <option key={item.skuId} value={item.skuId}>
                                    {item.skuId} ({item.productName})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-zinc-400 block mb-1">변동 수량 (+ / -)</label>
                        <input
                            type="number"
                            value={adjustQty}
                            onChange={(e) => setAdjustQty(Number(e.target.value))}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        />
                    </div>
                    <div>
                        <label className="text-zinc-400 block mb-1">조정 사유</label>
                        <select
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value as AdjustmentReason)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        >
                            <option value="INCOMING">신규 입고 (+)</option>
                            <option value="AUDIT">재고 조사 (수정)</option>
                            <option value="DAMAGED">파손/손실 (-)</option>
                            <option value="OTHER">기타</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-zinc-400 block mb-1">사유 메모</label>
                        <input
                            type="text"
                            placeholder="어드민 전용 메모 작성"
                            value={adjustMemo}
                            onChange={(e) => setAdjustMemo(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-2 w-full p-2 rounded bg-blue-600 hover:bg-blue-500 font-semibold text-white"
                    >
                        수동 조정 적용
                    </button>
                </form>
            </div>
        </div>
    );
}