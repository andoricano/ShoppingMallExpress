// hooks/useOrderSection.ts

"use client";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import type {
    OrderShippingAddress,
} from "@mall/types";

import { useCartStore } from "@/store/cartStore";

export function useOrderSection() {
    const items = useCartStore(
        (state) => state.items,
    );

    const [selectedItemIds, setSelectedItemIds] =
        useState<string[]>([]);

    const [shippingAddress, setShippingAddress] =
        useState<OrderShippingAddress>({
            name: "",
            recipient: "",
            phone: "",
            postalCode: "",
            address: "",
            detailAddress: "",
        });

    const selectedItems = useMemo(
        () =>
            items.filter((item) =>
                selectedItemIds.includes(
                    item.product.id,
                ),
            ),
        [items, selectedItemIds],
    );

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

    const selectItem = useCallback(
        (
            productId: string,
            selected: boolean,
        ) => {
            setSelectedItemIds((current) => {
                if (selected) {
                    return current.includes(productId)
                        ? current
                        : [...current, productId];
                }

                return current.filter(
                    (id) => id !== productId,
                );
            });
        },
        [],
    );

    const handleAddressChange =
        useCallback(
            (
                address: OrderShippingAddress,
            ) => {
                setShippingAddress(address);
            },
            [],
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

            console.log(
                "quantity change:",
                item.product.id,
                quantity,
            );
        },
        [items],
    );

    const handleRemove = useCallback(
        (index: number) => {
            const item = items[index];

            if (!item) {
                return;
            }

            console.log(
                "remove order item:",
                item.product.id,
            );
        },
        [items],
    );

    return {
        items,
        selectedItems,
        selectedItemIds,
        shippingAddress,
        productPrice,

        selectItem,
        handleQuantityChange,
        handleRemove,
        handleAddressChange,
    };
}