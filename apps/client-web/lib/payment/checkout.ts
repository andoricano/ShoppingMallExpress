import "server-only";

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
    executePaymentReversal,
    selectReversalAdapter,
    type RpcCaller,
} from "./reversal";
import { paymentErrorResponse } from "./server";

/**
 * Error mapping of the Mall v3 checkout routes (payment-first checkout).
 * Anything not listed falls back to the shared payment mapping.
 */
export function checkoutErrorResponse(error: unknown) {
    const { code, message = "" } = typeof error === "object" && error !== null
        ? error as { code?: string; message?: string }
        : {};

    if (code === "P0001") {
        if (message.startsWith("Not sellable")) {
            return NextResponse.json(
                { message: "현재 구매할 수 없는 상품이 포함되어 있습니다." },
                { status: 409 },
            );
        }

        if (message.includes("Only PENDING Orders can be cancelled")) {
            return NextResponse.json(
                { message: "주문 접수 상태에서만 취소할 수 있습니다." },
                { status: 409 },
            );
        }

        if (message.includes("Order cannot be refunded") || message.includes("Refund quantity exceeds")) {
            return NextResponse.json(
                { message: "환불을 요청할 수 없는 주문이거나 환불 가능 수량을 초과했습니다." },
                { status: 409 },
            );
        }

        if (message.includes("has not succeeded")) {
            return NextResponse.json(
                { message: "결제가 완료되지 않았습니다." },
                { status: 409 },
            );
        }

        return NextResponse.json({ message: "잘못된 주문 요청입니다." }, { status: 400 });
    }

    return paymentErrorResponse(error);
}

/**
 * Executes a payment reversal after the database transaction committed. The
 * adapter comes from `PG_REVERSAL_ADAPTER` (see selectReversalAdapter): only
 * `simulated` (PG test mode) settles a reversal; without it the outcome is
 * unknown and the reversal stays PENDING for the reconcile job. An unknown
 * outcome leaves the reversal PENDING (see ./reversal.ts); this never throws
 * into the request.
 */
export async function runPaymentReversal(reversalId: string) {
    const supabase = createServiceRoleClient();
    const rpc: RpcCaller = (fn, args) => supabase.rpc(fn, args);

    try {
        return await executePaymentReversal(
            rpc,
            reversalId,
            selectReversalAdapter(process.env.PG_REVERSAL_ADAPTER),
        );
    } catch {
        return "UNKNOWN_OUTCOME" as const;
    }
}
