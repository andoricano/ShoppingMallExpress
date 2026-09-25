"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Order, OrderStatus } from "@mall/types";

import { useClientOrder } from "@/hooks/order/useClientOrder";

const STATUS_LABEL: Record<OrderStatus, string> = {
    PENDING: "주문 접수",
    PAID: "결제 완료",
    PROCESSING: "상품 준비 중",
    SHIPPED: "배송 중",
    DELIVERED: "배송 완료",
    CANCELLED: "주문 취소",
};

function text(value: unknown) {
    return typeof value === "string" ? value : "";
}

function OrderResult() {
    const orderId = useSearchParams().get("orderId");
    const { fetchOrder } = useClientOrder();
    const [order, setOrder] = useState<Order | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            return;
        }

        fetchOrder(orderId)
            .then((result) => {
                if (result) {
                    setOrder(result);
                } else {
                    setError("주문을 찾을 수 없습니다.");
                }
            })
            .catch(() => setError("주문 정보를 불러오지 못했습니다."));
    }, [fetchOrder, orderId]);

    if (!orderId) {
        return <p className="text-sm text-slate-500">주문 정보가 없습니다.</p>;
    }

    if (error) {
        return <p className="text-sm text-rose-600">{error}</p>;
    }

    if (!order) {
        return <p className="text-sm text-slate-500">주문 정보를 불러오는 중...</p>;
    }

    const shipping = order.shippingAddress ?? {};

    return (
        <>
            <h1 className="mb-2 text-3xl font-bold">주문이 접수되었습니다</h1>

            <div className="mb-8 space-y-3 rounded-lg bg-neutral-50 p-6 text-left">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">주문 번호</span>
                    <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">주문 상태</span>
                    <span className="font-medium text-emerald-600">{STATUS_LABEL[order.status]}</span>
                </div>

                {/* Immutable OrderItem snapshots */}
                <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
                    {order.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                            <span className="min-w-0">
                                <span className="block truncate font-medium text-neutral-900">{item.productNameSnapshot}</span>
                                <span className="text-xs text-neutral-500">
                                    {[item.variantLabelSnapshot, `${item.unitPrice.toLocaleString("ko-KR")}원 × ${item.quantity}`].filter(Boolean).join(" · ")}
                                </span>
                            </span>
                            <span className="shrink-0 font-semibold">{item.lineTotal.toLocaleString("ko-KR")}원</span>
                        </li>
                    ))}
                </ul>

                <div className="flex justify-between text-sm font-bold">
                    <span>총 주문 금액</span>
                    <span>{order.totalAmount.toLocaleString("ko-KR")}원</span>
                </div>

                <div className="text-xs text-neutral-500">
                    {text(shipping.recipientName)} · {text(shipping.phone)}
                    <br />
                    ({text(shipping.zonecode)}) {text(shipping.address)} {text(shipping.addressDetail)}
                </div>
            </div>
        </>
    );
}

export default function OrderSuccessPage() {
    return (
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
            <Suspense fallback={null}>
                <OrderResult />
            </Suspense>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                    href="/"
                    className="w-full border border-neutral-300 py-3.5 text-sm font-medium transition-colors hover:bg-neutral-50"
                >
                    메인으로 돌아가기
                </Link>
                <Link
                    href="/products"
                    className="w-full bg-black py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                    쇼핑 계속하기
                </Link>
            </div>
        </main>
    );
}
