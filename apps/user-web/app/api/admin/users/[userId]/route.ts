import { NextRequest, NextResponse } from "next/server";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> },
) {
    try {
        const { userId } = await context.params;
        const body = await request.json() as {
            role?: string;
            department?: string | null;
        };

        if (body.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Only CLIENT to ADMIN promotion is supported." },
                { status: 400 },
            );
        }

        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase.rpc("promote_user_to_admin", {
            p_user_id: userId,
            p_department: body.department ?? null,
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
