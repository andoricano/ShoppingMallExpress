// @/types/order.ts

/**
 * 주문 상태
 */
export type OrderStatus =
    | "PENDING"   // 출고 대기
    | "SHIPPING"  // 배송 중
    | "COMPLETED" // 배송 완료
    | "CANCELLED"; // 취소

/**
 * 주문
 */
export interface Order {
    id: string;
    clientId: string;

    status: OrderStatus;
    totalPrice: number;

    shippingAddress: OrderShippingAddress;

    createdAt: string;
    shippedAt?: string;
    completedAt?: string;
}

/**
 * 주문 상품
 */
export interface OrderItem {
    id: string;
    orderId: string;

    productId: string;
    itemId: string;
    skuId: string;

    productName: string;
    price: number;
    quantity: number;

    meta?: Record<string, unknown>;
}

/**
 * 주문 배송지
 */
export interface OrderShippingAddress {
    recipient: string;
    phone: string;
    postalCode: string;
    address: string;
    detailAddress?: string;
}