// components/order/OrderSection.tsx

"use client";

import type { Product } from "@mall/types";

import { OrderSummary } from "./OrderSummary";
import { OrderList } from "./OrderList";
import { OrderShippingAddress } from "./OrderShippingAddress";
import { OrderShippingAddressCheckBox } from "./OrderShippingAddressCheckBox";
import { OrderPaymentSummary } from "./OrderPaymentSummary";
import { OrderSubmit } from "./OrderSubmit";

interface OrderItemData {
    product: Product;
    quantity: number;
}

interface OrderSectionProps {
    items: OrderItemData[];

    selectedItemIds: string[];
    shippingAddress: string;

    productPrice: number;

    onSelect: (
        productId: string,
        selected: boolean,
    ) => void;

    onQuantityChange: (
        index: number,
        quantity: number,
    ) => void;

    onRemove: (
        index: number,
    ) => void;

    onAddressChange: (
        address: string,
    ) => void;

    onSubmit: () => void;
}

export function OrderSection({
    items,
    selectedItemIds,
    shippingAddress,
    productPrice,
    onSelect,
    onQuantityChange,
    onRemove,
    onAddressChange,
    onSubmit,
}: OrderSectionProps) {
    const selectedItems = items.filter(
        (item) =>
            selectedItemIds.includes(
                item.product.id,
            ),
    );

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 2xl:max-w-6xl">
                <div className="space-y-5">
                    <OrderSummary
                        items={selectedItems}
                    />

                    <OrderList
                        items={items}
                        selectedItemIds={
                            selectedItemIds
                        }
                        onSelect={onSelect}
                        onQuantityChange={
                            onQuantityChange
                        }
                        onRemove={onRemove}
                    />

                    <OrderShippingAddress
                        address={
                            shippingAddress
                        }
                        onAddressChange={
                            onAddressChange
                        }
                    />

                    <OrderShippingAddressCheckBox
                        value={
                            shippingAddress
                        }
                        onChange={
                            onAddressChange
                        }
                    />

                    <OrderPaymentSummary
                        productPrice={
                            productPrice
                        }
                    />

                    <OrderSubmit
                        totalPrice={
                            productPrice
                        }
                        disabled={
                            selectedItems.length ===
                            0
                        }
                        onSubmit={onSubmit}
                    />
                </div>
            </div>
        </main>
    );
}