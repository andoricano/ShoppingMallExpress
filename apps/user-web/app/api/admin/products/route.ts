import { NextRequest, NextResponse } from "next/server";

import type {
    ProductCreateInput,
    ProductCreateResult,
    ProductVariantCreateInput,
} from "@mall/types";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { parseProductImageUrls } from "@/lib/admin/product";
import {
    PRODUCT_COLUMNS,
    type ProductRow,
    toProduct,
} from "@/lib/admin/productPost";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

/**
 * Admin-only request shape. `wareId` stays inside this server boundary and is
 * linked through the existing link_product_variant_ware() RPC.
 */
type AdminProductVariantInput = ProductVariantCreateInput & { wareId?: string };
type AdminProductCreateBody = Omit<ProductCreateInput, "variants"> & {
    variants?: AdminProductVariantInput[];
};

function validateBody(body: AdminProductCreateBody) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
        throw new AdminBadRequestError("name is required.");
    }

    if (!Array.isArray(body.variants) || body.variants.length === 0) {
        throw new AdminBadRequestError("At least one variant is required.");
    }

    for (const variant of body.variants) {
        if (typeof variant.price !== "number" || !Number.isFinite(variant.price) || variant.price < 0) {
            throw new AdminBadRequestError("Variant price must be a non-negative number.");
        }
    }

    if (body.options !== undefined && !Array.isArray(body.options)) {
        throw new AdminBadRequestError("options must be an array.");
    }

    if (body.imageUrls !== undefined) {
        parseProductImageUrls(body.imageUrls);
    }

    return body.variants;
}

/** Persisted Products only, for linking existing Products to a ProductPost. */
export async function GET(request: NextRequest) {
    try {
        const supabase = await requireAdminServiceClient();
        const search = request.nextUrl.searchParams.get("search")?.trim();

        let query = supabase
            .from("products")
            .select(PRODUCT_COLUMNS)
            .order("created_at", { ascending: false })
            .limit(50);

        if (search) {
            query = query.ilike("name", `%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as ProductRow[]).map(toProduct),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as AdminProductCreateBody;
        const variants = validateBody(body);
        const supabase = await requireAdminServiceClient();

        // Product + Options + Values + Variants are created in one
        // transaction so the deferred variant-integrity triggers pass.
        const { data: created, error: createError } = await supabase.rpc(
            "admin_create_product",
            {
                p_product: {
                    name: body.name,
                    description: body.description ?? null,
                    imageUrls: body.imageUrls ?? [],
                    isActive: body.isActive ?? true,
                    meta: body.meta ?? {},
                },
                p_options: body.options ?? [],
                p_variants: variants.map((variant) => ({
                    price: variant.price,
                    skuCode: variant.skuCode ?? null,
                    label: variant.label ?? null,
                    isActive: variant.isActive ?? true,
                    meta: variant.meta ?? {},
                    optionValues: variant.optionValues ?? {},
                })),
            },
        );

        if (createError) {
            throw createError;
        }

        const result = created as ProductCreateResult;

        try {
            for (const [index, variant] of variants.entries()) {
                const variantId = result.variantIds[index];

                if (!variant.wareId || !variantId) {
                    continue;
                }

                const { error: linkError } = await supabase.rpc(
                    "link_product_variant_ware",
                    {
                        p_product_variant_id: variantId,
                        p_ware_id: variant.wareId,
                    },
                );

                if (linkError) {
                    throw linkError;
                }
            }
        } catch (linkError) {
            // The Product was created moments ago and cannot be referenced by
            // carts/orders yet; remove it so a failed Ware link leaves no
            // partially configured Product (variants/links cascade).
            await supabase.from("products").delete().eq("id", result.productId);
            throw linkError;
        }

        const { data: product, error: productError } = await supabase
            .from("products")
            .select(PRODUCT_COLUMNS)
            .eq("id", result.productId)
            .single();

        if (productError) {
            throw productError;
        }

        return NextResponse.json(
            {
                data: toProduct(product as ProductRow),
                variantIds: result.variantIds,
            },
            { status: 201 },
        );
    } catch (error) {
        return adminErrorResponse(error);
    }
}
