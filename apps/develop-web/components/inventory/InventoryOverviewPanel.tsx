// @/components/inventory/InventoryOverviewPanel.tsx
"use client";

import { AdjustmentReason, InventoryItem, StockStatus } from "@mall/types";
import { useState } from "react";


// 재고 상태 배지
function StatusBadge({ status }: { status: StockStatus }) {
    const statusStyles: Record<StockStatus, string> = {
        IN_STOCK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        LOW_STOCK: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        SOLD_OUT: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        DISABLED: "bg-zinc-800 text-zinc-500 border-zinc-700",
    };

    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${statusStyles[status]}`}>
            {status}
        </span>
    );
}

// 실제 사용하는 3가지 Props만 명시
interface InventoryOverviewPanelProps {
    inventoryList: InventoryItem[]; // 1. 표출용 데이터
    onAdjustStock: ( // 2. 수동 조정 함수
        skuId: string,
        deltaQty: number,
        reason: AdjustmentReason,
        memo: string,
        adminId: string
    ) => void;
    onToggleSkuStatus: (skuId: string) => void; // 3. 비활성화/활성화 토글 함수
}

export function InventoryOverviewPanel({
    inventoryList,
    onAdjustStock,
    onToggleSkuStatus,
}: InventoryOverviewPanelProps) {
    // 수동 조정 폼에서 필요한 내부 입력 상태만 관리
    const [selectedSku, setSelectedSku] = useState("SKU-001");
    const [adjustQty, setAdjustQty] = useState(1);
    const [adjustReason, setAdjustReason] = useState<AdjustmentReason>("INCOMING");
    const [adjustMemo, setAdjustMemo] = useState("");

    // 수동 조정 제출 시 필요한 인자만 묶어서 상위 함수 호출
    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdjustStock(selectedSku, adjustQty, adjustReason, adjustMemo, "ADMIN_DEV");
        setAdjustMemo(""); // 제출 후 메모만 초기화
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. 재고 목록 읽기 표기 */}
            <div className="lg:col-span-2 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <h3 className="text-md font-semibold text-white mb-4">
                    실시간 SKU 재고 현황
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-zinc-800 text-zinc-400 uppercase">
                            <tr>
                                <th className="p-2">SKU ID</th>
                                <th className="p-2">상품명</th>
                                <th className="p-2">현재고</th>
                                <th className="p-2">안전재고</th>
                                <th className="p-2">상태</th>
                                <th className="p-2">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {inventoryList.map((item) => (
                                <tr key={item.skuId}>
                                    <td className="p-2 font-mono text-zinc-400">{item.skuId}</td>
                                    <td className="p-2 text-white font-medium">{item.productName}</td>
                                    <td className="p-2 font-bold">{item.currentStock}</td>
                                    <td className="p-2 text-zinc-400">{item.safetyStock}</td>
                                    <td className="p-2">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => onToggleSkuStatus(item.skuId)}
                                            className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                                        >
                                            {item.status === "DISABLED" ? "활성화" : "비활성화"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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