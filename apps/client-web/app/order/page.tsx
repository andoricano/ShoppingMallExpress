"use client";

import { useRouter } from "next/navigation";

import { OrderSection } from "@/components/order/OrderSection";

export default function OrderPage() {
    const router = useRouter();

    return (
        <OrderSection
            onOrderCreated={(orderId) => {
                router.replace(
                    `/success?orderId=${encodeURIComponent(orderId)}`,
                );
            }}
        />
    );
}
