// component/products/post/ProductPostInfoForm.tsx

"use client";

import { useState } from "react";
import type { ProductPost } from "@mall/types";

import FormField from "@/component/common/field/FormField";
import ImageUploadField from "@/component/common/field/ImageUploadField";

export type ProductPostInfoFormProps = {
    post: ProductPost;
    onChange: (post: ProductPost) => void;
};

export function ProductPostInfoForm({
    post,
    onChange,
}: ProductPostInfoFormProps) {
    const [error, setError] = useState<string | null>(null);

    const updateThumbnail = (
        patch: Partial<ProductPost["thumbnail"]>,
    ) => {
        onChange({
            ...post,
            thumbnail: {
                ...post.thumbnail,
                ...patch,
            },
        });
    };

    const handleApply = () => {
        setError(null);

        if (
            post.thumbnail.discount >
            post.thumbnail.price
        ) {
            setError(
                "할인 가격은 표시 가격보다 높을 수 없습니다.",
            );
            return;
        }

    };

    return (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                    게시물 정보
                </h2>
            </div>

            <FormField
                label="게시물 제목"
                value={post.title}
                onChange={(value) => {
                    setError(null);

                    onChange({
                        ...post,
                        title: value,
                    });
                }}
                placeholder="게시물 제목을 입력하세요."
            />

            <ImageUploadField
                label="썸네일 이미지"
                imageUrl={post.thumbnail.imageUrl}
                onUpload={(files) => {
                    console.log("썸네일 이미지:", files);
                }}
            />

            <FormField
                label="썸네일 제목"
                value={post.thumbnail.title}
                onChange={(value) => {
                    setError(null);

                    updateThumbnail({
                        title: value,
                    });
                }}
                placeholder="썸네일 제목을 입력하세요."
            />

            <FormField
                label="할인 가격"
                value={String(
                    post.thumbnail.discount,
                )}
                onChange={(value) => {
                    setError(null);

                    updateThumbnail({
                        discount: Number(value),
                    });
                }}
                type="number"
                min={0}
                step={1}
            />

            <FormField
                label="표시 가격"
                value={String(
                    post.thumbnail.price,
                )}
                onChange={(value) => {
                    setError(null);

                    updateThumbnail({
                        price: Number(value),
                    });
                }}
                type="number"
                min={0}
                step={1}
            />

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={handleApply}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
                반영하기
            </button>
        </section>
    );
}