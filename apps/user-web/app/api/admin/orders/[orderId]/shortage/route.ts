import { NextRequest, NextResponse } from "next/server";

import type { AdminOrderItemShortage } from "@mall/types";

import { AdminBadRequestError } from "@/lib/api/admin-response";
import {
    fulfillmentErrorResponse,
    toItemShortage,
    UUID_PATTERN,
    type OrderShortageRow,
} from "@/lib/admin/fulfillment";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ orderId: string }> };

/**
 * Admin-only ordered / allocated / shortage per OrderItem of one Order (BR-12).
 * Shortage is computed from the allocation rows. Never exposed to Consumers.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { orderId } = await context.params;

        if (!UUID_PATTERN.test(orderId)) {
            throw new AdminBadRequestError("Invalid order id.");
        }

        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase.rpc("get_order_shortage", { p_order_id: orderId });

        if (error) {
            throw error;
        }

        const items: AdminOrderItemShortage[] = ((data ?? []) as OrderShortageRow[]).map(toItemShortage);

        return NextResponse.json({ data: items });
    } catch (error) {
        return fulfillmentErrorResponse(error);
    }
}
