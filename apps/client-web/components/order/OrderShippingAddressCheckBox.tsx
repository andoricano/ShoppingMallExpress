// components/order/OrderShippingAddressCheckBox.tsx

"use client";

import { useState } from "react";

interface ShippingAddressOption {
    id: string;
    title: string;
    address: string;
}

interface OrderShippingAddressCheckBoxProps {
    value?: string;
    onChange?: (address: string) => void;
}

const addressOptions: ShippingAddressOption[] = [
    {
        id: "recent",
        title: "최근 배송지",
        address:
            "경기도 수원시 장안구 파장동",
    },
    {
        id: "home",
        title: "집",
        address:
            "경기도 수원시 장안구 정자동",
    },
    {
        id: "company",
        title: "회사",
        address:
            "경기도 성남시 황새울로",
    },
    {
        id: "friend",
        title: "친구",
        address:
            "서울특별시 잠실역",
    },
];

export function OrderShippingAddressCheckBox({
    value,
    onChange,
}: OrderShippingAddressCheckBoxProps) {
    const [selectedId, setSelectedId] =
        useState<string | null>(null);

    const handleSelect = (
        option: ShippingAddressOption,
    ) => {
        setSelectedId(option.id);
        onChange?.(option.address);
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                배송지 선택
            </h2>

            <div className="mt-5 space-y-3">
                {addressOptions.map((option) => {
                    const isSelected =
                        selectedId === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                                handleSelect(option)
                            }
                            className={`w-full rounded-xl border p-4 text-left transition-colors ${isSelected
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {option.title}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {option.address}
                                    </p>
                                </div>

                                <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected
                                            ? "border-slate-900"
                                            : "border-slate-300"
                                        }`}
                                >
                                    {isSelected && (
                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                                    )}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}