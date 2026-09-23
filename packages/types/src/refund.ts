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
