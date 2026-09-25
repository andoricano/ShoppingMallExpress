import { NextRequest, NextResponse } from "next/server";

import {
    AdminNotFoundError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import {
    PRODUCT_COLUMNS,
    PRODUCT_POST_COLUMNS,
    type ProductPostInput,
    type ProductPostRow,
    type ProductRow,
    parseIdList,
    toProduct,
    toProductPost,
    toProductPostPatch,
} from "@/lib/admin/productPost";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ postId: string }> };

type ProductPostProductRow = {
    display_order: number;
    products: ProductRow | null;
};

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { postId } = await context.params;
        const supabase = await requireAdminServiceClient();

        const { data, error } = await supabase
            .from("product_posts")
            .select(PRODUCT_POST_COLUMNS)
            .eq("id", postId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new AdminNotFoundError("ProductPost not found.");
        }

        const { data: links, error: linkError } = await supabase
            .from("product_post_products")
            .select(`display_order, products (${PRODUCT_COLUMNS})`)
            .eq("product_post_id", postId)
            .order("display_order", { ascending: true });

        if (linkError) {
            throw linkError;
        }

        const products = ((links ?? []) as unknown as ProductPostProductRow[])
            .flatMap((link) => (link.products ? [toProduct(link.products)] : []));

        return NextResponse.json({
            data: toProductPost(data as ProductPostRow),
            products,
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { postId } = await context.params;
        const body = await request.json() as ProductPostInput;
        const patch = toProductPostPatch(body);
        const productIds = body.productIds === undefined
            ? undefined
            : parseIdList(body.productIds, "productIds");

        const supabase = await requireAdminServiceClient();

        // Patch + optional link replacement run in one transaction.
        // Missing ProductPost raises P0002 (404).
        const { data, error } = await supabase.rpc("admin_save_product_post", {
            p_product_post_id: postId,
            p_post: patch,
            p_product_ids: productIds ?? null,
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: toProductPost(data as ProductPostRow) });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { postId } = await context.params;
        const supabase = await requireAdminServiceClient();

        // product_post_products, category links, and wishlist rows cascade.
        const { data, error } = await supabase
            .from("product_posts")
            .delete()
            .eq("id", postId)
            .select("id")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new AdminNotFoundError("ProductPost not found.");
        }

        return NextResponse.json({ data: null });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
