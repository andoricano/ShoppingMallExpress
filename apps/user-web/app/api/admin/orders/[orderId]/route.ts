import { NextRequest, NextResponse } from "next/server";

import type { OrderStatus } from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";
import { toOrder } from "../route";

type OrderRow = Parameters<typeof toOrder>[0];

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ orderId: string }> },
) {
    try {
        const { orderId } = await context.params;
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", orderId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return NextResponse.json(
                { message: "Order not found." },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: toOrder(data as OrderRow) });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ orderId: string }> },
) {
    try {
        const { orderId } = await context.params;
        const body = await request.json() as { nextStatus?: OrderStatus };

        if (!body.nextStatus) {
            return NextResponse.json(
                { message: "nextStatus is required." },
                { status: 400 },
            );
        }

        const supabase = await requireAdminServiceClient();
        const { error } = await supabase.rpc(
            "admin_transition_order_status",
            {
                p_order_id: orderId,
                p_next_status: body.nextStatus,
            },
        );

        if (error) {
            throw error;
        }

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", orderId)
            .single();

        if (orderError) {
            throw orderError;
        }

        return NextResponse.json({ data: toOrder(order as OrderRow) });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
