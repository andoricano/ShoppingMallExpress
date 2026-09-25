import { NextRequest, NextResponse } from "next/server";

import type {
    AdminLinkVariantWareInput,
    AdminLinkVariantWareResult,
    AdminProductVariantWares,
} from "@mall/types";

import {
    AdminBadRequestError,
    AdminNotFoundError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ productId: string }> };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LinkRow = {
    product_variant_id: string;
    ware_id: string;
    wares: {
        ware_code: string | null;
        name: string;
        current_stock: number;
        reserved_stock: number;
        is_active: boolean;
        warehouses: { name: string } | null;
    } | null;
};

/**
 * Admin-only ProductVariant <-> Ware links of one Product. Ware/Warehouse data
 * stays inside this trusted boundary; the Consumer Product contract never
 * carries it.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { productId } = await context.params;

        if (!UUID_PATTERN.test(productId)) {
            throw new AdminBadRequestError("A valid Product id is required.");
        }

        const supabase = await requireAdminServiceClient();
        const { data: variants, error: variantError } = await supabase
            .from("product_variants")
            .select("id")
            .eq("product_id", productId)
            .order("created_at", { ascending: true });

        if (variantError) {
            throw variantError;
        }

        const variantIds = (variants as { id: string }[]).map((variant) => variant.id);
        let links: LinkRow[] = [];

        if (variantIds.length > 0) {
            const { data, error } = await supabase
                .from("product_variant_wares")
                .select(
                    "product_variant_id, ware_id, "
                    + "wares(ware_code, name, current_stock, reserved_stock, is_active, warehouses(name))",
                )
                .in("product_variant_id", variantIds);

            if (error) {
                throw error;
            }

            links = data as unknown as LinkRow[];
        }

        const result: AdminProductVariantWares[] = variantIds.map((variantId) => ({
            productVariantId: variantId,
            wares: links
                .filter((link) => link.product_variant_id === variantId)
                .map((link) => ({
                    wareId: link.ware_id,
                    wareCode: link.wares?.ware_code ?? null,
                    wareName: link.wares?.name ?? link.ware_id,
                    warehouseName: link.wares?.warehouses?.name ?? null,
                    currentStock: link.wares?.current_stock ?? 0,
                    reservedStock: link.wares?.reserved_stock ?? 0,
                    isActive: link.wares?.is_active ?? false,
                })),
        }));

        return NextResponse.json({ data: result });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

/**
 * Links an existing ProductVariant of this Product to a Ware through the
 * existing service-role-only link_product_variant_ware() RPC. The RPC only
 * knows Variant + Ware, so this route enforces that the Variant belongs to the
 * Product in the URL. Linking an already linked pair is a no-op.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const supabase = await requireAdminServiceClient();
        const { productId } = await context.params;
        const body = await request.json().catch(() => null) as
            Partial<AdminLinkVariantWareInput> | null;

        if (
            !UUID_PATTERN.test(productId)
            || typeof body?.productVariantId !== "string"
            || !UUID_PATTERN.test(body.productVariantId)
            || typeof body.wareId !== "string"
            || !UUID_PATTERN.test(body.wareId)
        ) {
            throw new AdminBadRequestError(
                "Valid Product, ProductVariant and Ware ids are required.",
            );
        }

        const { data: variant, error: variantError } = await supabase
            .from("product_variants")
            .select("id, product_id")
            .eq("id", body.productVariantId)
            .maybeSingle();

        if (variantError) {
            throw variantError;
        }

        if (!variant) {
            throw new AdminNotFoundError("ProductVariant not found.");
        }

        if (variant.product_id !== productId) {
            throw new AdminBadRequestError(
                "ProductVariant does not belong to the Product.",
            );
        }

        const { data: ware, error: wareError } = await supabase
            .from("wares")
            .select("id")
            .eq("id", body.wareId)
            .maybeSingle();

        if (wareError) {
            throw wareError;
        }

        if (!ware) {
            throw new AdminNotFoundError("Ware not found.");
        }

        const { data: existing, error: existingError } = await supabase
            .from("product_variant_wares")
            .select("id")
            .eq("product_variant_id", body.productVariantId)
            .eq("ware_id", body.wareId)
            .maybeSingle();

        if (existingError) {
            throw existingError;
        }

        if (existing) {
            const result: AdminLinkVariantWareResult = {
                relationId: existing.id as string,
                alreadyLinked: true,
            };

            return NextResponse.json({ data: result });
        }

        // The RPC is itself idempotent for the (Variant, Ware) pair, so a
        // concurrent duplicate resolves to the same relation id.
        const { data: relationId, error } = await supabase.rpc(
            "link_product_variant_ware",
            {
                p_product_variant_id: body.productVariantId,
                p_ware_id: body.wareId,
            },
        );

        if (error) {
            throw error;
        }

        const result: AdminLinkVariantWareResult = {
            relationId: relationId as string,
            alreadyLinked: false,
        };

        return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
