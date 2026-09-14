// @/types/refund.ts

import type { Order } from "./order";

/**
 * 환불 요청 상태
 */
export type RefundStatus =
    | "REQUESTED"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED";

/**
 * 환불 요청
 *
 * 기존 Order를 기준으로 환불 처리에 필요한 정보를 관리합니다.
 */
export interface RefundRequest {
    id: string;

    order: Order;

    status: RefundStatus;

    reason?: string;

    createdAt: string;
    processedAt?: string;
}