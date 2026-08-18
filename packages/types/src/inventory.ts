// @/types/inventory.ts

// 1. 재고 상태
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT" | "DISABLED";

// 2. 어드민 수동 조정 사유 (3.3절 요구사항 반영)
export type AdjustmentReason = "INCOMING" | "AUDIT" | "DAMAGED" | "OTHER";

// 3. 재고 변동 전체 유형 (3.6절 감사 로그 요구사항 반영)
// 주문 자동 차감/취소 복구/어드민 수동 조정 등 로그 분류용
export type InventoryChangeType =
    | "ORDER_DEDUCT"    // 주문 차감
    | "CANCEL_RESTORE"  // 취소/반품 복구
    | "ADMIN_ADJUST";   // 어드민 수동 조정

// 4. SKU 재고 아이템 (2.2 & 2.3절)
export interface InventoryItem {
    skuId: string;
    productId: string;
    productName: string;
    category?: string;       // 3.2절 검색 필터용 (선택)
    currentStock: number;
    safetyStock: number;
    status: StockStatus;
}

// 5. 어드민 수동 조정 요청 Payload (3.3절)
export interface AdjustStockPayload {
    skuId: string;
    adjustmentQty: number;   // 양수(+) 입고, 음수(-) 차감
    reasonType: AdjustmentReason;
    reasonMemo?: string;
    adminId: string;
}

// 6. 어드민 감사 로그 (3.6절)
export interface InventoryLog {
    id: string;
    timestamp: string;      // 또는 Date
    skuId: string;
    beforeQty: number;
    afterQty: number;
    changeType: InventoryChangeType;
    reasonType?: AdjustmentReason; // 수동 조정 시 사용된 사유
    adminId: string;        // 시스템 자동 변동일 경우 "SYSTEM" 등
    reasonMemo?: string;
}

// 7. 대시보드 위젯/필터용 타입 (3.2절)
export interface InventoryFilterParams {
    searchQuery?: string;   // 상품명, SKU 코드
    status?: StockStatus;
    category?: string;
}