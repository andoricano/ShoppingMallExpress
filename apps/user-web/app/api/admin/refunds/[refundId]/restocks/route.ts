import { NextRequest, NextResponse } from "next/server";

import type { AdminRestockRefundItemInput } from "@mall/types";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Restocks returned goods of an APPROVED refund item into one of the
 * OrderItem's original allocation Wares. The RPC enforces the status, the
 * refunded-quantity limit, the per-Ware allocation limit and locking; this
 * route only authenticates the Admin and validates the request shape.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ refundId: string }> },
) {
    try {
        const { refundId } = await context.params;
        const body = await request.json().catch(() => null) as
            Partial<AdminRestockRefundItemInput> | null;

        if (
            !UUID_PATTERN.test(refundId)
            || typeof body?.refundItemId !== "string"
            || !UUID_PATTERN.test(body.refundItemId)
            || typeof body.wareId !== "string"
            || !UUID_PATTERN.test(body.wareId)
        ) {
            throw new AdminBadRequestError(
                "Valid refund, refund item and Ware ids are required.",
            );
        }

        if (
            typeof body.quantity !== "number"
            || !Number.isSafeInteger(body.quantity)
            || body.quantity <= 0
        ) {
            throw new AdminBadRequestError(
                "Restock quantity must be a positive integer.",
            );
        }

        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase.rpc(
            "admin_restock_refund_item",
            {
                p_refund_request_id: refundId,
                p_refund_item_id: body.refundItemId,
                p_ware_id: body.wareId,
                p_quantity: body.quantity,
            },
        );

        if (error) {
            throw error;
        }

        return NextResponse.json({ data });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
