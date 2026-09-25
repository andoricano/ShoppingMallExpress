"use client";

import { useCallback } from "react";


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

    return {
        uploadImage,
    };
}
