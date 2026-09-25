import "server-only";

import { AdminBadRequestError } from "@/lib/api/admin-response";
import { toNullableText } from "@/lib/admin/productPost";

export type CategoryInput = {
    name?: string;
    slug?: string | null;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
};

/** Maps only the ProductPostCategory columns present in the request body. */
export function toCategoryPatch(body: CategoryInput) {
    const patch: Record<string, unknown> = {};

    if (body.name !== undefined) {
        if (typeof body.name !== "string" || body.name.trim() === "") {
            throw new AdminBadRequestError("name is required.");
        }

        patch.name = body.name.trim();
    }

    if (body.slug !== undefined) patch.slug = toNullableText(body.slug);
    if (body.description !== undefined) patch.description = toNullableText(body.description);

    if (body.displayOrder !== undefined) {
        if (!Number.isInteger(body.displayOrder) || body.displayOrder < 0) {
            throw new AdminBadRequestError("displayOrder must be a non-negative integer.");
        }

        patch.display_order = body.displayOrder;
    }

    if (body.isActive !== undefined) {
        if (typeof body.isActive !== "boolean") {
            throw new AdminBadRequestError("isActive must be a boolean.");
        }

        patch.is_active = body.isActive;
    }

    return patch;
}
