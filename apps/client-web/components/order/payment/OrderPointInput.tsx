"use client";

import { getMaxPointAmount, normalizePointAmount } from "@/utils/orderUtils";
import { useEffect, useState } from "react";


interface OrderPointInputProps {
    balance: number;
    maxPurchaseAmount: number;
    value: number;

    loading?: boolean;

    onRefresh?: () => void;
    onConfirm: (amount: number) => void;
}

export default function OrderPointInput({
    balance,
    maxPurchaseAmount,
    value,
    loading = false,
    onRefresh,
    onConfirm,
}: OrderPointInputProps) {
    const [
        inputAmount,
        setInputAmount,
    ] = useState("");

    useEffect(() => {
        const maxAmount =
            getMaxPointAmount(
                balance,
                maxPurchaseAmount,
            );

        const appliedAmount =
            value > 0
                ? normalizePointAmount(
                      value,
                      balance,
                      maxPurchaseAmount,
                  )
                : maxAmount;

        setInputAmount(
            appliedAmount > 0
                ? String(appliedAmount)
                : "",
        );
    }, [
        balance,
        maxPurchaseAmount,
        value,
    ]);

    const amount =
        Number(inputAmount);

    const maxAmount =
        getMaxPointAmount(
            balance,
            maxPurchaseAmount,
        );

    const isValidAmount =
        Number.isInteger(amount) &&
        amount > 0 &&
        amount <= maxAmount;

    const handleConfirm = () => {
        if (!isValidAmount) {
            return;
        }

        const appliedAmount =
            normalizePointAmount(
                amount,
                balance,
                maxPurchaseAmount,
            );

        setInputAmount(
            appliedAmount > 0
                ? String(appliedAmount)
                : "",
        );

        onConfirm(
            appliedAmount,
        );
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Point 사용
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        주문에 사용할 Point를 입력해주세요.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "조회 중..."
                        : "새로고침"}
                </button>
            </div>

            <div className="mt-5">
                <p className="text-sm text-slate-500">
                    사용 가능 Point
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                    {balance.toLocaleString(
                        "ko-KR",
                    )}
                    P
                </p>
            </div>

            <div className="mt-5">
                <input
                    type="number"
                    min={0}
                    max={maxAmount}
                    step={1}
                    value={inputAmount}
                    onChange={(event) =>
                        setInputAmount(
                            event.target.value,
                        )
                    }
                    placeholder="사용할 Point"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
                />
            </div>

            <button
                type="button"
                onClick={handleConfirm}
                disabled={
                    !isValidAmount ||
                    loading
                }
                className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Point 사용 확인
            </button>
        </section>
    );
}