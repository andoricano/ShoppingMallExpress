"use client";

import type { OrderShippingAddress } from "@mall/types";

interface OrderShippingCardProps {
    address: OrderShippingAddress;
}

function text(value: unknown) {
    return typeof value === "string" && value.trim() ? value : null;
}

/** Order-time shipping snapshot (ClientAddress field names). */
export default function OrderShippingCard({
    address,
}: OrderShippingCardProps) {
    const snapshot = address ?? {};

    const rows: [string, string | null][] = [
        ["받는 분", text(snapshot.recipientName)],
        ["연락처", text(snapshot.phone)],
    ];

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">배송지</p>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-6">
                        <span className="shrink-0 text-slate-500">{label}</span>
                        <span className="text-right font-medium text-slate-900">{value ?? "-"}</span>
                    </div>
                ))}

                <div className="flex items-start justify-between gap-6">
                    <span className="shrink-0 text-slate-500">주소</span>

                    <div className="text-right text-slate-900">
                        {text(snapshot.zonecode) && (
                            <p className="font-medium">({text(snapshot.zonecode)})</p>
                        )}
                        <p className="mt-1 font-medium">{text(snapshot.address) ?? "-"}</p>
                        {text(snapshot.addressDetail) && (
                            <p className="mt-1 text-slate-500">{text(snapshot.addressDetail)}</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
