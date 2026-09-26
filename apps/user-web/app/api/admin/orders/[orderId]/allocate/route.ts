import { NextRequest, NextResponse } from "next/server";

import type { AdminOrderAllocationResult } from "@mall/types";

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
 * Mall v3 Admin additional allocation for a PENDING Order (or one OrderItem of
 * it). It takes what is currently available: possibly nothing, which is not an
 * error. It never takes stock held by another Order and is never automatic; a
 * newer Order may take the stock first. Returns the quantity allocated now and
 * the ordered / allocated / shortage state afterwards. Admin only.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { orderId } = await context.params;
        const body = await request.json().catch(() => null) as { orderItemId?: unknown } | null;

        if (!UUID_PATTERN.test(orderId)) {
            throw new AdminBadRequestError("Invalid order id.");
        }

        const orderItemId = body?.orderItemId;

        if (orderItemId !== undefined && (typeof orderItemId !== "string" || !UUID_PATTERN.test(orderItemId))) {
            throw new AdminBadRequestError("orderItemId must be a UUID.");
        }

        const supabase = await requireAdminServiceClient();

        if (orderItemId) {
            const { data: item, error: itemError } = await supabase
                .from("order_items")
                .select("id")
                .eq("id", orderItemId)
                .eq("order_id", orderId)
                .maybeSingle();

            if (itemError) throw itemError;

            if (!item) {
                return NextResponse.json({ message: "Order item not found." }, { status: 404 });
            }
        }

        const { data: allocated, error } = orderItemId
            ? await supabase.rpc("allocate_order_item_stock", { p_order_item_id: orderItemId })
            : await supabase.rpc("allocate_order_stock", { p_order_id: orderId });

        if (error) {
            throw error;
        }

        const { data: rows, error: shortageError } = await supabase.rpc("get_order_shortage", {
            p_order_id: orderId,
        });

        if (shortageError) {
            throw shortageError;
        }

        const result: AdminOrderAllocationResult = {
            allocatedQuantity: Number(allocated ?? 0),
            items: ((rows ?? []) as OrderShortageRow[]).map(toItemShortage),
        };

        return NextResponse.json({ data: result });
    } catch (error) {
        return fulfillmentErrorResponse(error);
    }
}
