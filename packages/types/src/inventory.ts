export interface SkuInventory {
    id: string;
    skuCode: string;
    currentStock: number;
    isActive: boolean;
    meta?: Record<string, unknown>;
}