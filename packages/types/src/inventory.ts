// @/types/inventory.ts

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
    skuId: string;           // 예: "SHOE-01-250"
    optionName: string;      // 예: "250", "255", "S", "XL"
    currentStock: number;    // 해당 옵션의 현재 재고
    safetyStock: number;     // 안전 재고
    status: StockStatus;     // 해당 옵션의 재고 상태
}

/**
 * 상품 단위 재고 아이템 (Admin 목록 표시용)
 */
export interface InventoryItem {
    productId: string;       // 예: "PROD-SHOE-01"
    productName: string;     // 예: "나이키 운동화"
    category?: string;       // 예: "SHOES", "CLOTHES"
    totalStock: number;      // 옵션 전체 재고 합계
    skus: SkuInventory[];    // 사이즈/옵션별 SKU 목록
}

export interface AdjustStockPayload {
    skuId: string;
    adjustmentQty: number;
    reasonType: AdjustmentReason;
    reasonMemo?: string;
    adminId: string;
}

export interface InventoryLog {
    id: string;
    timestamp: string;
    skuId: string;
    optionName?: string;     // 로그 확인용 옵션명 (선택)
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