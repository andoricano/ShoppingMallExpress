"use client";

import type { OrderItem } from "@mall/types";

import OrderProductItem from "./OrderProductItem";

interface OrderProductCardProps {
    items: OrderItem[];
    totalAmount: number;
}

export default function OrderProductCard({
    items,
    totalAmount,
}: OrderProductCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <p className="text-sm font-medium text-slate-500">주문 상품</p>

                <p className="mt-1 text-sm text-slate-500">
                    {items.reduce((total, item) => total + item.quantity, 0)}개 상품
                </p>
            </div>

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm text-slate-500">주문 상품이 없습니다.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {items.map((item) => (
                        <OrderProductItem key={item.id} item={item} />
                    ))}
                </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                <span className="text-sm text-slate-500">총 주문 금액</span>
                <span className="text-lg font-bold text-slate-900">
                    {totalAmount.toLocaleString("ko-KR")}원
                </span>
            </div>
        </section>
    );
}
