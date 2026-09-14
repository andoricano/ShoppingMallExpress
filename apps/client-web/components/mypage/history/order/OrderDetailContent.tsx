"use client";

import type { Order } from "@mall/types";

import OrderStatusCard from "./content/OrderStatusCard";
import OrderShippingCard from "./content/OrderShippingCard";
import OrderProductCard from "./content/OrderProductCard";

interface OrderDeliveryStatus {
    carrier: string;
    trackingNumber: string;
    status: string;
}

interface OrderDetailContentProps {
    order: Order;
    deliveryStatus: OrderDeliveryStatus | null;

    onCancel?: () => void;
    onEdit?: () => void;
    onExchange?: () => void;
    onRefund?: () => void;
}

export default function OrderDetailContent({
    order,
    deliveryStatus,
    onCancel,
    onEdit,
    onExchange,
    onRefund,
}: OrderDetailContentProps) {
    return (
        <div className="space-y-5">
            {/* 주문 상태 */}
            <OrderStatusCard
                status={order.status}
                delivery={order.delivery}
                deliveryStatus={
                    deliveryStatus
                }
                onCancel={onCancel}
                onEdit={onEdit}
                onExchange={onExchange}
                onRefund={onRefund}
            />

            {/* 주문 상품 */}
            <OrderProductCard
                items={order.items}
            />

            {/* 배송지 */}
            <OrderShippingCard
                address={
                    order.shippingAddress
                }
            />
        </div>
    );
}