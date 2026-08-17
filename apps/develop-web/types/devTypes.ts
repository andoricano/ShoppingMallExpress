// 1. 데이터 타입 정의
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT" | "DISABLED";
export type AdjustmentReason = "INCOMING" | "AUDIT" | "DAMAGED" | "OTHER";

export interface InventoryItem {
    skuId: string;
    productId: string;
    productName: string;
    currentStock: number;
    safetyStock: number;
    status: StockStatus;
}

export interface InventoryLog {
    id: string;
    timestamp: string;
    skuId: string;
    beforeQty: number;
    afterQty: number;
    changeType: string;
    adminId: string;
    reasonMemo?: string;
}