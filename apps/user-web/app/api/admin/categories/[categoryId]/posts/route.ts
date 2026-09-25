import { NextRequest, NextResponse } from "next/server";

import type { ProductPostCategoryItem } from "@mall/types";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { parseIdList } from "@/lib/admin/productPost";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { categoryId } = await context.params;
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("product_post_category_links")
            .select("product_post_id")
            .eq("category_id", categoryId)
            .order("display_order", { ascending: true });

        if (error) {
            throw error;
        }

        const items: ProductPostCategoryItem[] = (
            data as { product_post_id: string }[]
        ).map((row) => ({ id: row.product_post_id }));

        return NextResponse.json({ data: items });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { categoryId } = await context.params;
        const body = await request.json() as { postIds?: unknown };
        const postIds = parseIdList(body.postIds, "postIds");

        if (postIds.length === 0) {
            throw new AdminBadRequestError("postIds must not be empty.");
        }

        const supabase = await requireAdminServiceClient();

        // Existing pairs are kept as-is (product_post_category_links_pair_unique).
        const { error } = await supabase
            .from("product_post_category_links")
            .upsert(
                postIds.map((productPostId) => ({
                    product_post_id: productPostId,
                    category_id: categoryId,
                })),
                {
                    onConflict: "product_post_id,category_id",
                    ignoreDuplicates: true,
                },
            );

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: null }, { status: 201 });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
