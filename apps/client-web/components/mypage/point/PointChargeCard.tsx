// components/mypage/PointChargeCard.tsx

"use client";

export type PointPaymentMethod =
    | "card"
    | "bank"
    | "easy";

interface PointChargeCardProps {
    amountOptions: number[];
    selectedAmount: number;
    onAmountChange: (
        amount: number,
    ) => void;

    paymentMethod: PointPaymentMethod;
    onPaymentMethodChange: (
        method: PointPaymentMethod,
    ) => void;

    onCharge: () => void | Promise<void>;

    loading?: boolean;
    error?: string | null;
}

const PAYMENT_METHODS: Array<{
    value: PointPaymentMethod;
    label: string;
    description: string;
}> = [
    {
        value: "card",
        label: "카드",
        description: "신용/체크카드",
    },
    {
        value: "bank",
        label: "계좌이체",
        description: "실시간 계좌이체",
    },
    {
        value: "easy",
        label: "간편결제",
        description: "간편결제 서비스",
    },
];

export function PointChargeCard({
    amountOptions,
    selectedAmount,
    onAmountChange,
    paymentMethod,
    onPaymentMethodChange,
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
                    원하는 금액과 결제 수단을 선택해주세요.
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

            {/* 결제 수단 */}
            <div className="mt-7">
                <h3 className="text-sm font-semibold text-slate-800">
                    결제 수단
                </h3>

                <div className="mt-3 space-y-2">
                    {PAYMENT_METHODS.map(
                        (method) => {
                            const selected =
                                paymentMethod ===
                                method.value;

                            return (
                                <button
                                    key={
                                        method.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        onPaymentMethodChange(
                                            method.value,
                                        )
                                    }
                                    disabled={loading}
                                    className={[
                                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                                        selected
                                            ? "border-slate-900 bg-slate-50"
                                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                                        "disabled:cursor-not-allowed disabled:opacity-50",
                                    ].join(" ")}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {
                                                method.label
                                            }
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {
                                                method.description
                                            }
                                        </p>
                                    </div>

                                    <span
                                        className={[
                                            "flex h-5 w-5 items-center justify-center rounded-full border",
                                            selected
                                                ? "border-slate-900"
                                                : "border-slate-300",
                                        ].join(" ")}
                                    >
                                        {selected && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                                        )}
                                    </span>
                                </button>
                            );
                        },
                    )}
                </div>
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