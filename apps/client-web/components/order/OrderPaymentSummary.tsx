// components/order/OrderPaymentSummary.tsx

"use client";

interface OrderPaymentSummaryProps {
    productPrice: number;
    shippingPrice?: number;
}

export function OrderPaymentSummary({
    productPrice,
    shippingPrice = 0,
}: OrderPaymentSummaryProps) {
    const totalPrice =
        productPrice + shippingPrice;

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                결제 금액
            </h2>

            <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        상품 금액
                    </span>

                    <span className="text-sm font-medium text-slate-900">
                        {productPrice.toLocaleString()}원
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        배송비
                    </span>

                    <span className="text-sm font-medium text-slate-900">
                        {shippingPrice.toLocaleString()}원
                    </span>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">
                        최종 결제 금액
                    </span>

                    <span className="text-2xl font-bold text-slate-900">
                        {totalPrice.toLocaleString()}원
                    </span>
                </div>
            </div>
        </section>
    );
}
