"use client";

import type { PaymentTestResult } from "@mall/types";

interface PaymentTestResultPickerProps {
    value: PaymentTestResult;
    onChange: (value: PaymentTestResult) => void;
    disabled?: boolean;
}

const OPTIONS: { value: PaymentTestResult; label: string; description: string }[] = [
    { value: "SUCCESS", label: "결제 성공", description: "테스트 결제를 성공으로 기록합니다." },
    { value: "FAILURE", label: "결제 실패", description: "테스트 결제를 실패로 기록합니다." },
];

/**
 * PG test mode outcome. The choice is sent to the Mall server, which reports
 * it to the PG Test recorder; the browser never calls the recorder.
 */
export function PaymentTestResultPicker({
    value,
    onChange,
    disabled = false,
}: PaymentTestResultPickerProps) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-800">
                테스트 결제 결과
            </h3>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        disabled={disabled}
                        className={[
                            "rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            value === option.value
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 hover:border-slate-300",
                        ].join(" ")}
                    >
                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{option.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
