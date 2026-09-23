// components/orders/list/OrderTable.tsx

"use client";

import React from "react";
import type { Order } from "@mall/types";

import { OrderTableItem } from "./OrderTableItem";

interface OrderTableProps {
    orders: Order[];

    loading?: boolean;

    onDetail?: (order: Order) => void;
}

export const OrderTable: React.FC<
    OrderTableProps
> = ({
    orders,
    loading = false,
    onDetail,
}) => {
        return (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Table Header */}
                <div className="border-b border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">
                            주문 목록
                        </h2>

                        {!loading && (
                            <span className="text-xs text-slate-400">
                                총 {orders.length}건
                            </span>
                        )}
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="px-4 py-16 text-center text-sm text-slate-400">
                            주문 목록을 불러오는 중입니다...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="px-4 py-16 text-center text-sm text-slate-400">
                            해당 조건의 주문이 없습니다.
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div
                                key={order.id}
                                className="p-3"
                            >
                                <OrderTableItem
                                    order={order}
                                    onDetail={onDetail}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };
