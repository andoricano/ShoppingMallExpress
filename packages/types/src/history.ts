import type { JsonObject } from "./product.js";
import type { OrderStatus } from "./order.js";

/** Consumer history is derived from Order and immutable OrderItem snapshots. */
export interface ClientHistoryItem {
    id: string;
    orderNumber: string | null;
    status: OrderStatus;
    shippingAddress: JsonObject | null;
    subtotal: number;
    discountAmount: number;
    shippingAmount: number;
    totalAmount: number;
    orderedAt: string;
    items: ClientHistoryOrderItem[];
}

export interface ClientHistoryOrderItem {
    id: string;
    productId: string;
    productVariantId: string;
    productName: string;
    variantLabel: string | null;
    options: JsonObject;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

/** @deprecated No standalone History table exists in Mall v2. */
export type HistoryActorType = "CLIENT" | "ADMIN" | "SYSTEM";

/**
 * @deprecated Legacy audit-log target type. `INVENTORY` is not a Mall v2
 * consumer domain; use Order-derived ClientHistoryItem for consumer history.
 */
export type HistoryTargetType =
    | "ORDER"
    | "ORDER_ITEM"
    | "PRODUCT"
    | "INVENTORY"
    | "USER";

/** @deprecated No standalone History table exists in Mall v2. */
export type HistoryAction =
    | "ORDER_CREATED"
    | "ORDER_SHIPPED"
    | "ORDER_COMPLETED"
    | "ORDER_CANCELLED"
    | "STOCK_DEDUCTED"
    | "STOCK_RESTORED"
    | "USER_UPDATED"
    | "USER_ROLE_CHANGED";

/** @deprecated No standalone History table exists in Mall v2. */
export interface History {
    id: string;
    actorType: HistoryActorType;
    actorId: string | null;
    targetType: HistoryTargetType;
    targetId: string;
    action: HistoryAction;
    metadata: JsonObject | null;
    createdAt: string;
}
