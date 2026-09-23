import type { JsonObject } from "./product.js";

/** Internal Admin/trusted-server type. Never include in Consumer payloads. */
export interface Warehouse {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    isActive: boolean;
    meta: JsonObject;
    createdAt: string;
    updatedAt: string;
}

/** Internal Admin/trusted-server type. Never include in Consumer payloads. */
export interface Ware {
    id: string;
    warehouseId: string;
    wareCode: string | null;
    name: string;
    wareType: string;
    currentStock: number;
    reservedStock: number;
    isActive: boolean;
    meta: JsonObject;
    createdAt: string;
    updatedAt: string;
}

/** Internal relation only. Consumer contracts must not expose either ID. */
export interface ProductVariantWare {
    id: string;
    productVariantId: string;
    wareId: string;
    createdAt: string;
}

/**
 * Internal order-fulfilment record. It is intentionally absent from Consumer
 * Order and Refund contracts.
 */
export interface OrderItemWareAllocation {
    id: string;
    orderItemId: string;
    wareId: string;
    quantity: number;
    createdAt: string;
}

/**
 * @deprecated Legacy Inventory/SKU contract. Mall v2 uses Ware internally
 * and ProductVariant as the sellable unit. Do not use in new code.
 */
export interface SkuInventory {
    id: string;
    skuCode: string;
    currentStock: number;
    isActive: boolean;
    meta?: JsonObject;
    createdAt: string;
    updatedAt: string;
}

/** @deprecated Use trusted Ware management contracts in Phase 6+. */
export interface CreateInventoryInput {
    skuCode: string;
    currentStock?: number;
    isActive?: boolean;
    meta?: JsonObject;
}
