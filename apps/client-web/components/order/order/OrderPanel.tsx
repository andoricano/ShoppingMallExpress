"use client";

import type {
    OrderShippingAddress,
} from "@mall/types";

import { OrderList } from "./OrderList";
import { OrderSummary } from "./OrderSummary";
import { OrderShippingAddressBox } from "./OrderShippingAddressBox";
import { OrderShippingAddressCheckBox } from "./OrderShippingAddressCheckBox";

interface OrderPanelProps {
    items: any[];
    selectedItems: any[];
    selectedItemIds: string[];
    shippingAddress: OrderShippingAddress;

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
        address: OrderShippingAddress,
    ) => void;
}

export default function OrderPanel({
    items,
    selectedItems,
    selectedItemIds,
    shippingAddress,
    onSelect,
    onQuantityChange,
    onRemove,
    onAddressChange,
}: OrderPanelProps) {
    return (
        <section className="space-y-5">
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

            <OrderShippingAddressBox
                address={
                    shippingAddress.address
                }
                onAddressChange={(
                    address,
                ) =>
                    onAddressChange({
                        ...shippingAddress,
                        address,
                    })
                }
            />

            <OrderShippingAddressCheckBox
                value={
                    shippingAddress.address
                }
                onChange={(address) =>
                    onAddressChange({
                        ...shippingAddress,
                        address,
                    })
                }
            />
        </section>
    );
}