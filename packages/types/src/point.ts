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

// ------------------------------------------------------------
// Legacy (Express) Point contract. Not backed by Mall v2 tables.
// ------------------------------------------------------------

/**
 * Point Transaction Type
 */
/** @deprecated Legacy Express Point contract; use PointBalance / PointLedgerEntry. */
export type PointTransactionType =
    | "CHARGE"
    | "USE"
    | "EARN"
    | "REFUND"
    | "ADJUST";

/**
 * Point Reservation Status
 */
/** @deprecated Legacy Express Point contract; use PointBalance / PointLedgerEntry. */
export type PointReservationStatus =
    | "RESERVED"
    | "COMPLETED"
    | "CANCELLED"
    | "EXPIRED";

/**
 * Client Point
 */
/** @deprecated Legacy Express Point contract; use PointBalance / PointLedgerEntry. */
export interface Point {
    id: string;

    clientId: string;

    balance: number;

    createdAt: string;
    updatedAt: string;
}

/**
 * Point Transaction
 */
/** @deprecated Legacy Express Point contract; use PointBalance / PointLedgerEntry. */
export interface PointTransaction {
    id: string;

    pointId: string;
    clientId: string;

    type: PointTransactionType;

    amount: number;
    balance: number;

    orderId?: string;

    /**
     * 거래 사유 및 설명
     */
    reason?: string;

    /**
     * Admin 수동 조정 시 처리한 Admin ID
     */
    adminId?: string;

    createdAt: string;
}

/**
 * Point Reservation
 *
 * 외부 결제 진행 중 사용할 Point를 임시 확보합니다.
 */
/** @deprecated Legacy Express Point contract; use PointBalance / PointLedgerEntry. */
export interface PointReservation {
    id: string;

    pointId: string;
    clientId: string;

    amount: number;

    status: PointReservationStatus;

    orderId?: string;

    expiresAt: string;

    createdAt: string;
    updatedAt: string;
}