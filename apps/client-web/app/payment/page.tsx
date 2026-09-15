"use client";

import DevPaymentSection from "@/components/dev/DevPaymentSection";

import { useDevPayment } from "@/hooks/dev/useDevPayment";
import { usePaymentStore } from "@/store/paymentStore";

export default function DevPaymentPage() {
    const payment =
        usePaymentStore(
            (state) => state.payment,
        );

    const {
        paymentType,
        provider,
        success,
        response,
        paymentMethods,
        simulatePayment,
    } = useDevPayment();

    const handlePayment = () => {
        if (!payment) {
            return;
        }

        simulatePayment(
            payment.paymentPrice,
            payment.pointAmount,
        );
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="mx-auto max-w-2xl space-y-5">
                <h1 className="text-2xl font-bold text-slate-900">
                    Dev Payment
                </h1>

                {!payment ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                        결제 정보가 없습니다.
                    </div>
                ) : (
                    <>
                        <DevPaymentSection
                            paymentMethods={
                                paymentMethods
                            }
                            paymentType={
                                paymentType
                            }
                            provider={
                                provider
                            }
                            success={
                                success
                            }
                            paymentPrice={
                                payment.paymentPrice
                            }
                            pointAmount={
                                payment.pointAmount
                            }
                            response={
                                response
                            }
                            onComplete={() => {
                                console.log(
                                    "Order Result Page 이동",
                                );
                            }}
                        />

                        <button
                            type="button"
                            onClick={
                                handlePayment
                            }
                            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                        >
                            결제 시뮬레이션
                        </button>
                    </>
                )}
            </div>
        </main>
    );
}