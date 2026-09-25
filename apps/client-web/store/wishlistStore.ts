// stores/wishlistStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
    ProductPostSummary,
    Wishlist,
} from "@mall/types";

/**
 * Wishlist row with its ProductPost summary. `productPost` is null when the
 * post is no longer published (hidden by the public ProductPost RLS).
 */
export interface WishlistItemView extends Wishlist {
    productPost: ProductPostSummary | null;
}

interface WishlistStore {
    items: WishlistItemView[];

    // 서버 Wishlist 전체 반영
    setItems: (
        items: WishlistItemView[],
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

                // v1: rows carry a ProductPost summary; cached legacy
                // (Express) wishlist rows are discarded.
                version: 1,
                migrate: () => ({
                    items: [],
                }),
            },
        ),
    );
