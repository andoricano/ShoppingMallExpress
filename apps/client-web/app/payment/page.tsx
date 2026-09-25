"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { Order, PaymentTestResult } from "@mall/types";

import { PaymentTestResultPicker } from "@/components/payment/PaymentTestResultPicker";
import { useClientOrder } from "@/hooks/order/useClientOrder";
import { usePaymentApi } from "@/hooks/payment/usePaymentApi";

/**
 * ORDER_PAYMENT for an existing PENDING Order. The displayed total is the
 * immutable server Order total; the server re-derives and verifies it.
 */
function OrderPayment() {
    const router = useRouter();
    const orderId = useSearchParams().get("orderId");
    const { fetchOrder } = useClientOrder();
    const { processing, error: paymentError, pay } = usePaymentApi();

    const [order, setOrder] = useState<Order | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<PaymentTestResult>("SUCCESS");

    useEffect(() => {
        if (!orderId) {
            return;
        }

        fetchOrder(orderId)
            .then((result) => {
                if (result) {
                    setOrder(result);
                } else {
                    setLoadError("주문을 찾을 수 없습니다.");
                }
            })
            .catch(() => setLoadError("주문 정보를 불러오지 못했습니다."));
    }, [fetchOrder, orderId]);

    if (!orderId) {
        return <p className="text-sm text-slate-500">결제할 주문이 없습니다.</p>;
    }

    if (loadError) {
        return <p className="text-sm text-rose-600">{loadError}</p>;
    }

    if (!order) {
        return <p className="text-sm text-slate-500">주문 정보를 불러오는 중...</p>;
    }

    if (order.status !== "PENDING") {
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-600">결제 대기 중인 주문이 아닙니다.</p>
                <Link href={`/success?orderId=${order.id}`} className="text-sm underline">
                    주문 확인
                </Link>
            </div>
        );
    }

    const handlePay = async () => {
        const payment = await pay(
            { purpose: "ORDER_PAYMENT", orderId: order.id, amount: order.totalAmount },
            testResult,
        );

        if (payment?.status === "SUCCEEDED") {
            router.replace(`/success?orderId=${encodeURIComponent(order.id)}`);
        }
    };

    return (
        <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">주문번호 {order.orderNumber}</p>
                <ul className="mt-4 divide-y divide-slate-100">
                    {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between py-2 text-sm">
                            <span className="min-w-0 truncate">
                                {item.productNameSnapshot}
                                {item.variantLabelSnapshot && ` / ${item.variantLabelSnapshot}`} × {item.quantity}
                            </span>
                            <span className="shrink-0 font-medium">{item.lineTotal.toLocaleString("ko-KR")}원</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm text-slate-500">결제 금액</span>
                    <span className="text-2xl font-bold text-slate-900">
                        {order.totalAmount.toLocaleString("ko-KR")}원
                    </span>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
                <PaymentTestResultPicker
                    value={testResult}
                    onChange={setTestResult}
                    disabled={processing}
                />

                {paymentError && (
                    <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {paymentError} 주문은 결제 대기 상태로 유지됩니다.
                    </p>
                )}

                <button
                    type="button"
                    onClick={handlePay}
                    disabled={processing}
                    className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {processing ? "결제 처리 중..." : `${order.totalAmount.toLocaleString("ko-KR")}원 결제하기`}
                </button>
            </section>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="mx-auto max-w-2xl space-y-5">
                <h1 className="text-2xl font-bold text-slate-900">결제</h1>
                <Suspense fallback={null}>
                    <OrderPayment />
                </Suspense>
            </div>
        </main>
    );
}
