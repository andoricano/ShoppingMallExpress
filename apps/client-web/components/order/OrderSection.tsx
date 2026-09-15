"use client";

import type {
    OrderShippingAddress,
} from "@mall/types";


import {
    useOrderSection,
} from "@/hooks/order/useOrderSection";
import { usePayment } from "@/hooks/order/usePayment";
import OrderPanel from "./order/OrderPanel";
import PaymentPanel from "./payment/PaymentPanel";


interface OrderSectionProps {
    onOrderSubmit: (
        items: {
            productId: string;
            quantity: number;
        }[],
        shippingAddress: OrderShippingAddress,
        productPrice: number,
        pointAmount: number,
        paymentPrice: number,
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

    const {
        usablePoint,
        pointAmount,
        paymentPrice,
        pointLoading,
        fetchPoint,

        handlePointConfirm,
    } = usePayment({
        productPrice,
    });
    const handleSubmit = () => {
        if (selectedItems.length === 0) {
            return;
        }

        onOrderSubmit(
            selectedItems.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
            })),
            shippingAddress,
            productPrice,
            pointAmount,
            paymentPrice,
        );
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 2xl:max-w-6xl">
                <div className="space-y-5">
                    <OrderPanel
                        items={items}
                        selectedItems={
                            selectedItems
                        }
                        selectedItemIds={
                            selectedItemIds
                        }
                        shippingAddress={
                            shippingAddress
                        }
                        onSelect={
                            selectItem
                        }
                        onQuantityChange={
                            handleQuantityChange
                        }
                        onRemove={
                            handleRemove
                        }
                        onAddressChange={
                            handleAddressChange
                        }
                    />

                    <PaymentPanel
                        productPrice={
                            productPrice
                        }
                        pointBalance={
                            usablePoint
                        }
                        pointAmount={
                            pointAmount
                        }
                        paymentPrice={
                            paymentPrice
                        }
                        loading={
                            pointLoading
                        }
                        onRefreshPoint={
                            fetchPoint
                        }
                        onConfirmPoint={
                            handlePointConfirm
                        }
                        onSubmit={
                            handleSubmit
                        }
                        disabled={
                            selectedItems.length ===
                            0
                        }
                    />
                </div>
            </div>
        </main>
    );
}