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
    /** Target Order for ORDER_PAYMENT; null for POINT_TOPUP. */
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
