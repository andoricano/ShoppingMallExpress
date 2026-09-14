"use client";

import type {
    OrderDelivery,
} from "@mall/types";

interface OrderDeliveryStatus {
    carrier: string;
    trackingNumber: string;
    status: string;
}

interface OrderDeliveryCardProps {
    delivery: OrderDelivery | null;
    deliveryStatus: OrderDeliveryStatus | null;
}

export default function OrderDeliveryCard({
    delivery,
    deliveryStatus,
}: OrderDeliveryCardProps) {
    if (!delivery) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        배송 정보
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                        배송 준비 중
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        아직 상품이 출고되지 않았습니다.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        배송 정보
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                        {delivery.carrier}
                    </h2>
                </div>

                {deliveryStatus && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                        {deliveryStatus.status}
                    </span>
                )}
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                        송장번호
                    </span>

                    <span className="font-medium text-slate-900">
                        {delivery.trackingNumber}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                        출고일
                    </span>

                    <time
                        dateTime={
                            delivery.shippedAt
                        }
                        className="font-medium text-slate-900"
                    >
                        {delivery.shippedAt}
                    </time>
                </div>
            </div>
        </section>
    );
}