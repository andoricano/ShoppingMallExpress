"use client";

import type {
    CheckoutSummary,
    CreateOrderPayload,
    Order,
    PrepareCheckoutPayload,
} from "@mall/types";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useCheckout(userId?: string) {
    // 주문서 계산 내역 및 생성된 주문 데이터를 담을 상태
    const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 주문서 사전 계산 (POST /api/orders/orders/prepare)
    // - 선택한 상품 목록과 수량을 전달하여 실시간 총 금액/배송비를 계산
    const prepareCheckout = async (payload: PrepareCheckoutPayload) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/orders/prepare`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("주문서 계산에 실패했습니다.");

            const responseData = await response.json();

            if (responseData.success && responseData.data) {
                setCheckoutSummary(responseData.data);
                return responseData.data as CheckoutSummary;
            } else {
                throw new Error(responseData.message || "주문 금액 계산 중 오류가 발생했습니다.");
            }
        } catch (err: any) {
            console.error("[useCheckout] prepareCheckout 오류:", err);
            setError(err.message || "서버 통신 오류");
            setCheckoutSummary(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // [2] 주문 생성 및 재고 10분 임시 점유 (POST /api/orders/orders)
    // - 배송지 정보와 주문 항목을 백엔드로 전달해 주문을 생성하고 결제대기(PAYMENT_PENDING) 상태로 전환
    const createOrder = async (payload: CreateOrderPayload) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, userId }),
            });

            if (!response.ok) throw new Error("주문 생성에 실패했습니다.");

            const responseData = await response.json();

            if (responseData.success && responseData.data) {
                setCurrentOrder(responseData.data);
                return responseData.data as Order;
            } else {
                throw new Error(responseData.message || "주문 생성 처리 중 오류가 발생했습니다.");
            }
        } catch (err: any) {
            console.error("[useCheckout] createOrder 오류:", err);
            setError(err.message || "주문 처리 중 오류가 발생했습니다.");
            alert(err.message || "주문 처리 중 오류가 발생했습니다.");
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        checkoutSummary,
        currentOrder,
        loading,
        error,
        prepareCheckout,
        createOrder,
    };
}