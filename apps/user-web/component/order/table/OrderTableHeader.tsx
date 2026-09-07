// components/orders/list/OrderTableHeader.tsx

"use client";

import React from "react";
import type { OrderStatus } from "@mall/types";

import { OrderSearchBar } from "./OrderSearchBar";
import { OrderStatusFilter } from "./OrderStatusFilter";

interface OrderTableHeaderProps {
    status: OrderStatus;
    onStatusChange: (
        status: OrderStatus,
    ) => void;

    onSearch: (
        search: string,
    ) => void;

    onReset: () => void;
}

export const OrderTableHeader: React.FC<
    OrderTableHeaderProps
> = ({
    status,
    onStatusChange,
    onSearch,
    onReset,
}) => {
        return (
            <div className="space-y-3">
                <OrderSearchBar
                    onSearch={onSearch}
                    onReset={onReset}
                />

                <OrderStatusFilter
                    value={status}
                    onChange={onStatusChange}
                />
            </div>
        );
    };