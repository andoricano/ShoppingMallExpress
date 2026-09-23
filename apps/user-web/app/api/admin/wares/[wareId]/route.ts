import { NextRequest, NextResponse } from "next/server";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ wareId: string }> },
) {
    try {
        const { wareId } = await context.params;
        const body = await request.json() as {
            action?: "update" | "adjust-stock";
            name?: string;
            wareCode?: string | null;
            wareType?: string;
            isActive?: boolean;
            meta?: Record<string, unknown>;
            adjustment?: number;
        };
        const supabase = await requireAdminServiceClient();

        if (body.action === "adjust-stock") {
            if (!Number.isInteger(body.adjustment) || body.adjustment === 0) {
                return NextResponse.json(
                    { message: "A non-zero integer adjustment is required." },
                    { status: 400 },
                );
            }

            const { data, error } = await supabase.rpc("adjust_ware_stock", {
                p_ware_id: wareId,
                p_adjustment: body.adjustment,
            });

            if (error) {
                throw error;
            }

            return NextResponse.json({ data });
        }

        const { error } = await supabase.rpc("update_ware", {
            p_ware_id: wareId,
            p_name: body.name ?? null,
            p_ware_code: body.wareCode ?? null,
            p_ware_type: body.wareType ?? null,
            p_is_active: body.isActive ?? null,
            p_meta: body.meta ?? null,
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: null });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
