// apps/user-web/app/orders/page.tsx

"use client";

import React from "react";
import type {
    Order,
    OrderStatus,
} from "@mall/types";

import { useAdminOrders } from "@/hooks/orders/useAdminOrders";
import { OrderAdminHeader } from "@/component/order/OrderAdminHeader";
import { OrderListContent } from "@/component/order/table/OrderListContent";
import { OrderInspector } from "@/component/order/inspector/OrderInspector";

export default function AdminOrdersPage() {
    const {
        orderList,
        selectedOrder,
        loading,
        error,
        fetchOrders,
        fetchOrder,
        updateOrderStatus,
    } = useAdminOrders();

    const [
        statusFilter,
        setStatusFilter,
    ] = React.useState<OrderStatus>(
        "PENDING",
    );

    const [
        search,
        setSearch,
    ] = React.useState("");

    React.useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSearch = (
        value: string,
    ) => {
        setSearch(value);
    };

    const handleReset = () => {
        setSearch("");
        setStatusFilter("PENDING");
    };

    const filteredOrders =
        React.useMemo(() => {
            const keyword =
                search.trim().toLowerCase();

            return orderList.filter(
                (order) => {
                    if (
                        order.status !==
                        statusFilter
                    ) {
                        return false;
                    }

                    if (!keyword) {
                        return true;
                    }

                    return (
                        order.id
                            .toLowerCase()
                            .includes(
                                keyword,
                            ) ||
                        order.clientId
                            .toLowerCase()
                            .includes(
                                keyword,
                            )
                    );
                },
            );
        }, [
            orderList,
            statusFilter,
            search,
        ]);

    const handleDetail = async (
        order: Order,
    ) => {
        await fetchOrder(order.id);
    };

    const handleCancel = async (
        order: Order,
    ) => {
        await updateOrderStatus(
            order.id,
            {
                status: "CANCELLED",
            },
        );

        await fetchOrders();
    };

    const handleComplete = async (
        order: Order,
    ) => {
        await updateOrderStatus(
            order.id,
            {
                status: "COMPLETED",
            },
        );

        await fetchOrders();
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <OrderAdminHeader />

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        <span className="font-semibold">
                            ⚠️ 오류 발생:
                        </span>

                        <span>{error}</span>
                    </div>
                )}

                {/* 좌 / 우 */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]">
                    {/* 좌측 - Order Table */}
                    <section className="min-w-0">
                        <OrderListContent
                            orders={filteredOrders}
                            loading={loading}
                            status={statusFilter}
                            onStatusChange={
                                setStatusFilter
                            }
                            onSearch={
                                handleSearch
                            }
                            onReset={
                                handleReset
                            }
                            onCancel={
                                handleCancel
                            }
                            onDetail={
                                handleDetail
                            }
                        />
                    </section>

                    {/* 우측 - Inspector */}
                    <aside className="min-w-0">
                        <OrderInspector
                            order={selectedOrder}
                            onCancel={handleCancel}
                            onComplete={
                                handleComplete
                            }
                        />
                    </aside>
                </div>
            </div>
        </div>
    );
}
