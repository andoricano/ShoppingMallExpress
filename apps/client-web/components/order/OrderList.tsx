// components/order/OrderList.tsx

"use client";

import type { Product } from "@mall/types";

import { OrderListItem } from "./OrderListItem";

interface OrderListData {
    product: Product;
    quantity: number;
}

interface OrderListProps {
    items: OrderListData[];

    onQuantityChange?: (
        index: number,
        quantity: number,
    ) => void;

    onRemove?: (index: number) => void;
}

export function OrderList({
    items,
    onQuantityChange,
    onRemove,
}: OrderListProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                    주문 상품
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    주문하실 상품을 확인해주세요.
                </p>
            </div>

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm text-slate-500">
                        주문 상품이 없습니다.
                    </p>
                </div>
            ) : (
                <div>
                    {items.map((item, index) => (
                        <OrderListItem
                            key={item.product.id}
                            product={item.product}
                            quantity={item.quantity}
                            onQuantityChange={(
                                quantity,
                            ) =>
                                onQuantityChange?.(
                                    index,
                                    quantity,
                                )
                            }
                            onRemove={() =>
                                onRemove?.(index)
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    );
}