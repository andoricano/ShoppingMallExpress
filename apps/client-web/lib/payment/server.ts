import "server-only";

import { NextResponse } from "next/server";

import type {
    Payment,
    PaymentPurpose,
    PaymentStatus,
} from "@mall/types";

import { AuthenticationError } from "@/lib/supabase/admin";
import { PgTestError } from "./pgTest";

export type PaymentRow = {
    id: string;
    client_id: string;
    purpose: PaymentPurpose;
    order_id: string | null;
    amount: number | string;
    status: PaymentStatus;
    pg_callback_id: string | null;
    failure_reason: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
};

export function toPayment(row: PaymentRow): Payment {
    return {
        id: row.id,
        clientId: row.client_id,
        purpose: row.purpose,
        orderId: row.order_id,
        amount: Number(row.amount),
        status: row.status,
        pgCallbackId: row.pg_callback_id,
        failureReason: row.failure_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
    };
}

export class PaymentRequestError extends Error {
    constructor(message: string, public readonly status: 400 | 404 | 409) {
        super(message);
    }
}

function databaseError(error: unknown) {
    return typeof error === "object" && error !== null
        ? error as { code?: string; message?: string }
        : {};
}

/** Maps payment boundary errors to JSON responses without leaking internals. */
export function paymentErrorResponse(error: unknown) {
    if (error instanceof AuthenticationError) {
        return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    if (error instanceof PaymentRequestError) {
        return NextResponse.json({ message: error.message }, { status: error.status });
    }

    if (error instanceof PgTestError) {
        return NextResponse.json(
            { message: "결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
            { status: 502 },
        );
    }

    const { code, message = "" } = databaseError(error);

    if (code === "P0002") {
        return NextResponse.json(
            { message: message.includes("Payment") ? "결제를 찾을 수 없습니다." : "주문을 찾을 수 없습니다." },
            { status: 404 },
        );
    }

    if (code === "P0001") {
        const userMessage =
            message.includes("does not match") ? "결제 금액이 주문 금액과 일치하지 않습니다."
                : message.includes("not payable") ? "결제할 수 없는 주문 상태입니다."
                    : message.includes("top-up amount") ? "충전 금액은 1,000원 ~ 1,000,000원, 1,000원 단위입니다."
                        : "잘못된 결제 요청입니다.";

        return NextResponse.json({ message: userMessage }, { status: 400 });
    }

    return NextResponse.json({ message: "결제 요청을 처리하지 못했습니다." }, { status: 500 });
}
