// stores/wishlistStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Wishlist } from "@mall/types";

interface WishlistStore {
    items: Wishlist[];

    // 서버 Wishlist 전체 반영
    setItems: (
        items: Wishlist[],
    ) => void;

    // Wishlist 추가
    addItem: (
        item: Wishlist,
    ) => void;

    // Wishlist 삭제
    removeItem: (
        productPostId: string,
    ) => void;

    // Wishlist 전체 초기화
    clearWishlist: () => void;
}

export const useWishlistStore =
    create<WishlistStore>()(
        persist(
            (set) => ({
                items: [],

                setItems: (items) =>
                    set({
                        items,
                    }),

                addItem: (item) =>
                    set((state) => {
                        const exists =
                            state.items.some(
                                (value) =>
                                    value.productPostId ===
                                    item.productPostId,
                            );

                        if (exists) {
                            return state;
                        }

                        return {
                            items: [
                                item,
                                ...state.items,
                            ],
                        };
                    }),

                removeItem: (
                    productPostId,
                ) =>
                    set((state) => ({
                        items:
                            state.items.filter(
                                (item) =>
                                    item.productPostId !==
                                    productPostId,
                            ),
                    })),

                clearWishlist: () =>
                    set({
                        items: [],
                    }),
            }),
            {
                name: "client-wishlist",
            },
        ),
    );