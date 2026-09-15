"use client";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import { usePoint } from "@/hooks/point/usePoint";
import { useClientAuthStore } from "@/store/useClientAuthStore";

interface UsePaymentParams {
    productPrice: number;
    shippingPrice?: number;
}

export function usePayment({
    productPrice,
    shippingPrice = 0,
}: UsePaymentParams) {
    const point =
        useClientAuthStore(
            (state) => state.user?.point,
        );

    const {
        loading: pointLoading,
        fetchPoint,
    } = usePoint();

    const [
        pointAmount,
        setPointAmount,
    ] = useState(0);

    // ==========================================
    // 결제 금액
    // ==========================================

    const totalPrice = useMemo(
        () =>
            productPrice +
            shippingPrice,
        [
            productPrice,
            shippingPrice,
        ],
    );

    const usablePoint = Math.max(
        0,
        point?.balance ?? 0,
    );

    const paymentPrice = useMemo(
        () =>
            Math.max(
                0,
                totalPrice -
                pointAmount,
            ),
        [
            totalPrice,
            pointAmount,
        ],
    );

    // ==========================================
    // Point 사용 확정
    // ==========================================
    const handlePointConfirm =
        useCallback(
            (amount: number) => {
                const appliedPoint =
                    Math.min(
                        amount,
                        usablePoint,
                        totalPrice,
                    );

                setPointAmount(
                    appliedPoint,
                );

                return appliedPoint;
            },
            [
                usablePoint,
                totalPrice,
            ],
        );

    // ==========================================
    // Point 초기화
    // ==========================================

    const clearPoint =
        useCallback(() => {
            setPointAmount(0);
        }, []);

    return {
        point,
        usablePoint,

        pointAmount,

        totalPrice,
        paymentPrice,

        pointLoading,

        fetchPoint,

        handlePointConfirm,
        clearPoint,
    };
}