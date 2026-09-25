// hooks/order/useOrderSection.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { ClientAddress } from "@mall/types";

import { shippingAddressClient } from "@/lib/shippingAddressClient";
import { useCart } from "@/hooks/user/useCart";
import {
    toOrderErrorMessage,
    useClientOrder,
} from "@/hooks/order/useClientOrder";

/**
 * Order shipping snapshot. Uses the ClientAddress field names (the shipping
 * address Source of Truth); it is stored as-is in orders.shipping_address.
 */
export interface OrderShippingForm {
    recipientName: string;
    phone: string;
    zonecode: string;
    address: string;
    addressDetail: string;
}

const EMPTY_SHIPPING: OrderShippingForm = {
    recipientName: "",
    phone: "",
    zonecode: "",
    address: "",
    addressDetail: "",
};

function toShippingForm(address: ClientAddress): OrderShippingForm {
    return {
        recipientName: address.recipientName,
        phone: address.phone,
        zonecode: address.zonecode,
        address: address.address,
        addressDetail: address.addressDetail ?? "",
    };
}

export function useOrderSection() {
    const cartState = useCart();
    const { items, fetchCart } = cartState;
    const { creating, createOrderFromCart } = useClientOrder();

    const [addresses, setAddresses] =
        useState<ClientAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] =
        useState<string | null>(null);
    const [shipping, setShipping] =
        useState<OrderShippingForm>(EMPTY_SHIPPING);
    const [orderError, setOrderError] =
        useState<string | null>(null);

    // Saved addresses (default first) through the owner RLS on client_addresses.
    const fetchAddresses = useCallback(async () => {
        const list = await shippingAddressClient
            .getMyAddresses()
            .catch(() => []);

        setAddresses(list);

        const initial = list.find((item) => item.isDefault) ?? list[0];

        if (initial) {
            setSelectedAddressId(initial.id);
            setShipping(toShippingForm(initial));
        }
    }, []);

    useEffect(() => {
        fetchCart().then((cart) => {
            if (cart) {
                fetchAddresses();
            }
        });
    }, [fetchCart, fetchAddresses]);

    const selectAddress = useCallback(
        (addressId: string | null) => {
            setSelectedAddressId(addressId);

            const address = addresses.find((item) => item.id === addressId);
            setShipping(address ? toShippingForm(address) : EMPTY_SHIPPING);
        },
        [addresses],
    );

    const updateShipping = useCallback(
        (patch: Partial<OrderShippingForm>) => {
            setSelectedAddressId(null);
            setShipping((current) => ({ ...current, ...patch }));
        },
        [],
    );

    // Current cart prices are an estimate; the order uses server snapshots.
    const estimatedTotal = useMemo(
        () =>
            items.reduce(
                (total, item) => total + item.price * item.quantity,
                0,
            ),
        [items],
    );

    const unavailableItems = useMemo(
        () => items.filter((item) => !item.isAvailable),
        [items],
    );

    const missingShipping =
        !shipping.recipientName.trim()
        || !shipping.phone.trim()
        || !shipping.zonecode.trim()
        || !shipping.address.trim();

    const canSubmit =
        items.length > 0
        && unavailableItems.length === 0
        && !missingShipping
        && !creating;

    /** Returns the created order id, or null when the order was rejected. */
    const submitOrder = useCallback(async () => {
        setOrderError(null);

        if (missingShipping) {
            setOrderError("수령인, 연락처, 우편번호, 주소를 입력해 주세요.");
            return null;
        }

        try {
            const orderId = await createOrderFromCart({
                recipientName: shipping.recipientName.trim(),
                phone: shipping.phone.trim(),
                zonecode: shipping.zonecode.trim(),
                address: shipping.address.trim(),
                addressDetail: shipping.addressDetail.trim() || null,
            });

            // create_order_from_cart() cleared the server Cart.
            await fetchCart();

            return orderId;
        } catch (cause) {
            setOrderError(toOrderErrorMessage(cause, items));

            // The failed order rolled back; refresh availability/status.
            await fetchCart();

            return null;
        }
    }, [createOrderFromCart, fetchCart, items, missingShipping, shipping]);

    return {
        cart: cartState,

        addresses,
        selectedAddressId,
        selectAddress,

        shipping,
        updateShipping,

        estimatedTotal,
        unavailableItems,

        creating,
        canSubmit,
        orderError,
        submitOrder,
    };
}
