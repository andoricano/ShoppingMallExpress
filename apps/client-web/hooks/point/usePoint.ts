"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    PaymentTestResult,
    PointLedgerEntry,
    PointLedgerType,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";
import { usePaymentApi } from "@/hooks/payment/usePaymentApi";

type PointLedgerRow = {
    id: string;
    client_id: string;
    type: PointLedgerType;
    amount: number;
    balance_after: number;
    payment_id: string | null;
    created_at: string;
};

function toLedgerEntry(row: PointLedgerRow): PointLedgerEntry {
    return {
        id: row.id,
        clientId: row.client_id,
        type: row.type,
        amount: Number(row.amount),
        balanceAfter: Number(row.balance_after),
        paymentId: row.payment_id,
        createdAt: row.created_at,
    };
}

/**
 * Point balance and ledger through the owner RLS on point_balances /
 * point_ledger. Top-up is a POINT_TOPUP payment through the Mall payment
 * boundary; Points are credited only by the trusted server after success.
 */
export function usePoint() {
    const payment = usePaymentApi();

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<PointLedgerEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPoint = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("로그인이 필요합니다.");
            }

            const { data, error: selectError } = await supabase
                .from("point_balances")
                .select("balance")
                .maybeSingle();

            if (selectError) {
                throw new Error("포인트를 불러오지 못했습니다.");
            }

            // No row yet means no top-up has succeeded.
            const nextBalance = Number(data?.balance ?? 0);

            setBalance(nextBalance);

            return nextBalance;
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "포인트를 불러오지 못했습니다.");

            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPointTransactions = useCallback(async () => {
        const { data, error: selectError } = await createClient()
            .from("point_ledger")
            .select("id, client_id, type, amount, balance_after, payment_id, created_at")
            .order("created_at", { ascending: false })
            .limit(200);

        if (selectError) {
            setError("포인트 이력을 불러오지 못했습니다.");

            return [];
        }

        const entries = (data as PointLedgerRow[]).map(toLedgerEntry);

        setTransactions(entries);

        return entries;
    }, []);

    const { pay } = payment;

    /** Returns true only when the top-up payment SUCCEEDED. */
    const chargePoint = useCallback(
        async (amount: number, testResult: PaymentTestResult) => {
            const result = await pay({ purpose: "POINT_TOPUP", amount }, testResult);

            await Promise.all([fetchPoint(), fetchPointTransactions()]);

            return result?.status === "SUCCEEDED";
        },
        [fetchPoint, fetchPointTransactions, pay],
    );

    return {
        balance,
        transactions,

        loading: loading || payment.processing,
        error: payment.error ?? error,

        fetchPoint,
        fetchPointTransactions,
        chargePoint,
    };
}
