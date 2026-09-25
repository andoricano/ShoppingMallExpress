import type { JsonObject } from "./product.js";

export type OrderStatus =
    | "PENDING"
    | "PAID"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

/**
 * Order shipping data is an immutable JSON snapshot. Its field-level input
 * contract is owned by the Order RPC, not by the User profile type.
 */
export type OrderShippingAddress = JsonObject | null;
export type OrderShippingAddressInput = JsonObject;

/** Immutable order-time Product/ProductVariant snapshot. */
export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productVariantId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    productNameSnapshot: string;
    variantLabelSnapshot: string | null;
    optionSnapshot: JsonObject;
    imageUrlSnapshot: string | null;
    createdAt: string;
}

export interface Order {
    id: string;
    clientId: string;
    orderNumber: string | null;
    status: OrderStatus;
    shippingAddress: OrderShippingAddress;
    subtotal: number;
    discountAmount: number;
    shippingAmount: number;
    totalAmount: number;
    paymentReference: string | null;
    orderedAt: string;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}
