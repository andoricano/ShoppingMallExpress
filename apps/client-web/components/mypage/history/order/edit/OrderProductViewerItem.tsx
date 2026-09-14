"use client";

import type { OrderItem } from "@mall/types";

interface OrderProductViewerItemProps {
    item: OrderItem;
}

const FALLBACK_IMAGE =
    "/ic_target_512.png";

export default function OrderProductViewerItem({
    item,
}: OrderProductViewerItemProps) {
    const totalPrice =
        item.price * item.quantity;

    return (
        <article className="flex gap-4 border-b border-slate-200 bg-white py-5 last:border-b-0">
            {/* 상품 이미지 */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img
                    src={FALLBACK_IMAGE}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                />
            </div>

            {/* 상품 정보 */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                            {item.productName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            {item.price.toLocaleString(
                                "ko-KR",
                            )}
                            원
                        </p>
                    </div>
                </div>

                {/* 수량 / 주문 당시 금액 */}
                <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">
                        수량 {item.quantity}개
                    </p>

                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {totalPrice.toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </p>
                </div>
            </div>
        </article>
    );
}