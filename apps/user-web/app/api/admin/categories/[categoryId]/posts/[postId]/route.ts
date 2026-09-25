import { NextRequest, NextResponse } from "next/server";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = {
    params: Promise<{ categoryId: string; postId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { categoryId, postId } = await context.params;
        const supabase = await requireAdminServiceClient();
        const { error } = await supabase
            .from("product_post_category_links")
            .delete()
            .eq("category_id", categoryId)
            .eq("product_post_id", postId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: null });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
