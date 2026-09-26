import { NextResponse } from "next/server";

import { adminErrorResponse } from "@/lib/api/admin-response";

export const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BLOCKED_MESSAGES = [
    "unallocated quantity",
    "Invalid Order status transition",
    "no succeeded Payment",
    "Only a PENDING Order can hold allocation",
];

/**
 * Error mapping of the Mall v3 fulfillment routes. A business refusal (the
 * allocation gate, an invalid step, no payment evidence) is a 409 with its
 * message; everything else uses the shared Admin mapping.
 */
export function fulfillmentErrorResponse(error: unknown) {
    const { code, message = "" } = typeof error === "object" && error !== null
        ? error as { code?: string; message?: string }
        : {};

    if (code === "P0001" && BLOCKED_MESSAGES.some((text) => message.includes(text))) {
        return NextResponse.json({ message }, { status: 409 });
    }

    return adminErrorResponse(error);
}

/** Row shape of get_order_shortage(). */
export type OrderShortageRow = {
    order_item_id: string;
    quantity: number;
    allocated_quantity: number | string;
    shortage_quantity: number | string;
};

export function toItemShortage(row: OrderShortageRow) {
    return {
        orderItemId: row.order_item_id,
        quantity: Number(row.quantity),
        allocatedQuantity: Number(row.allocated_quantity),
        shortageQuantity: Number(row.shortage_quantity),
    };
}
