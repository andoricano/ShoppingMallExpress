// components/mypage/PointChargeCard.tsx

"use client";

import type { PaymentTestResult } from "@mall/types";

import { PaymentTestResultPicker } from "@/components/payment/PaymentTestResultPicker";

interface PointChargeCardProps {
    amountOptions: number[];
    selectedAmount: number;
    onAmountChange: (
        amount: number,
    ) => void;

    testResult: PaymentTestResult;
    onTestResultChange: (
        value: PaymentTestResult,
    ) => void;

    onCharge: () => void | Promise<void>;

    loading?: boolean;
    error?: string | null;
}

export function PointChargeCard({
    amountOptions,
    selectedAmount,
    onAmountChange,
    testResult,
    onTestResultChange,
    onCharge,
    loading = false,
    error = null,
}: PointChargeCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    포인트 충전
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    충전 금액과 테스트 결제 결과를 선택해주세요.
                </p>
            </div>

            {/* 충전 금액 */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-800">
                    충전 금액
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {amountOptions.map(
                        (amount) => {
                            const selected =
                                selectedAmount ===
                                amount;

                            return (
                                <button
                                    key={amount}
                                    type="button"
                                    onClick={() =>
                                        onAmountChange(
                                            amount,
                                        )
                                    }
                                    disabled={loading}
                                    className={[
                                        "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                                        selected
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
                                        "disabled:cursor-not-allowed disabled:opacity-50",
                                    ].join(" ")}
                                >
                                    {amount.toLocaleString(
                                        "ko-KR",
                                    )}
                                    P
                                </button>
                            );
                        },
                    )}
                </div>
            </div>

            {/* 테스트 결제 결과 (PG test mode) */}
            <div className="mt-7">
                <PaymentTestResultPicker
                    value={testResult}
                    onChange={onTestResultChange}
                    disabled={loading}
                />
            </div>

            {/* 결제 금액 */}
            <div className="mt-7 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        결제 금액
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                        {selectedAmount.toLocaleString(
                            "ko-KR",
                        )}
                        <span className="ml-1 text-sm font-semibold text-slate-500">
                            원
                        </span>
                    </span>
                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={onCharge}
                disabled={
                    loading ||
                    selectedAmount <= 0
                }
                className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading
                    ? "처리 중..."
                    : `${selectedAmount.toLocaleString("ko-KR")}원 충전하기`}
            </button>
        </section>
    );
}