// @/components/inventory/InventoryDevSection.tsx
"use client";

import { useState } from "react";
import {
    useInventoryDev,
    AdjustmentReason,
    StockStatus,
} from "./useInventoryDev";
import { DevTabItem, DevTopbar } from "../ui/DevTopbar";
import { InventoryOverviewPanel } from "./InventoryOverviewPanel";
import { InventoryCreatePanel } from "./InventoryCreatePanel";
import { InventorySimulatePanel } from "./InventorySimulatePanel";
import { InventoryAuditLogPanel } from "./InventoryAuditLogPanel";
// 분리한 DevTopbar 및 타입 import

// 탭 ID 타입 정의
type TabType = "list" | "create" | "simulate" | "logs";

function StatusBadge({ status }: { status: StockStatus }) {
    const statusStyles: Record<StockStatus, string> = {
        IN_STOCK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        LOW_STOCK: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        SOLD_OUT: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        DISABLED: "bg-zinc-800 text-zinc-500 border-zinc-700",
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-medium rounded border ${statusStyles[status]}`}
        >
            {status}
        </span>
    );
}

export function InventoryDevSection() {
    const [activeTab, setActiveTab] = useState<TabType>("list");

    const {
        inventoryList,
        logs,
        adjustStock,
        toggleSkuStatus,
        simulateOrderEvent,
        createSku
    } = useInventoryDev();

    const navTabs: DevTabItem<TabType>[] = [
        { id: "list", label: "재고 목록 & 조정" },
        { id: "create", label: "초기 재고 등록" },
        { id: "simulate", label: "주문 연동 모의 테스트" },
        { id: "logs", label: `감사 로그 (${logs.length})` },
    ];


    return (
        <div className="flex flex-col gap-6">
            {/* 1. 타이틀 영역 */}
            <div>
                <h2 className="text-lg font-bold text-white">
                    Inventory API & UI Test Section
                </h2>
                <p className="text-sm text-zinc-400">
                    어드민 전용 재고 관리 모듈(SKU, 입출고, 감사로그) 테스트 영역입니다.
                </p>
            </div>

            {/* 2. 상단 탭 버튼 영역 (DevTopbar 공통 컴포넌트 적용) */}
            <DevTopbar<TabType>
                tabs={navTabs}
                activeTab={activeTab}
                onSelectTab={(tabId) => setActiveTab(tabId)}
            />

            {/* 3. 탭별 메인 콘텐츠 영역 */}
            <div className="grid grid-cols-1 gap-6">
                {/* [TAB 1] 재고 목록 및 수동 조정 */}
                {activeTab === "list" && (
                    <InventoryOverviewPanel
                        inventoryList={inventoryList}
                        onAdjustStock={adjustStock}
                        onToggleSkuStatus={toggleSkuStatus}
                    />
                )}

                {/* [TAB 2] 초기 재고 등록 (InventoryCreatePanel 분리 적용) */}
                {activeTab === "create" && (
                    <InventoryCreatePanel
                        onCreateSku={createSku}
                    />
                )}

                {/* [TAB 3] 주문 연동 모의 테스트 (InventorySimulatePanel 분리 적용) */}
                {activeTab === "simulate" && (
                    <InventorySimulatePanel
                        inventoryList={inventoryList}
                        onSimulateOrderEvent={simulateOrderEvent}
                    />
                )}

                {/* [TAB 4] 감사 로그 (InventoryAuditLogPanel 분리 적용) */}
                {activeTab === "logs" && (
                    <InventoryAuditLogPanel logs={logs} />
                )}
            </div>
        </div>
    );
}