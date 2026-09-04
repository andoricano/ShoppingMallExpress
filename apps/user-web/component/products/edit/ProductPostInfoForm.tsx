// component/products/post/ProductPostInfoForm.tsx

"use client";

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
                onChange={(value) =>
                    onChange({
                        ...post,
                        title: value,
                    })
                }
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
                onChange={(value) =>
                    updateThumbnail({
                        title: value,
                    })
                }
                placeholder="썸네일 제목을 입력하세요."
            />

            <FormField
                label="썸네일 요약"
                value={post.thumbnail.summary ?? ""}
                onChange={(value) =>
                    updateThumbnail({
                        summary: value,
                    })
                }
                placeholder="썸네일 요약을 입력하세요."
            />

            <FormField
                label="할인율"
                value={String(post.thumbnail.discount)}
                onChange={(value) =>
                    updateThumbnail({
                        discount: Number(value),
                    })
                }
                type="number"
                min={0}
                step={1}
            />

            <FormField
                label="표시 가격"
                value={String(post.thumbnail.price)}
                onChange={(value) =>
                    updateThumbnail({
                        price: Number(value),
                    })
                }
                type="number"
                min={0}
                step={1}
            />
        </section>
    );
}