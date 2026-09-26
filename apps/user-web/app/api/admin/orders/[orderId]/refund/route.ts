import { NextRequest, NextResponse } from "next/server";

import { AdminBadRequestError } from "@/lib/api/admin-response";
import { fulfillmentErrorResponse, UUID_PATTERN } from "@/lib/admin/fulfillment";
import { requireAdminServiceContext } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ orderId: string }> };

/**
 * Seller-initiated Refund (DN-46): when an Order must be stopped after
 * PROCESSING (Cancel is refused), the Admin creates the Refund request on behalf
 * of the Order's Client, for the whole remaining quantity of every item, or for
 * the given `items`. It then follows the normal path: an Admin decision creates
 * the reversal in the same transaction, and stock returns only by the explicit
 * restock. Only PROCESSING, SHIPPED, and DELIVERED Orders qualify.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { orderId } = await context.params;
        const body = await request.json().catch(() => null) as
            { items?: { orderItemId: string; quantity: number }[]; reason?: string } | null;

        if (!UUID_PATTERN.test(orderId)) {
            throw new AdminBadRequestError("Invalid order id.");
        }

        if (body?.reason !== undefined && typeof body.reason !== "string") {
            throw new AdminBadRequestError("reason must be a string.");
        }

        const { supabase, adminId } = await requireAdminServiceContext();

        let items = body?.items;

        if (items === undefined) {
            // Whole remaining quantity: ordered minus the valid (REQUESTED / APPROVED) refunds.
            const { data: orderItems, error: itemsError } = await supabase
                .from("order_items")
                .select("id, quantity, refund_items(quantity, refund_requests(status))")
                .eq("order_id", orderId);

            if (itemsError) throw itemsError;

            items = (orderItems ?? []).map((item) => {
                const used = ((item.refund_items ?? []) as unknown as
                    { quantity: number; refund_requests: { status: string } | { status: string }[] | null }[])
                    .filter((refund) => {
                        const status = Array.isArray(refund.refund_requests)
                            ? refund.refund_requests[0]?.status
                            : refund.refund_requests?.status;
                        return status === "REQUESTED" || status === "APPROVED";
                    })
                    .reduce((sum, refund) => sum + refund.quantity, 0);

                return { orderItemId: item.id as string, quantity: (item.quantity as number) - used };
            }).filter((item) => item.quantity > 0);

            if (items.length === 0) {
                throw new AdminBadRequestError("Nothing left to refund.");
            }
        }

        const { data, error } = await supabase.rpc("admin_create_refund_request", {
            p_order_id: orderId,
            p_items: items,
            p_reason: body?.reason ?? null,
            p_actor_id: adminId,
        });

        if (error) {
            if (error.code === "P0001" && /cannot be refunded|exceeds ordered/.test(error.message)) {
                return NextResponse.json({ message: error.message }, { status: 409 });
            }

            throw error;
        }

        return NextResponse.json({ data: { refundRequestId: data as string } }, { status: 201 });
    } catch (error) {
        return fulfillmentErrorResponse(error);
    }
}
