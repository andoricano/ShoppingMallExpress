import { NextRequest, NextResponse } from "next/server";

import {
    AdminBadRequestError,
    AdminNotFoundError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { type CategoryInput, toCategoryPatch } from "@/lib/admin/category";
import {
    CATEGORY_COLUMNS,
    type CategoryRow,
    toProductPostCategory,
} from "@/lib/admin/productPost";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { categoryId } = await context.params;
        const patch = toCategoryPatch(await request.json() as CategoryInput);

        if (Object.keys(patch).length === 0) {
            throw new AdminBadRequestError("No category fields to update.");
        }

        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("product_post_categories")
            .update(patch)
            .eq("id", categoryId)
            .select(CATEGORY_COLUMNS)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new AdminNotFoundError("Category not found.");
        }

        return NextResponse.json({ data: toProductPostCategory(data as CategoryRow) });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { categoryId } = await context.params;
        const supabase = await requireAdminServiceClient();

        // product_post_category_links rows cascade with the category.
        const { data, error } = await supabase
            .from("product_post_categories")
            .delete()
            .eq("id", categoryId)
            .select(CATEGORY_COLUMNS)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new AdminNotFoundError("Category not found.");
        }

        return NextResponse.json({ data: toProductPostCategory(data as CategoryRow) });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
