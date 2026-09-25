// packages/types/src/point.ts

/**
 * Mall v2 Point domain (migration 20260925140000_payments_and_points.sql).
 * The balance changes only through ledger entries written by trusted
 * payment RPCs; consumers read their own rows through RLS.
 */
export type PointLedgerType = "TOPUP";

export interface PointBalance {
    clientId: string;
    balance: number;
    updatedAt: string;
}

export interface PointLedgerEntry {
    id: string;
    clientId: string;
    type: PointLedgerType;
    /** Signed change; TOPUP is positive. */
    amount: number;
    balanceAfter: number;
    /** Payment that produced a TOPUP entry. */
    paymentId: string | null;
    createdAt: string;
}
