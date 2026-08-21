// @/types/order.ts

import { Product } from "./product";

// ==========================================
// 1. 공통 Enum & Status 타입
// ==========================================

/** 주문 처리 상태 (PRD 2.2 & 3.5) */
export type OrderStatus =
    | "PAYMENT_PENDING" // 결제 대기 (재고 점유 진행 중)
    | "ORDER_RECEIVED"  // 주문 접수 (결제 완료)
    | "CANCELLED"       // 주문 취소 / 재고 점유 만료
    | "COMPLETED";      // 배송 및 최종 완료

// ==========================================
// 2. 장바구니 (Cart) 엔티티 및 DTO
// ==========================================

/** 장바구니 개별 품목 데이터 */
export interface CartItem {
    cartItemId: string;
    cartId: string;
    productId: string;
    optionId?: string;
    skuId: string;
    quantity: number;
    isChecked: boolean;
    createdAt: string;
    updatedAt: string;
    productInfo?: Pick<
        Product,
        "productName" | "mainImageUrl" | "status" | "price"
    >;
    optionInfo?: {
        optionName: string;
        optionValue: string;
        surcharge: number;
    };
}

/** 장바구니 마스터 데이터 (PRD 2.1) */
export interface Cart {
    cartId: string;
    userId: string;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}

/** 장바구니 담기 Payload (PRD 3.2) */
export interface AddCartItemPayload {
    productId: string;
    optionId?: string;
    skuId: string;
    quantity: number;
}

/** 장바구니 수량/선택 수정 Payload (PRD 3.2) */
export interface UpdateCartItemPayload {
    quantity?: number;
    isChecked?: boolean;
    optionId?: string;
    skuId?: string;
}

/** 장바구니 선택/일괄 삭제 Payload (PRD 3.2) */
export interface DeleteCartItemsPayload {
    cartItemIds: string[];
}

// ==========================================
// 3. 관심상품 (Wishlist) DTO
// ==========================================

/** 관심상품 목록 조회 결과 (상품 정보 JOIN 포함) */
export interface WishlistItem {
    wishlistId: string;
    userId: string;
    productId: string;
    createdAt: string;
    productInfo?: Pick<
        Product,
        "productName" | "mainImageUrl" | "status" | "price"
    >;
}

/** 관심상품 토글(등록/삭제) Payload (PRD 3.1) */
export interface ToggleWishlistPayload {
    productId: string;
}

// ==========================================
// 4. 주문서 및 주문 (Order) 엔티티 및 DTO
// ==========================================

/** 주문 상세 품목 데이터 (결제 당시 스냅샷 정보 저장) (PRD 2.2) */
export interface OrderItem {
    orderItemId: string;
    orderId: string;
    productId: string;
    optionId?: string;
    skuId: string;
    productName: string;
    optionName?: string;
    price: number; // 주문 당시 단가
    quantity: number;
    createdAt: string;
}

/** 수령인 및 배송지 정보 */
export interface ShippingInfo {
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    shippingRequest?: string;
    isPickup: boolean;
    pickupLocation?: string;
}

/** 주문 생성 마스터 데이터 (PRD 2.2 & 3.4) */
export interface Order {
    orderId: string;
    userId: string;
    orderStatus: OrderStatus;
    shippingInfo: ShippingInfo;
    totalProductAmount: number;
    shippingFee: number;
    discountAmount: number;
    finalAmount: number;
    holdExpiresAt: string; // ISO8601 (생성 시점 + 10분)
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

/** 주문서 작성 전 미리보기 계산 결과 Payload (PRD 3.3) */
export interface PrepareCheckoutPayload {
    items: Array<{
        productId: string;
        optionId?: string;
        skuId: string;
        quantity: number;
    }>;
}

/** 주문서 미리보기 계산 응답 (실시간 결제예정금액) */
export interface CheckoutSummary {
    totalProductAmount: number; // 총 상품금액
    shippingFee: number;         // 배송비
    discountAmount: number;      // 총 할인금액
    finalAmount: number;         // 최종 결제 예정 금액
    items: Array<{
        productId: string;
        productName: string;
        optionName?: string;
        skuId: string;
        price: number;
        quantity: number;
    }>;
}

/** 주문 생성 및 재고 임시 점유 Payload (PRD 3.4) */
export interface CreateOrderPayload {
    shippingInfo: ShippingInfo;
    items: Array<{
        productId: string;
        optionId?: string;
        skuId: string;
        quantity: number;
    }>;
}