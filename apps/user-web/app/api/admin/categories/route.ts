import { NextRequest, NextResponse } from "next/server";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { type CategoryInput, toCategoryPatch } from "@/lib/admin/category";
import {
    CATEGORY_COLUMNS,
    type CategoryRow,
    toProductPostCategory,
} from "@/lib/admin/productPost";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("product_post_categories")
            .select(CATEGORY_COLUMNS)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as CategoryRow[]).map(toProductPostCategory),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CategoryInput;
        const patch = toCategoryPatch({ ...body, name: body.name ?? "" });
        const supabase = await requireAdminServiceClient();

        const { data, error } = await supabase
            .from("product_post_categories")
            .insert(patch)
            .select(CATEGORY_COLUMNS)
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json(
            { data: toProductPostCategory(data as CategoryRow) },
            { status: 201 },
        );
    } catch (error) {
        return adminErrorResponse(error);
    }
}
