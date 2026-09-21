// components/order/list/OrderListContent.tsx

"use client";

import React from "react";
import type { Order, OrderStatus } from "@mall/types";

import { OrderTableHeader } from "./OrderTableHeader";
import { OrderTable } from "./OrderTable";

interface OrderListContentProps {
    orders: Order[];
    loading?: boolean;

    status: OrderStatus;
    onStatusChange: (
        status: OrderStatus,
    ) => void;

    onSearch: (search: string) => void;
    onReset: () => void;

    onCancel?: (order: Order) => void;
    onDetail?: (order: Order) => void;
}

export function OrderListContent({
    orders,
    loading = false,

    status,
    onStatusChange,

    onSearch,
    onReset,

    onCancel,
    onDetail,
}: OrderListContentProps) {
    return (
        <section className="min-w-0 space-y-4">
            <OrderTableHeader
                status={status}
                onStatusChange={onStatusChange}
                onSearch={onSearch}
                onReset={onReset}
            />

            <OrderTable
                orders={orders}
                loading={loading}
                onCancel={onCancel}
                onDetail={onDetail}
            />
        </section>
    );
}
