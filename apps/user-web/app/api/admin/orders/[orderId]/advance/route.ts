import { NextRequest, NextResponse } from "next/server";

import type {
    AdvanceOrderInput,
    AdvanceOrderResult,
    OrderStatus,
} from "@mall/types";

import { AdminBadRequestError } from "@/lib/api/admin-response";
import { fulfillmentErrorResponse, UUID_PATTERN } from "@/lib/admin/fulfillment";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ orderId: string }> };

const TARGETS = ["PROCESSING", "SHIPPED", "DELIVERED"];

/**
 * Mall v3 Admin fulfillment step: PENDING -> PROCESSING (only with full
 * allocation; consumes the reservation), PROCESSING -> SHIPPED, SHIPPED ->
 * DELIVERED. One step at a time; asking for the status the Order already has
 * is a no-op. There is no PAID step here (the v2 PATCH route keeps its own
 * behavior until the v3 cutover).
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { orderId } = await context.params;
        const body = await request.json().catch(() => null) as Partial<AdvanceOrderInput> | null;

        if (!UUID_PATTERN.test(orderId)) {
            throw new AdminBadRequestError("Invalid order id.");
        }

        if (typeof body?.nextStatus !== "string" || !TARGETS.includes(body.nextStatus)) {
            throw new AdminBadRequestError("nextStatus must be PROCESSING, SHIPPED, or DELIVERED.");
        }

        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase.rpc("admin_advance_order", {
            p_order_id: orderId,
            p_next_status: body.nextStatus,
        });

        if (error) {
            throw error;
        }

        const result = data as { outcome: AdvanceOrderResult["outcome"]; order_id: string; status: OrderStatus };
        const advanced: AdvanceOrderResult = {
            outcome: result.outcome,
            orderId: result.order_id,
            status: result.status,
        };

        return NextResponse.json({ data: advanced });
    } catch (error) {
        return fulfillmentErrorResponse(error);
    }
}
