// @/types/order.ts

/**
 * 주문 상태
 */
export type OrderStatus =
    | "PENDING"
    | "SHIPPING"
    | "COMPLETED"
    | "CANCELLED";

/**
 * 주문 배송지
 */
export interface OrderShippingAddress {
    name: string;
    recipient: string;
    phone: string;

    postalCode: string;
    address: string;
    detailAddress?: string;
}

/**
 * 주문 배송 정보
 */
export interface OrderDelivery {
    carrier: string;
    trackingNumber: string;
    shippedAt: string;
}

/**
 * 주문 상품
 *
 * 주문 당시 Product / Inventory 정보를 Snapshot으로 보존합니다.
 */
export interface OrderItem {
    id: string;
    orderId: string;

    productId: string;
    inventoryId: string;

    productName: string;
    skuCode: string;

    price: number;
    quantity: number;

    inventoryMeta?: Record<string, unknown>;
}

/**
 * 주문
 */
export interface Order {
    id: string;

    clientId: string;
    paymentId: string;

    status: OrderStatus;
    totalPrice: number;

    shippingAddress: OrderShippingAddress;
    delivery?: OrderDelivery;

    items: OrderItem[];

    createdAt: string;
}