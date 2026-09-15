"use client";

interface DevPaymentStatusProps {
    paymentType: string;
    provider: string;
    success: boolean;

    paymentPrice: number;
    pointAmount: number;
}

export default function DevPaymentStatus({
    paymentType,
    provider,
    success,
    paymentPrice,
    pointAmount,
}: DevPaymentStatusProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                결제 상태
            </h2>

            <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                        결제 타입
                    </span>

                    <span className="font-medium text-slate-900">
                        {paymentType}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                        결제사
                    </span>

                    <span className="font-medium text-slate-900">
                        {provider}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                        성공 여부
                    </span>

                    <span className="font-medium text-slate-900">
                        {String(success)}
                    </span>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                        실결제 금액
                    </span>

                    <span className="font-medium text-slate-900">
                        {paymentPrice.toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                        사용 Point
                    </span>

                    <span className="font-medium text-slate-900">
                        {pointAmount.toLocaleString(
                            "ko-KR",
                        )}
                        P
                    </span>
                </div>
            </div>
        </section>
    );
}