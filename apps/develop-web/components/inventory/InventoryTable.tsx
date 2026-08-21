// @/components/inventory/InventoryTable.tsx
"use client";

import { InventoryItem, StockStatus } from "@mall/types";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500); // 1.5초 후 텍스트 복구
        } catch (err) {
            console.error("복사 실패:", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors"
        >
            {copied ? "완료" : "복사"}
        </button>
    );
}

// [추가] 재고 상태 배지 컴포넌트
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

// [신규] 덤 컴포넌트 Props 정의
interface InventoryTableProps {
    inventoryList: InventoryItem[];
    onToggleSkuStatus: (skuId: string) => void;
}

// [신규] 재고 목록 표출용 덤 컴포넌트
export function InventoryTable({ inventoryList, onToggleSkuStatus }: InventoryTableProps) {
    return (
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
                    {inventoryList.map((item) => {
                        // [추가] 해당 행 레코드를 JSON 형태로 복사하기 위한 문자열 생성
                        const recordJson = JSON.stringify(item, null, 2);

                        return (
                            <tr key={item.skuId}>
                                <td className="p-2 font-mono text-zinc-400">{item.skuId}</td>
                                <td className="p-2 text-white font-medium">{item.productName}</td>
                                <td className="p-2 font-bold">{item.currentStock}</td>
                                <td className="p-2 text-zinc-400">{item.safetyStock}</td>
                                <td className="p-2">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="p-2 flex items-center gap-1.5">
                                    {/* [추가] 레코드 복사 버튼 */}
                                    <CopyButton text={recordJson} />
                                    <button
                                        onClick={() => onToggleSkuStatus(item.skuId)}
                                        className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                                    >
                                        {item.status === "DISABLED" ? "활성화" : "비활성화"}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}