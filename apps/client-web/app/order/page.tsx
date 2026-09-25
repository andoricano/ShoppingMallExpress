"use client";

import { useRouter } from "next/navigation";

import { OrderSection } from "@/components/order/OrderSection";

export default function OrderPage() {
    const router = useRouter();

    return (
        <OrderSection
            onOrderCreated={(orderId) => {
                // The Order is PENDING; pay it through ORDER_PAYMENT.
                router.replace(
                    `/payment?orderId=${encodeURIComponent(orderId)}`,
                );
            }}
        />
    );
}
