"use client";

import { OrderButton } from "../OrderButton";

interface OrderFinalSummaryProps {
    productPrice: number;
    shippingPrice?: number;
    pointAmount?: number;

    loading?: boolean;
    disabled?: boolean;
    onSubmit: () => void;
}

export function OrderFinalSummary({
    productPrice,
    shippingPrice = 0,
    pointAmount = 0,
    loading = false,
    disabled = false,
    onSubmit,
}: OrderFinalSummaryProps) {
    const totalPrice =
        productPrice +
        shippingPrice;

    const paymentPrice =
        Math.max(
            0,
            totalPrice - pointAmount,
        );

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                결제 금액
            </h2>

            <div className="mt-5 space-y-4">
                {/* Point */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        포인트
                    </span>

                    <span className="text-sm font-medium text-slate-900">
                        {pointAmount.toLocaleString(
                            "ko-KR",
                        )}
                        P
                    </span>
                </div>

                {/* 상품 금액 */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        상품 금액
                    </span>

                    <span className="text-sm font-medium text-slate-900">
                        {productPrice.toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </span>
                </div>

                {/* 배송비 */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        배송비
                    </span>

                    <span className="text-sm font-medium text-slate-900">
                        {shippingPrice.toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </span>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Point 적용 전 결제 금액 */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        결제 금액
                    </span>

                    <span className="text-base font-medium text-slate-400 line-through">
                        {totalPrice.toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </span>
                </div>

                {/* 최종 결제 금액 */}
                <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">
                        최종 결제 금액
                    </span>

                    <span className="text-2xl font-bold text-slate-900">
                        {paymentPrice.toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </span>
                </div>
            </div>

            <OrderButton
                disabled={disabled}
                loading={loading}
                onClick={onSubmit}
            />
        </section>
    );
}