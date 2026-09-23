import { NextResponse } from "next/server";

import type { RefundItem, RefundRequest } from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RefundItemRow = {
    id: string;
    refund_request_id: string;
    order_item_id: string;
    quantity: number;
    refund_amount: number;
    created_at: string;
};

type RefundRequestRow = {
    id: string;
    order_id: string;
    client_id: string;
    status: RefundRequest["status"];
    reason: string | null;
    requested_amount: number;
    requested_at: string;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    refund_items: RefundItemRow[] | null;
};

function toRefundItem(row: RefundItemRow): RefundItem {
    return {
        id: row.id,
        refundRequestId: row.refund_request_id,
        orderItemId: row.order_item_id,
        quantity: row.quantity,
        refundAmount: row.refund_amount,
        createdAt: row.created_at,
    };
}

function toRefundRequest(row: RefundRequestRow): RefundRequest {
    return {
        id: row.id,
        orderId: row.order_id,
        clientId: row.client_id,
        status: row.status,
        reason: row.reason,
        requestedAmount: row.requested_amount,
        requestedAt: row.requested_at,
        processedAt: row.processed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: (row.refund_items ?? []).map(toRefundItem),
    };
}

/**
 * The finalized SQL has no Admin refund-decision RPC. This route intentionally
 * exposes only the internal Admin read model and does not mutate refunds.
 */
export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("refund_requests")
            .select("*, refund_items(*)")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as RefundRequestRow[]).map(toRefundRequest),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
