"use client";

import { OrderButton } from "@/components/order/OrderButton";

interface CartProductsResultProps {
    totalPrice: number;

    loading?: boolean;
    disabled?: boolean;

    onOrder?: () => void;
}

export default function CartProductsResult({
    totalPrice,
    loading = false,
    disabled = false,
    onOrder,
}: CartProductsResultProps) {
    return (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    총 상품 금액
                </span>

                <span className="text-2xl font-bold text-slate-900">
                    {totalPrice.toLocaleString(
                        "ko-KR",
                    )}
                    원
                </span>
            </div>

            <OrderButton
                disabled={disabled}
                loading={loading}
                onClick={
                    onOrder ??
                    (() => { })
                }
            />
        </section>
    );
}