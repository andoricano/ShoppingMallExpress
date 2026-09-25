import { NextRequest, NextResponse } from "next/server";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type AdminRefundStatus = "APPROVED" | "REJECTED";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ refundId: string }> },
) {
    try {
        const { refundId } = await context.params;
        const body = await request.json() as {
            status?: string;
        };

        if (body.status !== "APPROVED" && body.status !== "REJECTED") {
            return NextResponse.json(
                { message: "Only APPROVED or REJECTED is allowed." },
                { status: 400 },
            );
        }

        const status: AdminRefundStatus = body.status;
        const supabase = await requireAdminServiceClient();
        const { error } = await supabase.rpc(
            "admin_transition_refund_status",
            {
                p_refund_request_id: refundId,
                p_status: status,
            },
        );

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: null });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
