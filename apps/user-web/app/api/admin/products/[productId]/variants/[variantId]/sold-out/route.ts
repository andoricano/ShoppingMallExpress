import { NextRequest, NextResponse } from "next/server";

import {
    AdminBadRequestError,
    AdminNotFoundError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = {
    params: Promise<{ productId: string; variantId: string }>;
};

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sets the explicit sold-out state of one Variant (Mall v3, BR-19/BR-46).
 * It is decided by the Admin and is independent of stock and of `isActive`.
 * The database write goes through admin_set_variant_sold_out() (service role).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { productId, variantId } = await context.params;
        const body = await request.json().catch(() => null) as { isSoldOut?: unknown } | null;

        if (!UUID_PATTERN.test(productId) || !UUID_PATTERN.test(variantId)) {
            throw new AdminBadRequestError("Invalid product or variant id.");
        }

        if (typeof body?.isSoldOut !== "boolean") {
            throw new AdminBadRequestError("isSoldOut must be a boolean.");
        }

        const supabase = await requireAdminServiceClient();

        const { data: variant, error: lookupError } = await supabase
            .from("product_variants")
            .select("id")
            .eq("id", variantId)
            .eq("product_id", productId)
            .maybeSingle();

        if (lookupError) {
            throw lookupError;
        }

        if (!variant) {
            throw new AdminNotFoundError("Variant not found.");
        }

        const { data, error } = await supabase.rpc("admin_set_variant_sold_out", {
            p_product_variant_id: variantId,
            p_is_sold_out: body.isSoldOut,
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: { isSoldOut: data as boolean } });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
