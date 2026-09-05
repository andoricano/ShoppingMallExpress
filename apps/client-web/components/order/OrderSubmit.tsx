// components/order/OrderSubmit.tsx

"use client";

interface OrderSubmitProps {
    totalPrice: number;
    disabled?: boolean;
    onSubmit?: () => void;
}

export function OrderSubmit({
    totalPrice,
    disabled = false,
    onSubmit,
}: OrderSubmitProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    최종 결제 금액
                </span>

                <span className="text-2xl font-bold text-slate-900">
                    {totalPrice.toLocaleString()}원
                </span>
            </div>

            <button
                type="button"
                disabled={disabled}
                onClick={onSubmit}
                className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                주문하기
            </button>
        </section>
    );
}