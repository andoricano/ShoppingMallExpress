// @/components/inventory/InventoryCreatePanel.tsx
"use client";

import { useState } from "react";

interface InventoryCreatePanelProps {
    onCreateSku: (item: {
        skuId: string;
        productId: string;
        productName: string;
        initialStock: number;
        safetyStock: number;
    }) => void;
}

export function InventoryCreatePanel({ onCreateSku }: InventoryCreatePanelProps) {
    // 폼 내부 입력 상태
    const [newSkuId, setNewSkuId] = useState("");
    const [newProdId, setNewProdId] = useState("");
    const [newProdName, setNewProdName] = useState("");
    const [newStock, setNewStock] = useState(10);
    const [newSafety, setNewSafety] = useState(5);

    // 제출 핸들러 (내부에서 폼 검증 및 부모 함수 호출)
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkuId || !newProdName) return;

        // 부모의 SKU 생성 함수 호출
        onCreateSku({
            skuId: newSkuId,
            productId: newProdId || `PROD-${Date.now().toString().slice(-3)}`,
            productName: newProdName,
            initialStock: newStock,
            safetyStock: newSafety,
        });

        // 폼 입력값 초기화
        setNewSkuId("");
        setNewProdId("");
        setNewProdName("");
        setNewStock(10);
        setNewSafety(5);
    };

    return (
        <div className="max-w-xl p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-md font-semibold text-white mb-4">
                신규 SKU 초기 재고 설정
            </h3>
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3 text-xs">
                <div>
                    <label className="text-zinc-400 block mb-1">SKU ID *</label>
                    <input
                        type="text"
                        placeholder="예: SKU-003"
                        value={newSkuId}
                        onChange={(e) => setNewSkuId(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        required
                    />
                </div>
                <div>
                    <label className="text-zinc-400 block mb-1">상품 매핑 ID</label>
                    <input
                        type="text"
                        placeholder="예: PROD-103"
                        value={newProdId}
                        onChange={(e) => setNewProdId(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    />
                </div>
                <div>
                    <label className="text-zinc-400 block mb-1">상품명 *</label>
                    <input
                        type="text"
                        placeholder="상품/옵션 이름 입력"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-zinc-400 block mb-1">초기 재고 수량</label>
                        <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(Number(e.target.value))}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        />
                    </div>
                    <div>
                        <label className="text-zinc-400 block mb-1">안전재고 기준</label>
                        <input
                            type="number"
                            value={newSafety}
                            onChange={(e) => setNewSafety(Number(e.target.value))}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="mt-2 w-full p-2 rounded bg-emerald-600 hover:bg-emerald-500 font-semibold text-white"
                >
                    SKU 및 초기 재고 생성
                </button>
            </form>
        </div>
    );
}