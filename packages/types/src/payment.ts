// packages/types/src/payment.ts

/**
 * Mall v2 payment attempt (migration 20260925140000_payments_and_points.sql).
 * The Mall DB is the source of truth; the PG Test service only records the
 * result reported by the Mall server.
 */
export type PaymentPurpose = "ORDER_PAYMENT" | "POINT_TOPUP";

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export interface Payment {
    id: string;
    clientId: string;
    purpose: PaymentPurpose;
    /**
     * v2 link to the Order. Null for POINT_TOPUP and, from v3, for an
     * ORDER_PAYMENT recorded before its Order exists (Stage 1 checkout).
     * v3 canonical link is `Order.paymentId`; this field is kept for v2
     * compatibility until the Phase 8 contraction.
     */
    orderId: string | null;
    /** Server-determined amount (Order total or allowed top-up amount). */
    amount: number;
    status: PaymentStatus;
    pgCallbackId: string | null;
    failureReason: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
}

/** Body of POST /api/payments. The server never trusts `amount` for orders. */
export type CreatePaymentInput =
    | {
        purpose: "ORDER_PAYMENT";
        orderId: string;
        /** Optional client expectation; rejected when it differs from the order total. */
        amount?: number;
    }
    | {
        purpose: "POINT_TOPUP";
        /** 1,000 ~ 1,000,000 in units of 1,000. */
        amount: number;
    };

/** Test-mode outcome forwarded by the Mall server to the PG Test service. */
export type PaymentTestResult = "SUCCESS" | "FAILURE";

/** Body of POST /api/payments/[paymentId]/confirm. */
export interface ConfirmPaymentInput {
    testResult: PaymentTestResult;
}

/**
 * Mall v3 payment reversal (migration 20260926130000_v3_phase1_schema_foundation.sql).
 * A cancellation, refund, or reversal of (part of) a Payment. `Payment.status`
 * is never changed by a reversal; several reversals may exist per Payment.
 * Internal/trusted-server contract: not part of Consumer payloads until the
 * Consumer read scope is decided (DN-19).
 */
export type PaymentReversalReason =
    | "ORDER_CANCEL"
    | "REFUND"
    | "FINALIZE_FAILURE"
    | "ORPHAN_PAYMENT"
    | "MANUAL_RECONCILIATION";

export type PaymentReversalStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export interface PaymentReversal {
    id: string;
    paymentId: string;
    /** Set for ORDER_CANCEL; optional otherwise (finalize failure may have no Order). */
    orderId: string | null;
    /** Set only for REFUND. */
    refundRequestId: string | null;
    amount: number;
    reasonType: PaymentReversalReason;
    status: PaymentReversalStatus;
    idempotencyKey: string;
    pgReference: string | null;
    failureReason: string | null;
    createdAt: string;
    updatedAt: string;
}
