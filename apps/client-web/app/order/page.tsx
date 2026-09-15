"use client";

import { useRouter } from "next/navigation";

import { OrderSection } from "@/components/order/OrderSection";
import { usePaymentStore } from "@/store/paymentStore";

export default function OrderPage() {
    const router = useRouter();

    const setPayment =
        usePaymentStore(
            (state) => state.setPayment,
        );

    const handleOrderSubmit = (
        items: {
            productId: string;
            quantity: number;
        }[],
        shippingAddress: Parameters<
            typeof setPayment
        >[0]["shippingAddress"],
        productPrice: number,
        pointAmount: number,
        paymentPrice: number,
    ) => {
        setPayment({
            items,
            shippingAddress,
            productPrice,
            pointAmount,
            paymentPrice,
        });

        router.push(
            "/payment",
        );
    };

    return (
        <OrderSection
            onOrderSubmit={
                handleOrderSubmit
            }
        />
    );
}