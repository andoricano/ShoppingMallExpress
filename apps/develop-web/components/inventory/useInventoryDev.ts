"use client";

import { AdjustmentReason, InventoryItem, InventoryLog, StockStatus } from "@mall/types";
import { useState } from "react";

// 재고 수량에 따른 상태(Status) 자동 계산 헬퍼 함수
const calculateStatus = (currentStock: number, safetyStock: number, isDisabled: boolean): StockStatus => {
    if (isDisabled) return "DISABLED";
    if (currentStock <= 0) return "SOLD_OUT";
    if (currentStock <= safetyStock) return "LOW_STOCK";
    return "IN_STOCK";
};

export function useInventoryDev() {
    // 1. Mock 데이터 초기 상태
    const [inventoryList, setInventoryList] = useState<InventoryItem[]>([
        {
            skuId: "SKU-001",
            productId: "PROD-101",
            productName: "베이직 오버핏 후드티 (L)",
            currentStock: 15,
            safetyStock: 5,
            status: "IN_STOCK",
        },
        {
            skuId: "SKU-002",
            productId: "PROD-102",
            productName: "클래식 데님 팬츠 (M)",
            currentStock: 2,
            safetyStock: 5,
            status: "LOW_STOCK",
        },
    ]);

    // 2. 감사 로그 상태 (초기 데이터 제공)
    const [logs, setLogs] = useState<InventoryLog[]>([
        {
            id: "LOG-001",
            timestamp: new Date().toISOString(),
            skuId: "SKU-001",
            beforeQty: 10,
            afterQty: 15,
            changeType: "ADMIN_ADJUST",
            adminId: "admin_master",
            reasonMemo: "초기 재고 입고 처리",
        },
    ]);

    // [3.1] 신규 SKU 생성 및 초기 재고 설정
    const createSku = (newItem: {
        skuId: string;
        productId: string;
        productName: string;
        initialStock: number;
        safetyStock: number;
    }) => {
        // [수정] 콘솔 로그 출력 및 실제 Mock 리스트에 추가
        console.log("[useInventoryDev] createSku 호출됨:", newItem);

        const initialStatus = calculateStatus(newItem.initialStock, newItem.safetyStock, false);
        const createdItem: InventoryItem = {
            skuId: newItem.skuId,
            productId: newItem.productId,
            productName: newItem.productName,
            currentStock: newItem.initialStock,
            safetyStock: newItem.safetyStock,
            status: initialStatus,
        };

        setInventoryList((prev) => [...prev, createdItem]);
    };

    // [3.1] 초기 재고 설정 (단순 덮어쓰기)
    const setInitialInventory = (newItem: Omit<InventoryItem, "status">) => {
        // [수정] 콘솔 로그 출력 및 수량/상태 업데이트
        console.log("[useInventoryDev] setInitialInventory 호출됨:", newItem);

        setInventoryList((prev) =>
            prev.map((item) => {
                if (item.skuId === newItem.skuId) {
                    const newStatus = calculateStatus(
                        newItem.currentStock,
                        newItem.safetyStock,
                        item.status === "DISABLED"
                    );
                    return { ...item, ...newItem, status: newStatus };
                }
                return item;
            })
        );
    };

    // [3.3] 어드민 재고 수동 조정 (+ 감사 로그 자동 적재)
    const adjustStock = (
        skuId: string,
        deltaQty: number,
        reason: AdjustmentReason,
        memo: string,
        adminId: string
    ) => {
        // [수정] 콘솔 로그 출력 및 재고 수량/상태 계산, 감사 로그 적재
        console.log("[useInventoryDev] adjustStock 호출됨:", { skuId, deltaQty, reason, memo, adminId });

        setInventoryList((prev) =>
            prev.map((item) => {
                if (item.skuId === skuId) {
                    const beforeQty = item.currentStock;
                    const afterQty = Math.max(0, beforeQty + deltaQty); // 최소 수량 0 보장
                    const newStatus = calculateStatus(afterQty, item.safetyStock, item.status === "DISABLED");

                    // 감사 로그 적재 (PRD 3.6 반영)
                    const newLog: InventoryLog = {
                        id: `LOG-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        skuId,
                        beforeQty,
                        afterQty,
                        changeType: "ADMIN_ADJUST",
                        adminId,
                        reasonMemo: `[${reason}] ${memo}`.trim(),
                    };
                    setLogs((prevLogs) => [newLog, ...prevLogs]);

                    return { ...item, currentStock: afterQty, status: newStatus };
                }
                return item;
            })
        );
    };

    // [3.7] SKU 비활성화 / 활성화 (논리적 삭제)
    const toggleSkuStatus = (skuId: string) => {
        // [수정] 콘솔 로그 출력 및 DISABLED ↔ 기존 상태 전환
        console.log("[useInventoryDev] toggleSkuStatus 호출됨:", skuId);

        setInventoryList((prev) =>
            prev.map((item) => {
                if (item.skuId === skuId) {
                    const isDisabling = item.status !== "DISABLED";
                    const newStatus = calculateStatus(item.currentStock, item.safetyStock, isDisabling);
                    return { ...item, status: newStatus };
                }
                return item;
            })
        );
    };

    // [3.4] 가상 주문/취소 이벤트 테스트 (+ 감사 로그 자동 적재)
    const simulateOrderEvent = (skuId: string, qty: number, type: "ORDER" | "CANCEL") => {
        // [수정] 콘솔 로그 출력 및 백그라운드 자동 차감/복구 연동 시뮬레이션
        console.log("[useInventoryDev] simulateOrderEvent 호출됨:", { skuId, qty, type });

        setInventoryList((prev) =>
            prev.map((item) => {
                if (item.skuId === skuId) {
                    const beforeQty = item.currentStock;
                    const delta = type === "ORDER" ? -qty : qty;
                    const afterQty = Math.max(0, beforeQty + delta);
                    const newStatus = calculateStatus(afterQty, item.safetyStock, item.status === "DISABLED");

                    const newLog: InventoryLog = {
                        id: `LOG-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        skuId,
                        beforeQty,
                        afterQty,
                        changeType: type === "ORDER" ? "ORDER_DEDUCT" : "CANCEL_RESTORE",
                        adminId: "SYSTEM_EVENT",
                        reasonMemo: type === "ORDER" ? "고객 주문 자동 차감" : "주문 취소 자동 복구",
                    };
                    setLogs((prevLogs) => [newLog, ...prevLogs]);

                    return { ...item, currentStock: afterQty, status: newStatus };
                }
                return item;
            })
        );
    };

    return {
        inventoryList,
        logs,
        createSku,
        setInitialInventory,
        adjustStock,
        toggleSkuStatus,
        simulateOrderEvent,
    };
}