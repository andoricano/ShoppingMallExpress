// hooks/user/useCartEditor.ts

"use client";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import type { CartItem } from "@mall/types";

export function useCartEditor(
    initialItems: CartItem[],
) {
    const [
        items,
        setItems,
    ] = useState<CartItem[]>(
        initialItems,
    );

    // ==========================================
    // 수량 증가
    // ==========================================

    const increase = useCallback(
        (productId: string) => {
            setItems((current) =>
                current.map((item) =>
                    item.product.id ===
                        productId
                        ? {
                            ...item,
                            quantity:
                                item.quantity +
                                1,
                        }
                        : item,
                ),
            );
        },
        [],
    );

    // ==========================================
    // 수량 감소
    // ==========================================

    const decrease = useCallback(
        (productId: string) => {
            setItems((current) =>
                current
                    .map((item) =>
                        item.product
                            .id ===
                            productId
                            ? {
                                ...item,
                                quantity:
                                    Math.max(
                                        1,
                                        item.quantity -
                                        1,
                                    ),
                            }
                            : item,
                    ),
            );
        },
        [],
    );

    // ==========================================
    // 상품 제거
    // ==========================================

    const remove = useCallback(
        (productId: string) => {
            setItems((current) =>
                current.filter(
                    (item) =>
                        item.product.id !==
                        productId,
                ),
            );
        },
        [],
    );

    // ==========================================
    // 초기 Cart 동기화
    // ==========================================

    const reset = useCallback(
        (nextItems: CartItem[]) => {
            setItems(nextItems);
        },
        [],
    );

    // ==========================================
    // 변경 여부
    // ==========================================

    const hasChanges = useMemo(() => {
        if (
            items.length !==
            initialItems.length
        ) {
            return true;
        }

        return items.some(
            (item, index) => {
                const initialItem =
                    initialItems[index];

                if (!initialItem) {
                    return true;
                }

                return (
                    item.product.id !==
                    initialItem.product.id ||
                    item.quantity !==
                    initialItem.quantity
                );
            },
        );
    }, [items, initialItems]);

    return {
        items,

        increase,
        decrease,
        remove,

        reset,
        hasChanges,
    };
}