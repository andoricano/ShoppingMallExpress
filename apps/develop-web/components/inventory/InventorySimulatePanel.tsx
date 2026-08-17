// @/components/inventory/InventorySimulatePanel.tsx
"use client";

import { InventoryItem, StockStatus } from "./useInventoryDev";


// 내부 전용 상태 배지 컴포넌트
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

interface InventorySimulatePanelProps {
    inventoryList: InventoryItem[];
    onSimulateOrderEvent?: (skuId: string, qty: number, type: "ORDER" | "CANCEL") => void;
}

export function InventorySimulatePanel({
    inventoryList,
    onSimulateOrderEvent,
}: InventorySimulatePanelProps) {
    // 주문/취소 이벤트 버튼 클릭 핸들러 (수정: 클릭 시 콘솔 로그 출력 처리)
    const handleSimulate = (skuId: string, qty: number, type: "ORDER" | "CANCEL") => {
        // 이벤트 발생 시 콘솔 로그 출력
        console.log("[InventorySimulatePanel] 모의 테스트 트리거:", { skuId, qty, type });

        // 부모의 simulateOrderEvent 함수 호출
        onSimulateOrderEvent?.(skuId, qty, type);
    };

    return (
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
            <div>
                <h3 className="text-md font-semibold text-white">
                    주문 / 취소 모듈 백그라운드 이벤트 트리거
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                    PRD 3.4항의 백그라운드 재고 자동 차감(-) 및 취소 복구(+) 로직을 테스트합니다.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventoryList.map((item) => (
                    <div
                        key={item.skuId}
                        className="p-3 rounded bg-zinc-800/50 border border-zinc-700/50 flex flex-col gap-2"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-sm">
                                {item.productName} ({item.skuId})
                            </span>
                            <StatusBadge status={item.status} />
                        </div>
                        <div className="text-xs text-zinc-400">
                            현재 수량:{" "}
                            <span className="text-white font-bold">
                                {item.currentStock}개
                            </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                // 수정: 클릭 시 로그 출력 처리 적용
                                onClick={() => handleSimulate(item.skuId, 1, "ORDER")}
                                className="flex-1 py-1.5 text-xs bg-rose-600/80 hover:bg-rose-600 text-white rounded font-medium"
                            >
                                주문 발생 (-1)
                            </button>
                            <button
                                // 수정: 클릭 시 로그 출력 처리 적용
                                onClick={() => handleSimulate(item.skuId, 1, "CANCEL")}
                                className="flex-1 py-1.5 text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white rounded font-medium"
                            >
                                주문 취소 (+1)
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}