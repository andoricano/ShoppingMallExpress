import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    JsonObject,
    Product,
    ProductPost,
    ProductPostCategory,
    ProductPostStatus,
} from "@mall/types";

import { AdminBadRequestError } from "@/lib/api/admin-response";

export const PRODUCT_POST_COLUMNS =
    "id, title, slug, summary, content, thumbnail_url, status, published_at, created_at, updated_at";

export const PRODUCT_COLUMNS =
    "id, name, description, image_urls, is_active, meta, created_at, updated_at";

export const CATEGORY_COLUMNS =
    "id, name, slug, description, display_order, is_active, created_at, updated_at";

export type ProductPostRow = {
    id: string;
    title: string;
    slug: string | null;
    summary: string | null;
    content: JsonObject;
    thumbnail_url: string | null;
    status: ProductPostStatus;
    published_at: string | null;
    created_at: string;
    updated_at: string;
};

export type ProductRow = {
    id: string;
    name: string;
    description: string | null;
    image_urls: string[];
    is_active: boolean;
    meta: JsonObject;
    created_at: string;
    updated_at: string;
};

export type CategoryRow = {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export function toProductPost(row: ProductPostRow): ProductPost {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        content: row.content,
        thumbnailUrl: row.thumbnail_url,
        status: row.status,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toProduct(row: ProductRow): Product {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrls: row.image_urls,
        isActive: row.is_active,
        meta: row.meta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toProductPostCategory(row: CategoryRow): ProductPostCategory {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function isProductPostStatus(value: unknown): value is ProductPostStatus {
    return value === "DRAFT" || value === "PUBLISHED";
}

/** Empty strings are stored as NULL so nullable unique slugs do not collide. */
export function toNullableText(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
}

export type ProductPostInput = {
    title?: string;
    slug?: string | null;
    summary?: string | null;
    content?: JsonObject;
    thumbnailUrl?: string | null;
    status?: ProductPostStatus;
    publishedAt?: string | null;
    productIds?: string[];
};

/** Maps only the ProductPost columns present in the request body. */
export function toProductPostPatch(body: ProductPostInput) {
    const patch: Record<string, unknown> = {};

    if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim() === "") {
            throw new AdminBadRequestError("title is required.");
        }

        patch.title = body.title.trim();
    }

    if (body.slug !== undefined) patch.slug = toNullableText(body.slug);
    if (body.summary !== undefined) patch.summary = toNullableText(body.summary);
    if (body.thumbnailUrl !== undefined) patch.thumbnail_url = toNullableText(body.thumbnailUrl);
    if (body.publishedAt !== undefined) patch.published_at = toNullableText(body.publishedAt);

    if (body.content !== undefined) {
        if (!body.content || typeof body.content !== "object" || Array.isArray(body.content)) {
            throw new AdminBadRequestError("content must be a JSON object.");
        }

        patch.content = body.content;
    }

    if (body.status !== undefined) {
        if (!isProductPostStatus(body.status)) {
            throw new AdminBadRequestError("status must be DRAFT or PUBLISHED.");
        }

        patch.status = body.status;
    }

    return patch;
}

export function parseIdList(value: unknown, field: string): string[] {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item === "")) {
        throw new AdminBadRequestError(`${field} must be an array of ids.`);
    }

    return Array.from(new Set(value as string[]));
}

/**
 * Rejects Product ids that are not persisted Products so the N:N link write
 * fails with a clear 400 instead of a foreign-key violation.
 */
export async function assertProductsExist(
    supabase: SupabaseClient,
    productIds: string[],
) {
    if (productIds.length === 0) {
        return;
    }

    const { data, error } = await supabase
        .from("products")
        .select("id")
        .in("id", productIds);

    if (error) {
        throw error;
    }

    if ((data ?? []).length !== productIds.length) {
        throw new AdminBadRequestError(
            "productIds contains a Product that does not exist.",
        );
    }
}

/** Replaces the ordered ProductPost ↔ Product links. */
export async function replaceProductPostProducts(
    supabase: SupabaseClient,
    productPostId: string,
    productIds: string[],
) {
    const { error: deleteError } = await supabase
        .from("product_post_products")
        .delete()
        .eq("product_post_id", productPostId);

    if (deleteError) {
        throw deleteError;
    }

    if (productIds.length === 0) {
        return;
    }

    const { error: insertError } = await supabase
        .from("product_post_products")
        .insert(
            productIds.map((productId, index) => ({
                product_post_id: productPostId,
                product_id: productId,
                display_order: index,
            })),
        );

    if (insertError) {
        throw insertError;
    }
}
