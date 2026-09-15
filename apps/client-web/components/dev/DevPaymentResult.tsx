"use client";

interface DevPaymentResultProps {
    success: boolean;
    response?: string;
    onComplete: () => void;
}

export default function DevPaymentResult({
    success,
    response,
    onComplete,
}: DevPaymentResultProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                결제 API 결과
            </h2>

            <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                        결제 결과
                    </span>

                    <span className="font-semibold text-slate-900">
                        {success
                            ? "성공"
                            : "대기 중"}
                    </span>
                </div>

                {response && (
                    <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-white">
                        {response}
                    </pre>
                )}
            </div>

            <button
                type="button"
                disabled={!success}
                onClick={onComplete}
                className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                결제 완료 페이지로 이동
            </button>
        </section>
    );
}