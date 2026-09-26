import { NextRequest, NextResponse } from "next/server";

import type { AdminOrderShortageSummary } from "@mall/types";

import { fulfillmentErrorResponse } from "@/lib/admin/fulfillment";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type SummaryRow = {
    order_id: string;
    order_status: string;
    ordered_quantity: number | string;
    allocated_quantity: number | string;
    shortage_quantity: number | string;
};

/**
 * Admin-only list of PENDING Orders with their ordered / allocated / shortage
 * quantity (BR-12), oldest first. `?onlyShort=true` keeps the Orders that still
 * have shortage. Never exposed to Consumers.
 */
export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams;
        const limit = Number(params.get("limit") ?? 200);

        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase.rpc("get_orders_shortage", {
            p_order_ids: null,
            p_only_short: params.get("onlyShort") === "true",
            p_limit: Number.isFinite(limit) ? limit : 200,
        });

        if (error) {
            throw error;
        }

        const summaries: AdminOrderShortageSummary[] = ((data ?? []) as SummaryRow[]).map((row) => ({
            orderId: row.order_id,
            orderStatus: row.order_status,
            orderedQuantity: Number(row.ordered_quantity),
            allocatedQuantity: Number(row.allocated_quantity),
            shortageQuantity: Number(row.shortage_quantity),
        }));

        return NextResponse.json({ data: summaries });
    } catch (error) {
        return fulfillmentErrorResponse(error);
    }
}
