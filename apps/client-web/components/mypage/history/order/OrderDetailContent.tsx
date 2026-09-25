"use client";

import type {
    Order,
    RefundRequest,
} from "@mall/types";

import type { RefundItemInput } from "@/hooks/history/useOrderAfterSales";

import OrderStatusCard from "./content/OrderStatusCard";
import OrderShippingCard from "./content/OrderShippingCard";
import OrderProductCard from "./content/OrderProductCard";
import OrderRefundCard from "./content/OrderRefundCard";

interface OrderDetailContentProps {
    order: Order;
    refunds: RefundRequest[];
    actionLoading?: boolean;

    onCancel?: () => void;
    onRefund?: (
        items: RefundItemInput[],
        reason: string | null,
    ) => Promise<boolean>;
}

export default function OrderDetailContent({
    order,
    refunds,
    actionLoading = false,
    onCancel,
    onRefund,
}: OrderDetailContentProps) {
    return (
        <div className="space-y-5">
            <OrderStatusCard
                status={order.status}
                disabled={actionLoading}
                onCancel={onCancel}
            />

            <OrderProductCard
                items={order.items}
                totalAmount={order.totalAmount}
            />

            <OrderRefundCard
                order={order}
                refunds={refunds}
                disabled={actionLoading}
                onSubmit={onRefund}
            />

            <OrderShippingCard
                address={order.shippingAddress}
            />
        </div>
    );
}
