"use client";

import { useEffect, useState } from "react";

import type { PaymentTestResult } from "@mall/types";

import { PointChargeCard } from "./PointChargeCard";
import { PointHistoryCard } from "./PointHistoryCard";
import { UserPointCard } from "./UserPointCard";

import { usePoint } from "@/hooks/point/usePoint";

const POINT_AMOUNT_OPTIONS = [
    10_000,
    30_000,
    50_000,
    100_000,
];

export function MyPointSection() {

    const {
        balance,
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
        testResult,
        setTestResult,
    ] = useState<PaymentTestResult>(
        "SUCCESS",
    );

    useEffect(() => {
        fetchPoint();
        fetchPointTransactions();
    }, [
        fetchPoint,
        fetchPointTransactions,
    ]);

    const handleCharge = async () => {
        // POINT_TOPUP payment; balance and ledger are reloaded afterwards.
        await chargePoint(
            selectedAmount,
            testResult,
        );
    };

    return (
        <section className="space-y-6">
            <UserPointCard
                balance={balance}
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
                testResult={testResult}
                onTestResultChange={setTestResult}
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