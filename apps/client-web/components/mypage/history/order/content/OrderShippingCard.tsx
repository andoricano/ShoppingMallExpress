"use client";

import type { OrderShippingAddress } from "@mall/types";

interface OrderShippingCardProps {
    address: OrderShippingAddress;
}

export default function OrderShippingCard({
    address,
}: OrderShippingCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    배송지
                </p>

                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    배송 주소
                </h2>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-6 text-sm">
                        <span className="shrink-0 text-slate-500">
                            받는 분
                        </span>

                        <span className="text-right font-medium text-slate-900">
                            {address.recipient ||
                                address.name ||
                                "-"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-6 text-sm">
                        <span className="shrink-0 text-slate-500">
                            연락처
                        </span>

                        <span className="text-right font-medium text-slate-900">
                            {address.phone ||
                                "-"}
                        </span>
                    </div>

                    <div className="flex items-start justify-between gap-6 text-sm">
                        <span className="shrink-0 text-slate-500">
                            주소
                        </span>

                        <div className="text-right text-slate-900">
                            {address.postalCode && (
                                <p className="font-medium">
                                    (
                                    {
                                        address.postalCode
                                    }
                                    )
                                </p>
                            )}

                            <p className="mt-1 font-medium">
                                {address.address ||
                                    "-"}
                            </p>

                            {address.detailAddress && (
                                <p className="mt-1 text-slate-500">
                                    {
                                        address.detailAddress
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}