"use client";

import { AdjustmentReason, InventoryItem, InventoryLog } from "@/types/devTypes";
import { useState } from "react";



// 2. 통합 Inventory Dev Hook
export function useInventoryDev() {
    // Mock 데이터 초기 상태
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

    const [logs, setLogs] = useState<InventoryLog[]>([]);


    // [신규 추가] SKU 생성 함수 (수정: 호출 시 콘솔 로그만 출력)
    const createSku = (newItem: {
        skuId: string;
        productId: string;
        productName: string;
        initialStock: number;
        safetyStock: number;
    }) => {
        // 수정: 상태 변경 없이 로그만 출력
        console.log("[useInventoryDev] createSku 호출됨:", newItem);
    };

    // [3.1] 초기 재고 설정 (수정: 호출 시 콘솔 로그만 출력)
    const setInitialInventory = (newItem: Omit<InventoryItem, "status">) => {
        // 수정: 상태 변경 없이 로그만 출력
        console.log("[useInventoryDev] setInitialInventory 호출됨:", newItem);
    };

    // [3.3] 재고 수동 조정 (수정: 호출 시 콘솔 로그만 출력)
    const adjustStock = (skuId: string, deltaQty: number, reason: AdjustmentReason, memo: string, adminId: string) => {
        // 수정: 상태 변경 없이 로그만 출력
        console.log("[useInventoryDev] adjustStock 호출됨:", { skuId, deltaQty, reason, memo, adminId });
    };

    // [3.7] SKU 비활성화 / 활성화 (수정: 호출 시 콘솔 로그만 출력)
    const toggleSkuStatus = (skuId: string) => {
        // 수정: 상태 변경 없이 로그만 출력
        console.log("[useInventoryDev] toggleSkuStatus 호출됨:", skuId);
    };

    // [3.4 가상 테스트] 주문/취소 이벤트 (수정: 호출 시 콘솔 로그만 출력)
    const simulateOrderEvent = (skuId: string, qty: number, type: "ORDER" | "CANCEL") => {
        console.log("[useInventoryDev] simulateOrderEvent 호출됨:", { skuId, qty, type });
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