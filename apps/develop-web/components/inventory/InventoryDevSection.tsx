// @/components/inventory/InventoryDevSection.tsx
"use client";

import { useState } from "react";

import { DevTabItem, DevTopbar } from "../ui/DevTopbar";
import { InventoryOverviewPanel } from "./InventoryOverviewPanel";
import { InventoryCreatePanel } from "./InventoryCreatePanel";
import { InventorySimulatePanel } from "./InventorySimulatePanel";
import { InventoryAuditLogPanel } from "./InventoryAuditLogPanel";
import { useInventoryDev } from "./useInventoryDev";
import { StockStatus } from "@mall/types";
// 분리한 DevTopbar 및 타입 import

// 탭 ID 타입 정의
type TabType = "list" | "create" | "simulate" | "logs";


export function InventoryDevSection() {
    const [activeTab, setActiveTab] = useState<TabType>("list");

    const {
        inventoryList,
        logs,
        adjustStock,
        toggleSkuStatus,
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