import { NextRequest, NextResponse } from "next/server";

import type { CancelOrderInput, CancelOrderResult } from "@mall/types";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { runPaymentReversal } from "@/lib/payment/reversalRunner";
import { requireAdminServiceContext } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ orderId: string }> };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mall v3 Admin cancel/reject of a PENDING Order (whole Order). One database
 * transaction cancels the Order, releases its allocation once, records the
 * Admin and the reason, and creates one ORDER_CANCEL reversal; the PG reversal
 * runs after the commit. A repeat returns ALREADY_CANCELLED. After PROCESSING
 * the Order cannot be cancelled (409); the Refund domain takes over.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { orderId } = await context.params;
        const body = await request.json().catch(() => null) as CancelOrderInput | null;

        if (!UUID_PATTERN.test(orderId)) {
            throw new AdminBadRequestError("Invalid order id.");
        }

        if (body?.reason !== undefined && typeof body.reason !== "string") {
            throw new AdminBadRequestError("reason must be a string.");
        }

        const { supabase, adminId } = await requireAdminServiceContext();

        const { data, error } = await supabase.rpc("cancel_pending_order", {
            p_order_id: orderId,
            p_actor_id: adminId,
            p_actor_role: "ADMIN",
            p_reason: body?.reason ?? null,
        });

        if (error) {
            if (error.code === "P0001" && error.message.includes("Only PENDING Orders can be cancelled")) {
                return NextResponse.json(
                    { message: "Only PENDING Orders can be cancelled." },
                    { status: 409 },
                );
            }

            throw error;
        }

        const result = data as {
            outcome: CancelOrderResult["outcome"];
            order_id: string;
            reversal_id: string | null;
        };

        if (result.reversal_id) {
            await runPaymentReversal(supabase, result.reversal_id);
        }

        const cancelled: CancelOrderResult = { outcome: result.outcome, orderId: result.order_id };

        return NextResponse.json({ data: cancelled });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
