"use client";

import type { OrderShippingAddress } from "@mall/types";

interface OrderShippingAddressEditorProps {
    address: OrderShippingAddress;

    onChange: (
        address: OrderShippingAddress,
    ) => void;
}

export default function OrderShippingAddressEditor({
    address,
    onChange,
}: OrderShippingAddressEditorProps) {
    const updateField = (
        field: keyof OrderShippingAddress,
        value: string,
    ) => {
        onChange({
            ...address,
            [field]: value,
        });
    };

    const handleAddressSelect = () => {
        // TODO:
        // 실제 주소 검색 API 연결
        onChange({
            ...address,
            postalCode: "16300",
            address:
                "경기도 수원시 장안구 파장동",
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                배송지
            </h2>

            <div className="mt-5 space-y-4">
                {/* 배송지 이름 */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        배송지 이름
                    </label>

                    <input
                        type="text"
                        value={address.name}
                        onChange={(event) =>
                            updateField(
                                "name",
                                event.target.value,
                            )
                        }
                        placeholder="배송지 이름"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
                    />
                </div>

                {/* 받는 분 */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        받는 분
                    </label>

                    <input
                        type="text"
                        value={address.recipient}
                        onChange={(event) =>
                            updateField(
                                "recipient",
                                event.target.value,
                            )
                        }
                        placeholder="받는 분"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
                    />
                </div>

                {/* 연락처 */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        연락처
                    </label>

                    <input
                        type="tel"
                        value={address.phone}
                        onChange={(event) =>
                            updateField(
                                "phone",
                                event.target.value,
                            )
                        }
                        placeholder="연락처"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
                    />
                </div>

                {/* 주소 */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        주소
                    </label>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={
                                address.postalCode
                            }
                            readOnly
                            placeholder="우편번호"
                            className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                        />

                        <button
                            type="button"
                            onClick={
                                handleAddressSelect
                            }
                            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                            주소 검색
                        </button>
                    </div>

                    <input
                        type="text"
                        value={
                            address.address
                        }
                        readOnly
                        placeholder="주소"
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    />
                </div>

                {/* 상세 주소 */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        상세 주소
                    </label>

                    <input
                        type="text"
                        value={
                            address.detailAddress ??
                            ""
                        }
                        onChange={(event) =>
                            updateField(
                                "detailAddress",
                                event.target.value,
                            )
                        }
                        placeholder="상세 주소"
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
                    />
                </div>
            </div>
        </section>
    );
}