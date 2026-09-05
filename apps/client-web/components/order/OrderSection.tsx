// components/order/OrderSection.tsx

"use client";

import { OrderSummary } from "./OrderSummary";
import { OrderList } from "./OrderList";
import { OrderShippingAddress } from "./OrderShippingAddress";
import { OrderShippingAddressCheckBox } from "./OrderShippingAddressCheckBox";
import { OrderPaymentSummary } from "./OrderPaymentSummary";
import { OrderSubmit } from "./OrderSubmit";

export function OrderSection() {
    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 2xl:max-w-6xl">
                <div className="space-y-5">
                    <OrderSummary items={[]} />

                    <OrderList items={[]} />

                    <OrderShippingAddress
                        address=""
                        onAddressChange={() => { }}
                    />

                    <OrderShippingAddressCheckBox
                        onChange={() => { }}
                    />

                    <OrderPaymentSummary
                        productPrice={0}
                    />

                    <OrderSubmit
                        totalPrice={0}
                        onSubmit={() => { }}
                    />
                </div>
            </div>
        </main>
    );
}