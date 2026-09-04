// component/products/post/ProductPostEditor.tsx

"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Product, ProductPost } from "@mall/types";

import { ProductPreview } from "./ProductPreview";
import { ProductDescriptionEditor } from "../post/editor/PostEditor";
import { ProductPostInfoForm } from "./ProductPostInfoForm";
import { ProductPostForm } from "@/hooks/products/useProductPostEditor";

export type ProductPostEditorMode =
    | "create"
    | "edit";

export interface ProductPostEditorProps {
    mode: ProductPostEditorMode;
    productPost?: ProductPost | null;

    selectedProducts: Product[];

    saving?: boolean;

    onCreate?: (
        data: ProductPostForm,
    ) => Promise<ProductPost | undefined>;

    onUpdate?: (
        data: ProductPostForm,
    ) => Promise<ProductPost | undefined>;
}

const createEmptyProductPost = (): ProductPost => ({
    id: "",
    title: "",
    thumbnail: {
        imageUrl: "",
        title: "",
        summary: "",
        discount: 0,
        price: 0,
        tags: [],
    },
    imageUrls: [],
    content: "",
    productIds: [],
    isPublished: false,
    viewCount: 0,
    publishedAt: undefined,
    metadata: {},
    createdAt: "",
    updatedAt: "",
});

export function ProductPostEditor({
    mode,
    productPost = null,
    selectedProducts,
    saving = false,
    onCreate,
    onUpdate,
}: ProductPostEditorProps) {
    const [currentPost, setCurrentPost] =
        useState<ProductPost>(
            productPost ?? createEmptyProductPost(),
        );

    useEffect(() => {
        if (productPost) {
            setCurrentPost(productPost);
        }
    }, [productPost]);

    const handleDescriptionChange = (
        content: JSONContent,
    ) => {
        setCurrentPost((prev) => ({
            ...prev,
            content: JSON.stringify(content),
        }));
    };

    const handleSave = async () => {
        const data: ProductPostForm = {
            title: currentPost.title,
            thumbnail: currentPost.thumbnail,
            imageUrls: currentPost.imageUrls,
            content: currentPost.content,
            isPublished: currentPost.isPublished,
            metadata: currentPost.metadata,
        };

        if (mode === "create") {
            await onCreate?.(data);
            return;
        }

        await onUpdate?.(data);
    };


    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 중앙 - Editor */}
            <div className="space-y-6">
                <ProductPostInfoForm
                    post={currentPost}
                    onChange={setCurrentPost}
                />

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">
                        상세 설명
                    </h2>

                    <ProductDescriptionEditor
                        initialContent={
                            currentPost.content
                                ? JSON.parse(
                                    currentPost.content,
                                )
                                : undefined
                        }
                        onChange={handleDescriptionChange}
                    />
                </section>
            </div>

            {/* 우측 - Preview */}
            <div>
                <div className="sticky top-6">
                    <ProductPreview
                        name={currentPost.thumbnail.title}
                        summary={currentPost.thumbnail.summary}
                        discount={currentPost.thumbnail.discount}
                        price={currentPost.thumbnail.price}
                        mainImageUrl={
                            currentPost.thumbnail.imageUrl
                        }
                        imageUrls={currentPost.imageUrls}
                        tags={currentPost.thumbnail.tags}
                        description={currentPost.content}
                    />
                </div>
            </div>

            {saving && (
                <div className="text-sm text-slate-500 lg:col-span-2">
                    저장 중입니다...
                </div>
            )}
        </div>
    );
}