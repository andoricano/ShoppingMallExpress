"use client";

import { useCallback, useRef } from "react";
import type { JSONContent } from "@tiptap/core";

import type { PendingImage } from "@/component/products/post/editor/useEditSection";

import {
    collectTemporaryImageSources,
    replaceImageSources,
} from "./contentImages";


/** Storage folder under the `images` bucket; see the upload-url route. */
export type ImageUploadPurpose = "thumbnail" | "content" | "product";

export interface ImageUploadResult {
    path: string;
    imageUrl: string;
}

interface CreateImageUploadUrlResponse {
    path: string;
    token: string;
    signedUrl: string;
    publicUrl: string;
}

export function useImageApi() {
    const uploadImage = useCallback(
        async (
            file: File,
            purpose: ImageUploadPurpose = "thumbnail",
        ): Promise<ImageUploadResult> => {
            if (!file) {
                throw new Error(
                    "업로드할 이미지가 없습니다.",
                );
            }

            const response = await fetch(
                "/api/admin/images/upload-url",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        purpose,
                    }),
                },
            );

            const result = (await response.json().catch(() => ({}))) as {
                message?: string;
                data?: CreateImageUploadUrlResponse;
            };

            if (
                !response.ok ||
                !result.data
            ) {
                throw new Error(
                    result.message ??
                    "이미지 업로드 URL 생성에 실패했습니다.",
                );
            }

            const {
                path,
                signedUrl,
                publicUrl,
            } = result.data;
            const uploadResponse =
                await fetch(signedUrl, {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            file.type,
                    },
                    body: file,
                });

            if (!uploadResponse.ok) {
                const message =
                    await uploadResponse.text();

                throw new Error(
                    message ||
                    "이미지 업로드에 실패했습니다.",
                );
            }

            return {
                path,
                imageUrl: publicUrl,
            };
        },
        [],
    );

    // previewUrl → public URL of body images already uploaded by this editor
    // session, so retries and repeated saves never upload the same file twice.
    const uploadedContentImagesRef = useRef(new Map<string, string>());

    /**
     * Uploads the pending body images still referenced by `content` and
     * returns a copy whose temporary `blob:` sources are replaced with public
     * URLs. Throws before returning if any upload fails or a temporary source
     * has no pending file, so no temporary URL can be persisted.
     */
    const uploadContentImages = useCallback(
        async (
            content: JSONContent,
            pendingImages: PendingImage[],
        ): Promise<JSONContent> => {
            const uploaded = uploadedContentImagesRef.current;
            const missing = collectTemporaryImageSources(content)
                .filter((src) => !uploaded.has(src));

            await Promise.all(
                missing.map(async (src) => {
                    const pending = pendingImages.find(
                        (image) => image.previewUrl === src,
                    );

                    if (!pending) {
                        return;
                    }

                    const { imageUrl } = await uploadImage(
                        pending.file,
                        "content",
                    );

                    uploaded.set(src, imageUrl);
                }),
            );

            return replaceImageSources(content, uploaded);
        },
        [uploadImage],
    );

    // previewUrl → public URL of Product images already uploaded by this hook
    // instance, so a retry after a failed save never re-uploads a file.
    const uploadedProductImagesRef = useRef(new Map<string, string>());

    /**
     * Resolves an ordered Product image list to public URLs. Persisted URLs are
     * kept as-is; items with a pending `file` are uploaded (`purpose:
     * "product"`). Rejects if any upload fails, so callers never save a
     * partial or temporary `image_urls` list.
     */
    const uploadProductImages = useCallback(
        async (
            items: { url: string; file?: File }[],
        ): Promise<string[]> => {
            const uploaded = uploadedProductImagesRef.current;

            await Promise.all(
                items
                    .filter((item) => item.file && !uploaded.has(item.url))
                    .map(async (item) => {
                        const { imageUrl } = await uploadImage(
                            item.file!,
                            "product",
                        );

                        uploaded.set(item.url, imageUrl);
                    }),
            );

            return items.map((item) =>
                item.file ? uploaded.get(item.url)! : item.url,
            );
        },
        [uploadImage],
    );

    return {
        uploadImage,
        uploadContentImages,
        uploadProductImages,
    };
}
