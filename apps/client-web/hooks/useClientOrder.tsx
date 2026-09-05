// hooks/useClientOrder.ts

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CLIENT_ORDER_API,
} from "@mall/constants";

import type {
    CartItem,
    Order,
    OrderShippingAddress,
} from "@mall/types";

import { useCartStore } from "@/store/cartStore";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

// ==========================================
// Types
// ==========================================

interface CreateOrderItem {
    productId: string;
    quantity: number;
}

interface CreateOrderPayload {
    clientId: string;
    paymentId: string;
    items: CreateOrderItem[];
    shippingAddress: OrderShippingAddress;
}

// ==========================================
// Hook
// ==========================================

export function useClientOrder() {
    // ------------------------------------------
    // Cart
    // ------------------------------------------

    const items = useCartStore(
        (state) => state.items,
    );

    // ------------------------------------------
    // Order
    // ------------------------------------------

    const [order, setOrder] =
        useState<Order | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // ------------------------------------------
    // 주문 선택 상품
    // ------------------------------------------

    const [selectedItemIds, setSelectedItemIds] =
        useState<string[]>([]);

    // ------------------------------------------
    // 배송지
    // ------------------------------------------

    const [shippingAddress, setShippingAddress] =
        useState("");

    // ------------------------------------------
    // Cart → 초기 선택
    // ------------------------------------------

    useEffect(() => {
        setSelectedItemIds(
            items.map(
                (item) => item.product.id,
            ),
        );
    }, [items]);

    // ==========================================
    // 선택 상품
    // ==========================================

    const selectedItems = useMemo(
        () =>
            items.filter((item) =>
                selectedItemIds.includes(
                    item.product.id,
                ),
            ),
        [items, selectedItemIds],
    );

    // ==========================================
    // 상품 금액
    // ==========================================

    const productPrice = useMemo(
        () =>
            selectedItems.reduce(
                (total, item) =>
                    total +
                    item.product.price *
                    item.quantity,
                0,
            ),
        [selectedItems],
    );

    // ==========================================
    // 상품 선택
    // ==========================================

    const selectItem = useCallback(
        (
            productId: string,
            selected: boolean,
        ) => {
            setSelectedItemIds((current) => {
                if (selected) {
                    return current.includes(
                        productId,
                    )
                        ? current
                        : [
                            ...current,
                            productId,
                        ];
                }

                return current.filter(
                    (id) =>
                        id !== productId,
                );
            });
        },
        [],
    );

    // ==========================================
    // 상품 수량 변경
    // ==========================================

    const updateItemQuantity =
        useCartStore(
            (state) =>
                state.updateQuantity,
        );

    const handleQuantityChange = useCallback(
        (
            index: number,
            quantity: number,
        ) => {
            const item = items[index];

            if (!item) {
                return;
            }

            updateItemQuantity(
                item.product.id,
                quantity,
            );
        },
        [items, updateItemQuantity],
    );

    // ==========================================
    // 상품 삭제
    // ==========================================

    const removeItem = useCartStore(
        (state) => state.removeItem,
    );

    const handleRemove = useCallback(
        (index: number) => {
            const item = items[index];

            if (!item) {
                return;
            }

            removeItem(item.product.id);

            setSelectedItemIds((current) =>
                current.filter(
                    (id) =>
                        id !==
                        item.product.id,
                ),
            );
        },
        [items, removeItem],
    );

    // ==========================================
    // 배송지
    // ==========================================

    const handleAddressChange =
        useCallback(
            (address: string) => {
                setShippingAddress(address);
            },
            [],
        );

    // ==========================================
    // 주문 생성 API
    // ==========================================

    const createOrder = useCallback(
        async (
            payload: CreateOrderPayload,
        ) => {
            setLoading(true);
            setError(null);

            try {
                const url =
                    `${API_BASE_URL}${CLIENT_ORDER_API.BASE}`;

                const response =
                    await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            payload,
                        ),
                    });

                const result =
                    await response
                        .json()
                        .catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        "주문 생성에 실패했습니다.",
                    );
                }

                const orderData =
                    result?.data as Order;

                setOrder(orderData);

                return orderData;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "주문 생성에 실패했습니다.";

                console.error(
                    "[useClientOrder] 주문 생성 실패:",
                    err,
                );

                setError(message);
                setOrder(null);

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // 주문 제출
    // ==========================================

    const submitOrder = useCallback(
        async () => {
            if (
                selectedItems.length === 0
            ) {
                return null;
            }

            return createOrder({
                clientId:
                    "TEMP_CLIENT_ID",
                paymentId:
                    "TEMP_PAYMENT_ID",

                items: selectedItems.map(
                    (item) => ({
                        productId:
                            item.product.id,
                        quantity:
                            item.quantity,
                    }),
                ),

                shippingAddress: {
                    recipient: "",
                    phone: "",
                    postalCode: "",
                    address:
                        shippingAddress,
                },
            });
        },
        [
            selectedItems,
            shippingAddress,
            createOrder,
        ],
    );

    // ==========================================
    // 주문 상태 초기화
    // ==========================================

    const clearOrder = useCallback(() => {
        setOrder(null);
        setError(null);
    }, []);

    return {
        items,
        selectedItems,
        selectedItemIds,
        shippingAddress,
        productPrice,

        order,
        loading,
        error,

        selectItem,
        handleQuantityChange,
        handleRemove,
        handleAddressChange,

        createOrder,
        submitOrder,
        clearOrder,
    };
}