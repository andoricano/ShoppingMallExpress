export type RefundStatus =
    | "REQUESTED"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED"
    | "CANCELLED";

/** Refund remains rooted in Order and never exposes Ware allocation details. */
export interface RefundRequest {
    id: string;
    orderId: string;
    clientId: string;
    status: RefundStatus;
    reason: string | null;
    requestedAmount: number | null;
    requestedAt: string;
    processedAt: string | null;
    createdAt: string;
    updatedAt: string;
    items?: RefundItem[];
}

export interface RefundItem {
    id: string;
    refundRequestId: string;
    orderItemId: string;
    quantity: number;
    refundAmount: number;
    createdAt: string;
}

/**
 * Mall v3 Refund (migration 20260926190000_v3_phase7_refund_and_restock.sql).
 * Only `REQUESTED`, `APPROVED`, and `REJECTED` are used in the initial v3 (the
 * `COMPLETED` / `CANCELLED` values above are unused legacy). A "valid" request
 * for the cumulative quantity limit is `REQUESTED` or `APPROVED`.
 */
export interface CreateRefundRequestInput {
    items: { orderItemId: string; quantity: number }[];
    /** Optional free text, at most 500 characters. */
    reason?: string;
}

/** Consumer-safe result of a Refund request: no stock, allocation, or reversal detail. */
export interface CreateRefundRequestResult {
    refundRequestId: string;
}

export type RefundDecision = "APPROVED" | "REJECTED";

export interface AdminRefundDecisionInput {
    decision: RefundDecision;
}

/**
 * Admin result of a decision. Approval and its linked reversal are one
 * transaction; a repeated decision returns `ALREADY_*` without a second
 * reversal.
 */
export interface AdminRefundDecisionResult {
    outcome: "APPROVED" | "REJECTED" | "ALREADY_APPROVED" | "ALREADY_REJECTED";
    refundRequestId: string;
}
