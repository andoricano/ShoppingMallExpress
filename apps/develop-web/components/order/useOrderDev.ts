// apps/develop-web/components/order/useOrderDev.ts
"use client";

import { useState, useCallback } from "react";
import type {
    Order,
    OrderStatus,
    CartItem,
    WishlistItem,
    PrepareCheckoutPayload,
    CreateOrderPayload,
    CheckoutSummary,
} from "@mall/types";
import { useOrderApi } from "./useOrderApi";

/** 감사 로그 항목 인터페이스 */
export interface AuditLogItem {
    id: string;
    timestamp: string;
    action: string;
    orderId?: string;
    details: string;
}

export function useOrderDev() {
    // 공통 API 훅 로드
    const { loading, prepareCheckout, createOrder } = useOrderApi();

    // 1. 활성화된 메인 탭 상태
    const [activeTab, setActiveTab] = useState<
        "overview" | "checkout" | "cart" | "simulate" | "audit"
    >("overview");

    // 2. 모의 주문 데이터 목록 상태
    const [orders, setOrders] = useState<Order[]>([
        {
            orderId: "ORD_20260320_001",
            userId: "USER_101",
            orderStatus: "PAYMENT_PENDING",
            shippingInfo: {
                recipientName: "김철수",
                recipientPhone: "010-1234-5678",
                shippingAddress: "서울특별시 강남구 테헤란로 123",
                shippingRequest: "문 앞에 놓아주세요.",
                isPickup: false,
            },
            totalProductAmount: 50000,
            shippingFee: 3000,
            discountAmount: 2000,
            finalAmount: 51000,
            holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            items: [
                {
                    orderItemId: "ITEM_101",
                    orderId: "ORD_20260320_001",
                    productId: "PROD_001",
                    skuId: "SKU_BLACK_XL",
                    productName: "베이직 무지 티셔츠",
                    price: 25000,
                    quantity: 2,
                    createdAt: new Date().toISOString(),
                },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            orderId: "ORD_20260320_002",
            userId: "USER_102",
            orderStatus: "ORDER_RECEIVED",
            shippingInfo: {
                recipientName: "이영희",
                recipientPhone: "010-9876-5432",
                shippingAddress: "경기도 성남시 분당구 판교역로 456",
                isPickup: true,
                pickupLocation: "판교점 픽업존",
            },
            totalProductAmount: 89000,
            shippingFee: 0,
            discountAmount: 5000,
            finalAmount: 84000,
            holdExpiresAt: new Date().toISOString(),
            items: [
                {
                    orderItemId: "ITEM_102",
                    orderId: "ORD_20260320_002",
                    productId: "PROD_002",
                    skuId: "SKU_DENIM_M",
                    productName: "슬림핏 데님 팬츠",
                    price: 89000,
                    quantity: 1,
                    createdAt: new Date().toISOString(),
                },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ]);

    // 3. 모의 장바구니 및 위시리스트 상태
    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            cartItemId: "CART_001",
            cartId: "CART_MASTER_01",
            productId: "PROD_001",
            skuId: "SKU_BLACK_XL",
            quantity: 2,
            isChecked: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            productInfo: {
                productName: "베이직 무지 티셔츠",
                mainImageUrl: "",
                status: "DISPLAY",
                price: { basePrice: 25000, discountedPrice: 23000 },
            },
            optionInfo: {
                optionName: "색상/사이즈",
                optionValue: "Black / XL",
                surcharge: 0,
            },
        },
    ]);

    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
        {
            wishlistId: "WISH_001",
            userId: "USER_101",
            productId: "PROD_003",
            createdAt: new Date().toISOString(),
            productInfo: {
                productName: "경량 패딩 조끼",
                mainImageUrl: "",
                status: "DISPLAY",
                price: { basePrice: 59000, discountedPrice: 49000 },
            },
        },
    ]);

    // 4. 감사 로그 및 선택된 주문 modal 상태
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // 감사 로그 추가 헬퍼
    const addAuditLog = useCallback((action: string, details: string, orderId?: string) => {
        setAuditLogs((prev) => [
            {
                id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                timestamp: new Date().toLocaleString("ko-KR"),
                action,
                orderId,
                details,
            },
            ...prev,
        ]);
    }, []);

    // [핸들러] 주문 상태 변경 (PRD 3.5)
    const handleUpdateOrderStatus = useCallback(
        (orderId: string, newStatus: OrderStatus) => {
            setOrders((prev) =>
                prev.map((o) =>
                    o.orderId === orderId
                        ? { ...o, orderStatus: newStatus, updatedAt: new Date().toISOString() }
                        : o
                )
            );
            addAuditLog("주문 상태 변경", `주문 상태가 '${newStatus}'(으)로 업데이트 되었습니다.`, orderId);
        },
        [addAuditLog]
    );

    // [핸들러] 주문서 미리보기 계산 연동 (PRD 3.3)
    const handlePrepareCheckout = useCallback(
        async (payload: PrepareCheckoutPayload): Promise<CheckoutSummary | null> => {
            const res = await prepareCheckout(payload);
            if (res.success && res.data) {
                addAuditLog("주문서 미리보기 계산", `상품 ${payload.items.length}건 정산 금액 계산 완료`);
                return res.data;
            }
            return null;
        },
        [prepareCheckout, addAuditLog]
    );

    // [핸들러] 주문 생성 연동 (PRD 3.4)
    const handleCreateOrder = useCallback(
        async (payload: CreateOrderPayload) => {
            const res = await createOrder(payload);
            if (res.success && res.data) {
                const newOrder: Order = {
                    orderId: res.data.orderId,
                    userId: "USER_DEV",
                    orderStatus: res.data.orderStatus as OrderStatus,
                    shippingInfo: payload.shippingInfo,
                    totalProductAmount: 50000,
                    shippingFee: 3000,
                    discountAmount: 0,
                    finalAmount: 53000,
                    holdExpiresAt: res.data.holdExpiresAt,
                    items: payload.items.map((item, idx) => ({
                        orderItemId: `ITEM_${Date.now()}_${idx}`,
                        orderId: res.data.orderId,
                        productId: item.productId,
                        optionId: item.optionId,
                        skuId: item.skuId,
                        productName: `신규 주문 상품 (${item.productId})`,
                        price: 25000,
                        quantity: item.quantity,
                        createdAt: new Date().toISOString(),
                    })),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                setOrders((prev) => [newOrder, ...prev]);
                addAuditLog("신규 주문 생성", "주문이 생성되고 재고가 10분간 점유되었습니다.", newOrder.orderId);
            }
            return res;
        },
        [createOrder, addAuditLog]
    );

    // [핸들러] PG 결제 웹훅 수신 시뮬레이션
    const handleSimulatePaymentWebhook = useCallback(
        async (orderId: string, success: boolean) => {
            const targetStatus: OrderStatus = success ? "ORDER_RECEIVED" : "CANCELLED";
            handleUpdateOrderStatus(orderId, targetStatus);
            addAuditLog(
                "PG 결제 웹훅 수신",
                `결제 웹훅 처리 결과: ${success ? "승인 성공" : "결제 실패/취소"}`,
                orderId
            );
        },
        [handleUpdateOrderStatus, addAuditLog]
    );

    // [핸들러] 10분 재고 점유 만료 시뮬레이션
    const handleSimulateStockExpiration = useCallback(
        async (orderId: string) => {
            handleUpdateOrderStatus(orderId, "CANCELLED");
            addAuditLog("재고 점유 만료", "10분 미결제로 인해 재고 점유 해제 및 주문 자동 취소됨", orderId);
        },
        [handleUpdateOrderStatus, addAuditLog]
    );

    // [핸들러] 장바구니 수량/선택 변경 및 삭제
    const handleUpdateCartQuantity = useCallback((cartItemId: string, newQuantity: number) => {
        setCartItems((prev) =>
            prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item))
        );
    }, []);

    const handleToggleCartCheck = useCallback((cartItemId: string, isChecked: boolean) => {
        setCartItems((prev) =>
            prev.map((item) => (item.cartItemId === cartItemId ? { ...item, isChecked } : item))
        );
    }, []);

    const handleRemoveCartItem = useCallback((cartItemId: string) => {
        setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    }, []);

    const handleClearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    // [핸들러] 위시리스트 이동 및 삭제
    const handleMoveWishlistToCart = useCallback((wishlistId: string) => {
        setWishlistItems((prev) => prev.filter((item) => item.wishlistId !== wishlistId));
        addAuditLog("위시리스트 이동", `위시리스트(${wishlistId}) 항목이 장바구니로 이동되었습니다.`);
    }, [addAuditLog]);

    const handleRemoveWishlistItem = useCallback((wishlistId: string) => {
        setWishlistItems((prev) => prev.filter((item) => item.wishlistId !== wishlistId));
    }, []);

    return {
        activeTab,
        setActiveTab,
        loading,
        orders,
        cartItems,
        wishlistItems,
        auditLogs,
        selectedOrderId,
        setSelectedOrderId,
        handlePrepareCheckout,
        handleCreateOrder,
        handleUpdateOrderStatus,
        handleSimulatePaymentWebhook,
        handleSimulateStockExpiration,
        handleUpdateCartQuantity,
        handleToggleCartCheck,
        handleRemoveCartItem,
        handleClearCart,
        handleMoveWishlistToCart,
        handleRemoveWishlistItem,
    };
}