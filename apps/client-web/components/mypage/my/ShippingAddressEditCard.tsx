"use client";

import { useEffect, useState } from "react";

import type {
    ClientAddress,
} from "@mall/types";

interface ShippingAddressEditCardProps {
    address?: ClientAddress | null;

    saving?: boolean;
    error?: string | null;

    onSave: (data: {
        label?: string;
        recipientName: string;
        phone: string;
        zonecode: string;
        address: string;
        addressDetail?: string;
        isDefault: boolean;
    }) => void | Promise<void>;

    onCancel: () => void;
}

export function ShippingAddressEditCard({
    address,
    saving = false,
    error = null,
    onSave,
    onCancel,
}: ShippingAddressEditCardProps) {
    const [label, setLabel] =
        useState(address?.label ?? "");

    const [
        recipientName,
        setRecipientName,
    ] = useState(
        address?.recipientName ?? "",
    );

    const [phone, setPhone] = useState(
        address?.phone ?? "",
    );

    const [zonecode, setZonecode] =
        useState(address?.zonecode ?? "");

    const [addressValue, setAddressValue] =
        useState(
            address?.address ?? "",
        );

    const [
        addressDetail,
        setAddressDetail,
    ] = useState(
        address?.addressDetail ?? "",
    );

    const [isDefault, setIsDefault] =
        useState(
            address?.isDefault ?? false,
        );

    useEffect(() => {
        setLabel(address?.label ?? "");
        setRecipientName(
            address?.recipientName ?? "",
        );
        setPhone(address?.phone ?? "");
        setZonecode(
            address?.zonecode ?? "",
        );
        setAddressValue(
            address?.address ?? "",
        );
        setAddressDetail(
            address?.addressDetail ?? "",
        );
        setIsDefault(
            address?.isDefault ?? false,
        );
    }, [address]);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        await onSave({
            label: label.trim() || undefined,
            recipientName:
                recipientName.trim(),
            phone: phone.trim(),
            zonecode: zonecode.trim(),
            address: addressValue.trim(),
            addressDetail:
                addressDetail.trim() ||
                undefined,
            isDefault,
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    {address
                        ? "배송지 수정"
                        : "배송지 추가"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    배송 정보를 입력해주세요.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
            >
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        배송지 이름
                    </label>

                    <input
                        type="text"
                        value={label}
                        onChange={(event) =>
                            setLabel(
                                event.target.value,
                            )
                        }
                        placeholder="예: 집, 회사"
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        받는 사람
                    </label>

                    <input
                        type="text"
                        value={
                            recipientName
                        }
                        onChange={(event) =>
                            setRecipientName(
                                event.target
                                    .value,
                            )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        전화번호
                    </label>

                    <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                            setPhone(
                                event.target
                                    .value,
                            )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        우편번호
                    </label>

                    <input
                        type="text"
                        value={zonecode}
                        onChange={(event) =>
                            setZonecode(
                                event.target.value,
                            )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        주소
                    </label>

                    <input
                        type="text"
                        value={
                            addressValue
                        }
                        onChange={(event) =>
                            setAddressValue(
                                event.target
                                    .value,
                            )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        상세 주소
                    </label>

                    <input
                        type="text"
                        value={
                            addressDetail
                        }
                        onChange={(event) =>
                            setAddressDetail(
                                event.target
                                    .value,
                            )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(event) =>
                            setIsDefault(
                                event.target
                                    .checked,
                            )
                        }
                        disabled={saving}
                        className="h-4 w-4 rounded border-slate-300"
                    />

                    <span className="text-sm font-medium text-slate-700">
                        기본 배송지로 설정
                    </span>
                </label>

                {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        취소
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving
                            ? "저장 중..."
                            : address
                                ? "수정하기"
                                : "추가하기"}
                    </button>
                </div>
            </form>
        </section>
    );
}