// hooks/payment/usePayment.ts

"use client";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import {
    API_ENDPOINTS,
} from "@mall/constants";

import { authProfile } from "@/lib/authClient";
import { useClientAuthStore } from "@/store/useClientAuthStore";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

interface UsePaymentParams {
    productPrice: number;
    shippingPrice?: number;
}

interface PointReservation {
    id: string;

    pointId: string;
    clientId: string;

    amount: number;

    status: string;

    balance: number;
    reservedBalance: number;

    createdAt: string;
    updatedAt: string;
}

export function usePayment({
    productPrice,
    shippingPrice = 0,
}: UsePaymentParams) {
    const point =
        useClientAuthStore(
            (state) => state.user?.point,
        );

    const [
        pointAmount,
        setPointAmount,
    ] = useState(0);

    const [
        reservation,
        setReservation,
    ] =
        useState<PointReservation | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

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
                const appliedAmount =
                    Math.min(
                        amount,
                        usablePoint,
                        totalPrice,
                    );

                setPointAmount(
                    appliedAmount,
                );
            },
            [
                usablePoint,
                totalPrice,
            ],
        );

    // ==========================================
    // Point Reservation
    // ==========================================

    const reservePoint =
        useCallback(async () => {
            if (pointAmount <= 0) {
                return null;
            }

            setLoading(true);
            setError(null);

            try {
                const session =
                    await authProfile.getSession();

                if (
                    !session?.access_token
                ) {
                    throw new Error(
                        "로그인이 필요합니다.",
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_PAYMENT.POINT_RESERVE}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                                amount:
                                    pointAmount,
                            }),
                        },
                    );

                const result =
                    await response
                        .json()
                        .catch(
                            () => null,
                        );

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        "포인트 예약에 실패했습니다.",
                    );
                }

                const data =
                    result?.data
                        ? (result.data as PointReservation)
                        : null;

                setReservation(data);

                return data;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "포인트 예약에 실패했습니다.";

                console.error(
                    "[usePayment] Point Reservation 실패:",
                    err,
                );

                setError(message);
                setReservation(null);

                return null;
            } finally {
                setLoading(false);
            }
        }, [pointAmount]);

    // ==========================================
    // Point 사용 초기화
    // ==========================================

    const clearPoint =
        useCallback(() => {
            setPointAmount(0);
            setReservation(null);
            setError(null);
        }, []);

    return {
        point,
        usablePoint,

        pointAmount,
        reservation,

        totalPrice,
        paymentPrice,

        loading,
        error,

        handlePointConfirm,
        reservePoint,
        clearPoint,
    };
}