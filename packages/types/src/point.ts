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
 * Point Reservation Status
 */
export type PointReservationStatus =
    | "RESERVED"
    | "COMPLETED"
    | "CANCELLED"
    | "EXPIRED";

/**
 * Client Point
 */
export interface Point {
    id: string;

    clientId: string;

    balance: number;
    reservedBalance: number;

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

/**
 * Point Reservation
 *
 * 외부 결제 진행 중 사용할 Point를 임시 확보합니다.
 */
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