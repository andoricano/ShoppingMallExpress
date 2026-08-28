export interface SkuInventory {
    id: string;           // SKU ID
    itemId: string;       // 재고 아이템 ID
    skuCode: string;      // SKU 코드
    currentStock: number; // 현재 재고
    isActive: boolean;    // 재고 사용 여부
    meta?: Record<string, unknown>;
}