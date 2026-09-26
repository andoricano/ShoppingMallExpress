"use client";

import { useRouter } from "next/navigation";

import { OrderSection } from "@/components/order/OrderSection";
import { MALL_V3 } from "@/lib/mallVersion";

export default function OrderPage() {
    const router = useRouter();

    return (
        <OrderSection
            onOrderCreated={(orderId) => {
                if (MALL_V3) {
                    // v3: only a Payment exists so far; the Order is created at finalize.
                    router.replace("/payment?checkout=1");
                    return;
                }

                // v2: the Order is PENDING; pay it through ORDER_PAYMENT.
                router.replace(
                    `/payment?orderId=${encodeURIComponent(orderId)}`,
                );
            }}
        />
    );
}
