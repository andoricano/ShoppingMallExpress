// components/orders/list/OrderStatusFilter.tsx

"use client";

import React from "react";
import type { OrderStatus } from "@mall/types";

interface OrderStatusFilterProps {
    value: OrderStatus;
    onChange: (status: OrderStatus) => void;
}

interface FilterItem {
    status: OrderStatus;
    label: string;
}

const filterItems: FilterItem[] = [
    {
        status: "PENDING",
        label: "대기중",
    },
    {
        status: "SHIPPING",
        label: "배송중",
    },
    {
        status: "COMPLETED",
        label: "완료",
    },
    {
        status: "CANCELLED",
        label: "취소",
    },
];

export const OrderStatusFilter: React.FC<
    OrderStatusFilterProps
> = ({
    value,
    onChange,
}) => {
        return (
            <div className="w-full rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex flex-wrap items-center gap-1">
                    {filterItems.map((item) => {
                        const isActive =
                            value === item.status;

                        return (
                            <button
                                key={item.status}
                                type="button"
                                onClick={() =>
                                    onChange(
                                        item.status,
                                    )
                                }
                                className={[
                                    "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                                    isActive
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                ].join(" ")}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };