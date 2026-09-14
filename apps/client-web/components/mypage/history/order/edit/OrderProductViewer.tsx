"use client";

import type { OrderItem } from "@mall/types";

import OrderProductViewerItem from "./OrderProductViewerItem";

interface OrderProductViewerProps {
    items: OrderItem[];
}

export default function OrderProductViewer({
    items,
}: OrderProductViewerProps) {
    const totalQuantity =
        items.reduce(
            (total, item) =>
                total + item.quantity,
            0,
        );

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                    주문 상품
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    주문하신 상품을 확인해주세요.
                </p>
            </div>

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm text-slate-500">
                        주문 상품이 없습니다.
                    </p>
                </div>
            ) : (
                <>
                    <div>
                        {items.map((item) => (
                            <OrderProductViewerItem
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                        <span className="text-sm text-slate-500">
                            총 상품 수량
                        </span>

                        <span className="text-sm font-semibold text-slate-900">
                            {totalQuantity}개
                        </span>
                    </div>
                </>
            )}
        </section>
    );
}