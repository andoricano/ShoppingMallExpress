import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    AdminProductDetail,
    JsonObject,
} from "@mall/types";

import {
    AdminBadRequestError,
    AdminNotFoundError,
} from "@/lib/api/admin-response";
import {
    PRODUCT_COLUMNS,
    type ProductRow,
    toProduct,
} from "@/lib/admin/productPost";

type OptionRow = {
    id: string;
    product_id: string;
    name: string;
    display_order: number;
    is_required: boolean;
    created_at: string;
    updated_at: string;
};

type OptionValueRow = {
    id: string;
    product_option_id: string;
    value: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type VariantRow = {
    id: string;
    product_id: string;
    sku_code: string | null;
    label: string | null;
    price: number | string;
    is_active: boolean;
    meta: JsonObject;
    created_at: string;
    updated_at: string;
};

/**
 * Loads the Admin editing view of a persisted Product.
 * Only Product domain tables are read; no Ware / Warehouse data.
 */
/**
 * Validates Product `imageUrls` (create and update): an ordered array of
 * absolute http(s) URLs. Temporary `blob:` previews are rejected, matching
 * the admin_update_product() check.
 */
export function parseProductImageUrls(value: unknown): string[] {
    if (
        !Array.isArray(value)
        || value.some((url) => typeof url !== "string" || !/^https?:\/\/\S+$/.test(url))
    ) {
        throw new AdminBadRequestError(
            "imageUrls must be an array of absolute http(s) URLs.",
        );
    }

    return value as string[];
}

export async function loadAdminProductDetail(
    supabase: SupabaseClient,
    productId: string,
): Promise<AdminProductDetail> {
    const { data: product, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("id", productId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!product) {
        throw new AdminNotFoundError("Product not found.");
    }

    const [optionsResult, variantsResult] = await Promise.all([
        supabase
            .from("product_options")
            .select("id, product_id, name, display_order, is_required, created_at, updated_at")
            .eq("product_id", productId)
            .order("display_order", { ascending: true }),
        supabase
            .from("product_variants")
            .select("id, product_id, sku_code, label, price, is_active, meta, created_at, updated_at")
            .eq("product_id", productId)
            .order("created_at", { ascending: true }),
    ]);

    if (optionsResult.error) throw optionsResult.error;
    if (variantsResult.error) throw variantsResult.error;

    // `is_sold_out` (Mall v3) is read on its own so that this Admin screen
    // keeps working against a database that does not have the column yet
    // (Postgres 42703); the flag is then simply absent.
    const soldOutResult = await supabase
        .from("product_variants")
        .select("id, is_sold_out")
        .eq("product_id", productId);
    const soldOut = new Map<string, boolean>();

    if (soldOutResult.error) {
        if (soldOutResult.error.code !== "42703") throw soldOutResult.error;
    } else {
        for (const row of soldOutResult.data ?? []) {
            soldOut.set(row.id as string, row.is_sold_out as boolean);
        }
    }

    const options = optionsResult.data as OptionRow[];
    const variants = variantsResult.data as VariantRow[];

    const [valuesResult, selectionsResult] = await Promise.all([
        options.length === 0
            ? { data: [], error: null }
            : supabase
                .from("product_option_values")
                .select("id, product_option_id, value, display_order, is_active, created_at, updated_at")
                .in("product_option_id", options.map((option) => option.id))
                .order("display_order", { ascending: true }),
        variants.length === 0
            ? { data: [], error: null }
            : supabase
                .from("product_variant_values")
                .select("product_variant_id, product_option_value_id")
                .in("product_variant_id", variants.map((variant) => variant.id)),
    ]);

    if (valuesResult.error) throw valuesResult.error;
    if (selectionsResult.error) throw selectionsResult.error;

    const values = (valuesResult.data ?? []) as OptionValueRow[];
    const selections = (selectionsResult.data ?? []) as {
        product_variant_id: string;
        product_option_value_id: string;
    }[];

    return {
        ...toProduct(product as ProductRow),
        options: options.map((option) => ({
            id: option.id,
            productId: option.product_id,
            name: option.name,
            displayOrder: option.display_order,
            isRequired: option.is_required,
            createdAt: option.created_at,
            updatedAt: option.updated_at,
            values: values
                .filter((value) => value.product_option_id === option.id)
                .map((value) => ({
                    id: value.id,
                    productOptionId: value.product_option_id,
                    value: value.value,
                    displayOrder: value.display_order,
                    isActive: value.is_active,
                    createdAt: value.created_at,
                    updatedAt: value.updated_at,
                })),
        })),
        variants: variants.map((variant) => ({
            id: variant.id,
            productId: variant.product_id,
            skuCode: variant.sku_code,
            label: variant.label,
            price: Number(variant.price),
            isActive: variant.is_active,
            ...(soldOut.has(variant.id) ? { isSoldOut: soldOut.get(variant.id) } : {}),
            meta: variant.meta,
            createdAt: variant.created_at,
            updatedAt: variant.updated_at,
            optionValueIds: selections
                .filter((selection) => selection.product_variant_id === variant.id)
                .map((selection) => selection.product_option_value_id),
        })),
    };
}
