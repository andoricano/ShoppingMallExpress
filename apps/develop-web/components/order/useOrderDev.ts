"use client";

import { useState } from "react";
import { useCart } from "./useCart";
import { useWishlist } from "./useWishlist";
import { useCheckout } from "./useCheckout";
import type { Order, AuditLog } from "@mall/types";

export function useOrderDev(userId: string = "dev-user-01") {
    // 1. UI 전용 상태 (탭, 선택된 주문, 감사 로그 등)
    const [activeTab, setActiveTab] = useState<"overview" | "checkout" | "cart" | "simulate" | "audit">("overview");
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    // 2. 도메인 커스텀 훅 호출 (합성)
    const { cartItems, updateCartItem, deleteCartItems, addToCart, fetchCartItems } = useCart(userId);
    const { wishlist: wishlistItems, toggleWishlist, fetchWishlist } = useWishlist(userId);
    const { prepareCheckout, createOrder } = useCheckout(userId);

    // 3. OrderDevSection UI 핸들러 매핑 (Wrapper 역할)
    const handleUpdateCartQuantity = async (cartId: string, quantity: number) => {
        await updateCartItem(cartId, { quantity });
    };

    const handleToggleCartCheck = async (cartId: string, checked: boolean) => {
        await updateCartItem(cartId, { isChecked: checked });
    };

    const handleRemoveCartItem = async (cartId: string) => {
        await deleteCartItems([cartId]);
    };

    const handleClearCart = async () => {
        const allIds = cartItems.map((item) => item.cartId);
        await deleteCartItems(allIds);
    };

    // 관심상품 -> 장바구니 이동 (Wishlist 삭제 + Cart 추가)
    const handleMoveWishlistToCart = async (productId: string) => {
        const success = await addToCart({ productId, quantity: 1 });
        if (success) {
            await toggleWishlist(productId); // 위시리스트에서 제거
        }
    };

    const handleRemoveWishlistItem = async (productId: string) => {
        await toggleWishlist(productId);
    };

    // 시뮬레이터 / 관리자 전용 핸들러 (대시보드 전용)
    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        // 백엔드 상태 변경 API 호출 및 orders 상태 갱신
        setOrders((prev) =>
            prev.map((o) => (o.orderId === orderId ? { ...o, status: status as any } : o))
        );
    };

    const handleSimulatePaymentWebhook = async (payload: any) => {
        console.log("결제 웹훅 시뮬레이션:", payload);
    };

    const handleSimulateStockExpiration = async (orderId: string) => {
        console.log("재고 만료 시뮬레이션:", orderId);
    };

    return {
        // UI 상태
        activeTab,
        setActiveTab,
        selectedOrderId,
        setSelectedOrderId,
        orders,
        auditLogs,

        // 도메인 데이터
        cartItems,
        wishlistItems,

        // 핸들러
        handlePrepareCheckout: prepareCheckout,
        handleCreateOrder: createOrder,
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