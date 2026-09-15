"use client";

import { OrderFinalSummary } from "./OrderPaymentSummary";
import OrderPointInput from "./OrderPointInput";

interface PaymentPanelProps {
    productPrice: number;

    pointBalance: number;
    pointAmount: number;

    loading?: boolean;

    paymentPrice: number;

    onRefreshPoint?: () => void;

    onConfirmPoint: (
        amount: number,
    ) => void;

    onSubmit: () => void;

    disabled?: boolean;
}

export default function PaymentPanel({
    productPrice,
    pointBalance,
    pointAmount,
    loading = false,
    paymentPrice,
    onRefreshPoint,
    onConfirmPoint,
    onSubmit,
    disabled = false,
}: PaymentPanelProps) {
    return (
        <section className="space-y-5">
            <OrderPointInput
                balance={pointBalance}
                maxPurchaseAmount={
                    productPrice
                }
                value={pointAmount}
                loading={loading}
                onRefresh={
                    onRefreshPoint
                }
                onConfirm={
                    onConfirmPoint
                }
            />
            <OrderFinalSummary
                productPrice={productPrice}
                pointAmount={pointAmount}
                loading={loading}
                disabled={disabled}
                onSubmit={onSubmit}
            />
        </section>
    );
}