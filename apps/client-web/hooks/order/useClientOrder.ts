"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    CartItem,
    JsonObject,
    Order,
    OrderItem,
    OrderShippingAddressInput,
    OrderStatus,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";

type OrderItemRow = {
    id: string;
    order_id: string;
    product_id: string;
    product_variant_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_name_snapshot: string;
    variant_label_snapshot: string | null;
    option_snapshot: JsonObject;
    image_url_snapshot: string | null;
    created_at: string;
};

type OrderRow = {
    id: string;
    client_id: string;
    order_number: string | null;
    status: OrderStatus;
    shipping_address: JsonObject | null;
    subtotal: number;
    discount_amount: number;
    shipping_amount: number;
    total_amount: number;
    payment_reference: string | null;
    ordered_at: string;
    created_at: string;
    updated_at: string;
    order_items: OrderItemRow[] | null;
};

// Consumer-readable columns only; internal Ware allocations are never selected.
const ORDER_SELECT =
    "id, client_id, order_number, status, shipping_address, subtotal, discount_amount, shipping_amount, total_amount, payment_reference, ordered_at, created_at, updated_at, order_items(id, order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot, variant_label_snapshot, option_snapshot, image_url_snapshot, created_at)";

function toOrderItem(row: OrderItemRow): OrderItem {
    return {
        id: row.id,
        orderId: row.order_id,
        productId: row.product_id,
        productVariantId: row.product_variant_id,
        quantity: row.quantity,
        unitPrice: Number(row.unit_price),
        lineTotal: Number(row.line_total),
        productNameSnapshot: row.product_name_snapshot,
        variantLabelSnapshot: row.variant_label_snapshot,
        optionSnapshot: row.option_snapshot,
        imageUrlSnapshot: row.image_url_snapshot,
        createdAt: row.created_at,
    };
}

function toOrder(row: OrderRow): Order {
    return {
        id: row.id,
        clientId: row.client_id,
        orderNumber: row.order_number,
        status: row.status,
        shippingAddress: row.shipping_address,
        subtotal: Number(row.subtotal),
        discountAmount: Number(row.discount_amount),
        shippingAmount: Number(row.shipping_amount),
        totalAmount: Number(row.total_amount),
        paymentReference: row.payment_reference,
        orderedAt: row.ordered_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: (row.order_items ?? [])
            .map(toOrderItem)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
}

const UUID_PATTERN =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Maps create_order_from_cart() errors to user messages. The variant id in a
 * stock/availability error is resolved to the cart item's name; no stock
 * quantity is ever shown.
 */
export function toOrderErrorMessage(
    error: unknown,
    cartItems: CartItem[] = [],
) {
    const message =
        typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "";

    const variantId = message.match(UUID_PATTERN)?.[0];
    const item = cartItems.find(
        (cartItem) => cartItem.productVariantId === variantId,
    );
    const itemName = item
        ? [item.productName, item.variantLabel].filter(Boolean).join(" / ")
        : "일부 상품";

    if (message.includes("Authentication required")) {
        return "로그인이 필요합니다.";
    }

    if (
        message.includes("Cart is empty")
        || message.includes("Cart does not exist")
    ) {
        return "장바구니가 비어 있습니다.";
    }

    if (message.includes("Insufficient stock")) {
        return `${itemName}의 재고가 부족합니다. 수량을 줄이거나 장바구니에서 삭제해 주세요.`;
    }

    if (message.includes("is not available")) {
        return `${itemName}은(는) 현재 판매하지 않는 상품입니다. 장바구니에서 삭제해 주세요.`;
    }

    return "주문을 생성하지 못했습니다.";
}

/**
 * Consumer Order boundary: `create_order_from_cart()` for creation (trusted
 * prices, immutable OrderItem snapshots, internal stock allocation, Cart
 * cleared on success) and owner-scoped RLS reads of orders/order_items.
 */
export function useClientOrder() {
    const [creating, setCreating] = useState(false);

    const createOrderFromCart = useCallback(
        async (shippingAddress: OrderShippingAddressInput) => {
            setCreating(true);

            try {
                const { data, error } = await createClient().rpc(
                    "create_order_from_cart",
                    {
                        p_shipping_address: shippingAddress,
                        // Payment is not part of the Mall v2 Consumer flow yet.
                        p_payment_reference: null,
                    },
                );

                if (error) {
                    throw error;
                }

                return data as string;
            } finally {
                setCreating(false);
            }
        },
        [],
    );

    const fetchOrder = useCallback(async (orderId: string) => {
        const { data, error } = await createClient()
            .from("orders")
            .select(ORDER_SELECT)
            .eq("id", orderId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data ? toOrder(data as OrderRow) : null;
    }, []);

    return {
        creating,
        createOrderFromCart,
        fetchOrder,
    };
}
