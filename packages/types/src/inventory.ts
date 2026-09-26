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
 * Internal Admin/trusted-server read model (v3). Shortage is computed, never
 * stored: `shortageQuantity = quantity - allocatedQuantity`, where
 * `allocatedQuantity` is the sum of the OrderItem's Ware allocations.
 * Never include in Consumer payloads.
 */
export interface AdminOrderItemShortage {
    orderItemId: string;
    quantity: number;
    allocatedQuantity: number;
    shortageQuantity: number;
}
