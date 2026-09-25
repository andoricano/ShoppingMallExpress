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
