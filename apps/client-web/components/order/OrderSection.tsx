// components/order/OrderSection.tsx

"use client";

import type {
    OrderShippingAddress,
} from "@mall/types";

import { OrderSummary } from "./OrderSummary";
import { OrderList } from "./OrderList";
import { OrderShippingAddress as OrderShippingAddressComponent } from "./OrderShippingAddress";
import { OrderShippingAddressCheckBox } from "./OrderShippingAddressCheckBox";
import { OrderPaymentSummary } from "./OrderPaymentSummary";
import { OrderSubmit } from "./OrderSubmit";

import { useOrderSection } from "@/hooks/useOrderSection";

interface OrderSectionProps {
    onOrderSubmit: (
        clientId: string,
        paymentId: string,
        items: {
            productId: string;
            quantity: number;
        }[],
        shippingAddress: OrderShippingAddress,
    ) => void;
}

export function OrderSection({
    onOrderSubmit,
}: OrderSectionProps) {
    const {
        items,
        selectedItems,
        selectedItemIds,
        shippingAddress,
        productPrice,

        selectItem,
        handleQuantityChange,
        handleRemove,
        handleAddressChange,
    } = useOrderSection();

    const handleSubmit = () => {
        if (selectedItems.length === 0) {
            return;
        }

        onOrderSubmit(
            "",
            "",
            selectedItems.map(
                (item) => ({
                    productId:
                        item.product.id,
                    quantity:
                        item.quantity,
                }),
            ),
            shippingAddress,
        );
    };

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
                        onSelect={selectItem}
                        onQuantityChange={
                            handleQuantityChange
                        }
                        onRemove={
                            handleRemove
                        }
                    />

                    <OrderShippingAddressComponent
                        address={
                            shippingAddress.address
                        }
                        onAddressChange={(
                            address,
                        ) =>
                            handleAddressChange({
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
                            handleAddressChange({
                                ...shippingAddress,
                                address,
                            })
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
                        onSubmit={
                            handleSubmit
                        }
                    />
                </div>
            </div>
        </main>
    );
}