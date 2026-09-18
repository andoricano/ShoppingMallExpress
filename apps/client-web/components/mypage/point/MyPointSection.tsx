"use client";

import { useEffect, useState } from "react";

import {
    PointChargeCard,
    type PointPaymentMethod,
} from "./PointChargeCard";
import { PointHistoryCard } from "./PointHistoryCard";
import { UserPointCard } from "./UserPointCard";

import { usePoint } from "@/hooks/point/usePoint";
import { useClientAuthStore } from "@/store/useClientAuthStore";

const POINT_AMOUNT_OPTIONS = [
    10_000,
    30_000,
    50_000,
    100_000,
];

export function MyPointSection() {
    const user = useClientAuthStore(
        (state) => state.user,
    );

    const {
        loading,
        error,
        fetchPoint,
        chargePoint,
        transactions,
        fetchPointTransactions,
    } = usePoint();

    const [
        selectedAmount,
        setSelectedAmount,
    ] = useState(
        POINT_AMOUNT_OPTIONS[0],
    );

    const [
        paymentMethod,
        setPaymentMethod,
    ] = useState<PointPaymentMethod>(
        "card",
    );

    useEffect(() => {
        fetchPoint();
        fetchPointTransactions();
    }, [
        fetchPoint,
        fetchPointTransactions,
    ]);

    const handleCharge = async () => {
        await chargePoint(
            selectedAmount,
        );

        // 충전 후 이력 갱신
        await fetchPointTransactions();
    };

    return (
        <section className="space-y-6">
            <UserPointCard
                balance={
                    user?.point?.balance ?? 0
                }
            />

            <PointChargeCard
                amountOptions={
                    POINT_AMOUNT_OPTIONS
                }
                selectedAmount={
                    selectedAmount
                }
                onAmountChange={
                    setSelectedAmount
                }
                paymentMethod={
                    paymentMethod
                }
                onPaymentMethodChange={
                    setPaymentMethod
                }
                onCharge={handleCharge}
                loading={loading}
                error={error}
            />

            <PointHistoryCard
                items={transactions}
                pageSize={20}
            />
        </section>
    );
}