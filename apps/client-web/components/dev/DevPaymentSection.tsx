"use client";

import PaymentMethodList from "./PaymentMethodList";
import DevPaymentStatus from "./DevPaymentStatus";
import DevPaymentResult from "./DevPaymentResult";

interface DevPaymentMethodItem {
    selectedItem: string;
    onClick: () => void;
}

interface DevPaymentSectionProps {
    paymentMethods: DevPaymentMethodItem[];

    paymentType: string;
    provider: string;
    success: boolean;

    paymentPrice: number;
    pointAmount: number;

    response?: string;

    onComplete: () => void;
}

export default function DevPaymentSection({
    paymentMethods,
    paymentType,
    provider,
    success,
    paymentPrice,
    pointAmount,
    response,
    onComplete,
}: DevPaymentSectionProps) {
    return (
        <section className="space-y-5">
            <PaymentMethodList
                items={paymentMethods}
            />

            <DevPaymentStatus
                paymentType={paymentType}
                provider={provider}
                success={success}
                paymentPrice={
                    paymentPrice
                }
                pointAmount={
                    pointAmount
                }
            />

            <DevPaymentResult
                success={success}
                response={response}
                onComplete={
                    onComplete
                }
            />
        </section>
    );
}