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
    const address = shippingAddress ?? {};
    const value = (key: string) => {
        const candidate = address[key];
        return typeof candidate === "string" ? candidate : undefined;
    };

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
                            {value("recipientName") ?? value("recipient") ??
                                "정보 없음"}
                        </span>
                    </div>

                    <div className="flex items-center">
                        <span className="w-20 shrink-0 text-xs text-slate-400">
                            연락처
                        </span>
                        <span className="text-slate-700">
                            {value("phone") ||
                                "정보 없음"}
                        </span>
                    </div>

                    <div className="flex items-start">
                        <span className="w-20 shrink-0 pt-0.5 text-xs text-slate-400">
                            배송지
                        </span>

                        <div className="text-slate-700">
                            {(value("zonecode") ?? value("postalCode")) && (
                                <p className="mb-0.5 text-xs text-slate-400">
                                    ({value("zonecode") ?? value("postalCode")})
                                </p>
                            )}

                            <p>
                                {value("address") ||
                                    "주소 정보 없음"}
                            </p>

                            {(value("addressDetail") ?? value("detailAddress")) && (
                                <p>
                                    {value("addressDetail") ?? value("detailAddress")}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
                운송장 정보는 현재 확정된 Mall v2 Order 계약에 포함되지 않습니다.
            </p>
        </section>
    );
}
