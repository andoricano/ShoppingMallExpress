import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

// Must match the `images` bucket contract in
// supabase/migrations/20260925110000_images_storage_bucket.sql.
const IMAGE_BUCKET = "images";
const IMAGE_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

/**
 * Issues a one-time signed upload URL for an Admin ProductPost thumbnail.
 * The browser uploads directly to Storage with the signed token; the
 * service-role key never leaves the server.
 */
export async function POST(request: Request) {
    try {
        const supabase = await requireAdminServiceClient();
        const body = await request.json().catch(() => null) as {
            contentType?: unknown;
        } | null;
        const contentType = typeof body?.contentType === "string"
            ? body.contentType
            : "";
        const extension = IMAGE_EXTENSIONS[contentType];

        if (!extension) {
            throw new AdminBadRequestError(
                "지원하지 않는 이미지 형식입니다.",
            );
        }

        const path = `product-posts/thumbnails/${randomUUID()}.${extension}`;
        const storage = supabase.storage.from(IMAGE_BUCKET);
        const { data, error } = await storage.createSignedUploadUrl(path);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: {
                path: data.path,
                token: data.token,
                signedUrl: data.signedUrl,
                publicUrl: storage.getPublicUrl(data.path).data.publicUrl,
            },
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
