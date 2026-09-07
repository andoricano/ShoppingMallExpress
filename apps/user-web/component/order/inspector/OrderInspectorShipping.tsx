// components/orders/inspector/OrderInspectorShipping.tsx

"use client";

import type { Order } from "@mall/types";

interface OrderInspectorShippingProps {
    order: Order;
}

export function OrderInspectorShipping({
    order,
}: OrderInspectorShippingProps) {
    const shippingAddress = order.shippingAddress;
    const delivery = order.delivery;

    return (
        <section className="border-b border-slate-200 px-5 py-4">
            {/* 배송지 */}
            <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                    배송지 정보
                </h3>

                <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center">
                        <span className="w-20 shrink-0 text-xs text-slate-400">
                            수령인
                        </span>
                        <span className="text-slate-700">
                            {shippingAddress?.recipient ||
                                "정보 없음"}
                        </span>
                    </div>

                    <div className="flex items-center">
                        <span className="w-20 shrink-0 text-xs text-slate-400">
                            연락처
                        </span>
                        <span className="text-slate-700">
                            {shippingAddress?.phone ||
                                "정보 없음"}
                        </span>
                    </div>

                    <div className="flex items-start">
                        <span className="w-20 shrink-0 pt-0.5 text-xs text-slate-400">
                            배송지
                        </span>

                        <div className="text-slate-700">
                            {shippingAddress?.postalCode && (
                                <p className="mb-0.5 text-xs text-slate-400">
                                    ({shippingAddress.postalCode})
                                </p>
                            )}

                            <p>
                                {shippingAddress?.address ||
                                    "주소 정보 없음"}
                            </p>

                            {shippingAddress?.detailAddress && (
                                <p>
                                    {shippingAddress.detailAddress}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 배송 정보 */}
            <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                    배송 정보
                </h3>

                {delivery ? (
                    <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                        <div className="flex items-center">
                            <span className="w-20 shrink-0 text-xs text-slate-400">
                                택배사
                            </span>
                            <span className="text-slate-700">
                                {delivery.carrier ||
                                    "-"}
                            </span>
                        </div>

                        <div className="flex items-center">
                            <span className="w-20 shrink-0 text-xs text-slate-400">
                                운송장
                            </span>
                            <span className="font-mono text-xs text-slate-700">
                                {delivery.trackingNumber ||
                                    "-"}
                            </span>
                        </div>

                        <div className="flex items-center">
                            <span className="w-20 shrink-0 text-xs text-slate-400">
                                출고일시
                            </span>
                            <span className="text-xs text-slate-700">
                                {delivery.shippedAt
                                    ? new Date(
                                        delivery.shippedAt,
                                    ).toLocaleString(
                                        "ko-KR",
                                    )
                                    : "-"}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg bg-slate-50 px-3 py-5 text-center text-xs text-slate-400">
                        아직 출고되지 않았습니다.
                    </div>
                )}
            </div>
        </section>
    );
}