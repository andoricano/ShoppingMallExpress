"use client";

import { ClientAddress } from "@mall/types";


interface ShippingAddressCardProps {
    address: ClientAddress;

    onEdit: (
        address: ClientAddress,
    ) => void;

    onDelete: (
        address: ClientAddress,
    ) => void;

    onSetDefault: (
        address: ClientAddress,
    ) => void;
}

export function ShippingAddressCard({
    address,
    onEdit,
    onDelete,
    onSetDefault,
}: ShippingAddressCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                            {address.label ||
                                "배송지"}
                        </h3>

                        {address.isDefault && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                기본 배송지
                            </span>
                        )}
                    </div>

                    <p className="mt-2 text-sm font-medium text-slate-900">
                        {address.recipientName}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                        {address.phone}
                    </p>

                    <div className="mt-3 text-sm text-slate-700">
                        <p>
                            (
                            {address.zonecode}
                            ){" "}
                            {address.address}
                        </p>

                        {address.addressDetail && (
                            <p className="mt-1">
                                {
                                    address.addressDetail
                                }
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        onEdit(address)
                    }
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                    수정
                </button>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                {!address.isDefault ? (
                    <button
                        type="button"
                        onClick={() =>
                            onSetDefault(
                                address,
                            )
                        }
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                        기본 배송지로 설정
                    </button>
                ) : (
                    <span className="text-sm text-slate-400">
                        기본 배송지입니다.
                    </span>
                )}

                <button
                    type="button"
                    onClick={() =>
                        onDelete(address)
                    }
                    className="text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                    삭제
                </button>
            </div>
        </section>
    );
}