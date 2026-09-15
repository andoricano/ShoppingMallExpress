// packages/types/src/point.ts

/**
 * Point Transaction Type
 */
export type PointTransactionType =
    | "CHARGE"
    | "USE"
    | "EARN"
    | "REFUND"
    | "ADJUST";

/**
 * Client Point
 */
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