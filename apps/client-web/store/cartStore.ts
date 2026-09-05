// stores/cartStore.ts

import { create } from "zustand";

import type { CartItem } from "@mall/types";


interface CartStore {
    items: CartItem[];

    // 장바구니 상품 추가
    addItem: (
        item: CartItem,
    ) => void;

    // 장바구니 상품 제거
    removeItem: (
        productId: string,
    ) => void;

    // 장바구니 상품 수량 변경
    updateQuantity: (
        productId: string,
        quantity: number,
    ) => void;

    // 장바구니 비우기
    clearCart: () => void;

    // 선택한 상품들을 장바구니에 추가
    addItems: (
        items: CartItem[],
    ) => void;
}

export const useCartStore =
    create<CartStore>((set) => ({
        items: [],

        addItem: (item) =>
            set((state) => {
                const existingItem =
                    state.items.find(
                        (value) =>
                            value.product.id ===
                            item.product.id,
                    );

                if (existingItem) {
                    return {
                        items: state.items.map(
                            (value) =>
                                value.product.id ===
                                    item.product.id
                                    ? {
                                        ...value,
                                        quantity:
                                            value.quantity +
                                            item.quantity,
                                    }
                                    : value,
                        ),
                    };
                }

                return {
                    items: [
                        ...state.items,
                        item,
                    ],
                };
            }),

        addItems: (items) =>
            set((state) => {
                const nextItems = [
                    ...state.items,
                ];

                for (const item of items) {
                    const existingIndex =
                        nextItems.findIndex(
                            (value) =>
                                value.product.id ===
                                item.product.id,
                        );

                    if (
                        existingIndex === -1
                    ) {
                        nextItems.push(item);
                        continue;
                    }

                    nextItems[
                        existingIndex
                    ] = {
                        ...nextItems[
                        existingIndex
                        ],
                        quantity:
                            nextItems[
                                existingIndex
                            ].quantity +
                            item.quantity,
                    };
                }

                return {
                    items: nextItems,
                };
            }),

        removeItem: (productId) =>
            set((state) => ({
                items: state.items.filter(
                    (item) =>
                        item.product.id !==
                        productId,
                ),
            })),

        updateQuantity: (
            productId,
            quantity,
        ) =>
            set((state) => ({
                items: state.items.map(
                    (item) =>
                        item.product.id ===
                            productId
                            ? {
                                ...item,
                                quantity:
                                    Math.max(
                                        1,
                                        quantity,
                                    ),
                            }
                            : item,
                ),
            })),

        clearCart: () =>
            set({
                items: [],
            }),

        // TODO: 추후 Cart API 연결
        // 원격 User Cart와 동기화하는 로직 추가
    }));