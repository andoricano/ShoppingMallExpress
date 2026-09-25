import { NextRequest, NextResponse } from "next/server";

import type { ProductUpdateInput } from "@mall/types";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { loadAdminProductDetail } from "@/lib/admin/product";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { productId } = await context.params;
        const supabase = await requireAdminServiceClient();

        return NextResponse.json({
            data: await loadAdminProductDetail(supabase, productId),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { productId } = await context.params;
        const body = await request.json() as ProductUpdateInput;

        if (body.product !== undefined && (typeof body.product !== "object" || body.product === null)) {
            throw new AdminBadRequestError("product must be an object.");
        }

        if (body.options !== undefined && !Array.isArray(body.options)) {
            throw new AdminBadRequestError("options must be an array.");
        }

        if (body.variants !== undefined && !Array.isArray(body.variants)) {
            throw new AdminBadRequestError("variants must be an array.");
        }

        for (const variant of body.variants ?? []) {
            if (!variant.id && variant.price === undefined) {
                throw new AdminBadRequestError("A new variant requires a price.");
            }

            if (
                variant.optionValues !== undefined
                && (typeof variant.optionValues !== "object" || variant.optionValues === null || Array.isArray(variant.optionValues))
            ) {
                throw new AdminBadRequestError("optionValues must be an object.");
            }

            if (
                variant.price !== undefined
                && (typeof variant.price !== "number" || !Number.isFinite(variant.price) || variant.price < 0)
            ) {
                throw new AdminBadRequestError("Variant price must be a non-negative number.");
            }
        }

        const supabase = await requireAdminServiceClient();

        // Product + Options/Values + Variants (incl. additions and combination
        // changes) change in one transaction so the deferred variant-integrity
        // triggers and the inactive-value / duplicate-combination policies see
        // only the final state.
        const { error } = await supabase.rpc("admin_update_product", {
            p_product_id: productId,
            p_product: body.product ?? {},
            p_options: body.options ?? [],
            p_variants: body.variants ?? [],
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: await loadAdminProductDetail(supabase, productId),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
