import type { Request, Response } from "express";
import crypto from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";

const IMAGE_BUCKET = "images";

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const EXTENSION_MAP: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};


export async function createImageUploadUrl(
    req: Request,
    res: Response,
) {
    const { filename, contentType } = req.body as {
        filename?: string;
        contentType?: string;
    };

    console.log("[IMAGE] upload-url request:", {
        filename,
        contentType,
    });

    if (
        !contentType ||
        !ALLOWED_IMAGE_TYPES.has(contentType)
    ) {
        return res.status(400).json({
            success: false,
            message: "지원하지 않는 이미지 형식입니다.",
        });
    }

    const extension = EXTENSION_MAP[contentType];

    const path = [
        "product-posts",
        "thumbnails",
        `${crypto.randomUUID()}.${extension}`,
    ].join("/");

    const { data, error } =
        await supabaseAdmin.storage
            .from(IMAGE_BUCKET)
            .createSignedUploadUrl(path);

    if (error) {
        console.error(
            "[IMAGE] createSignedUploadUrl error:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "이미지 업로드 URL 생성에 실패했습니다.",
        });
    }

    console.log("[IMAGE] signed upload:", {
        path: data.path,
        signedUrl: data.signedUrl,
    });

    return res.json({
        success: true,
        data: {
            path: data.path,
            token: data.token,
            signedUrl: data.signedUrl,
        },
    });
}