export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT" | "DISABLED";
export type AdjustmentReason = "INCOMING" | "AUDIT" | "DAMAGED" | "OTHER";

export type InventoryChangeType =
    | "ORDER_DEDUCT"    // 주문 차감
    | "CANCEL_RESTORE"  // 취소/반품 복구
    | "ADMIN_ADJUST";   // 어드민 수동 조정

/**
 * 개별 옵션/사이즈(SKU) 재고 아이템
 */
export interface SkuInventory {
    id: string;              // SKU 식별자 (예: "SHOE-01-250")
    optionName: string;      // 옵션명 (예: "250", "XL")
    currentStock: number;    // 현재 재고
    safetyStock: number;     // 안전 재고
    status: StockStatus;     // 재고 상태
}

/**
 * 재고 그룹 아이템 (Admin 목록 표시용)
 */
export interface InventoryItem {
    id: string;              // 재고 그룹 식별자 (예: "INV-SHOE-01")
    name: string;            // 아이템명 (예: "나이키 운동화")
    category?: string;       // 카테고리 (예: "SHOES", "CLOTHES")
    totalStock: number;      // 전체 SKU 재고 합계
    skus: SkuInventory[];    // 해당 아이템의 SKU 목록
}

export interface AdjustStockPayload {
    skuId: string;           // 대상 SKU ID
    adjustmentQty: number;
    reasonType: AdjustmentReason;
    reasonMemo?: string;
    adminId: string;
}

export interface InventoryLog {
    id: string;
    timestamp: string;
    skuId: string;
    optionName?: string;
    beforeQty: number;
    afterQty: number;
    changeType: InventoryChangeType;
    reasonType?: AdjustmentReason;
    adminId: string;
    reasonMemo?: string;
}

export interface InventoryFilterParams {
    searchQuery?: string;
    status?: StockStatus;
    category?: string;
}