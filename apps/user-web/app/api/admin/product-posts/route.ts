import { NextRequest, NextResponse } from "next/server";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import {
    PRODUCT_POST_COLUMNS,
    type ProductPostInput,
    type ProductPostRow,
    assertProductsExist,
    isProductPostStatus,
    parseIdList,
    replaceProductPostProducts,
    toProductPost,
    toProductPostPatch,
} from "@/lib/admin/productPost";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
    try {
        const supabase = await requireAdminServiceClient();
        const search = request.nextUrl.searchParams.get("search")?.trim();
        const status = request.nextUrl.searchParams.get("status");

        let query = supabase
            .from("product_posts")
            .select(PRODUCT_POST_COLUMNS)
            .order("created_at", { ascending: false });

        if (search) {
            query = query.ilike("title", `%${search}%`);
        }

        if (status) {
            if (!isProductPostStatus(status)) {
                throw new AdminBadRequestError("status must be DRAFT or PUBLISHED.");
            }

            query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as ProductPostRow[]).map(toProductPost),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ProductPostInput;
        const patch = toProductPostPatch({ ...body, title: body.title ?? "" });
        const productIds = body.productIds === undefined
            ? []
            : parseIdList(body.productIds, "productIds");

        const supabase = await requireAdminServiceClient();
        await assertProductsExist(supabase, productIds);

        const { data, error } = await supabase
            .from("product_posts")
            .insert(patch)
            .select(PRODUCT_POST_COLUMNS)
            .single();

        if (error) {
            throw error;
        }

        const post = data as ProductPostRow;

        try {
            await replaceProductPostProducts(supabase, post.id, productIds);
        } catch (linkError) {
            // No product-post save RPC exists in the confirmed contract, so
            // compensate to avoid leaving a post without its requested links.
            await supabase.from("product_posts").delete().eq("id", post.id);
            throw linkError;
        }

        return NextResponse.json(
            { data: toProductPost(post) },
            { status: 201 },
        );
    } catch (error) {
        return adminErrorResponse(error);
    }
}
