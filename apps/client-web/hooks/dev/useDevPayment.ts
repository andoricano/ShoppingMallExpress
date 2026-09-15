// hooks/dev/useDevPayment.ts

"use client";

import { useCallback, useState } from "react";

export interface DevPaymentMethod {
    selectedItem: string;
    onClick: () => void;
}

export function useDevPayment() {
    const [
        paymentType,
        setPaymentType,
    ] = useState("카드");

    const [
        provider,
        setProvider,
    ] = useState("삼성");

    const [
        success,
        setSuccess,
    ] = useState(false);

    const [
        response,
        setResponse,
    ] = useState<string>();

    const paymentMethods: DevPaymentMethod[] = [
        {
            selectedItem: "간편결제",
            onClick: () => {
                setPaymentType("간편결제");
                setProvider("토스");
            },
        },
        {
            selectedItem: "카드 결제",
            onClick: () => {
                setPaymentType("카드");
                setProvider("삼성");
            },
        },
        {
            selectedItem: "무통장 입금",
            onClick: () => {
                setPaymentType("무통장 입금");
                setProvider("국민은행");
            },
        },
    ];

    const simulatePayment = useCallback(
        (
            paymentPrice: number,
            pointAmount: number,
        ) => {
            setSuccess(true);

            setResponse(
                JSON.stringify(
                    {
                        success: true,
                        token: "DEV_PAYMENT_TOKEN",
                        paymentType,
                        provider,
                        paymentPrice,
                        pointAmount,
                    },
                    null,
                    2,
                ),
            );
        },
        [paymentType, provider],
    );

    return {
        paymentType,
        provider,
        success,
        response,

        paymentMethods,

        simulatePayment,
    };
}