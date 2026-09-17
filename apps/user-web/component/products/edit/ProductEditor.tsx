// component/products/post/ProductPostEditor.tsx

"use client";

import type { JSONContent } from "@tiptap/core";
import type { ProductPost } from "@mall/types";

import { ProductDescriptionEditor } from "../post/editor/PostEditor";
import type { PendingImage } from "../post/editor/useEditSection";

export interface ProductPostEditorProps {
    post: ProductPost;
    onChange: (post: ProductPost) => void;
    onImagesChange: (
        images: PendingImage[],
    ) => void;
    saving?: boolean;
}

export function ProductPostEditor({
    post,
    onChange,
    onImagesChange,
    saving = false,
}: ProductPostEditorProps) {
    const handleDescriptionChange = (
        content: JSONContent,
    ) => {
        onChange({
            ...post,
            content: JSON.stringify(content),
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
                상세 설명
            </h2>

            <ProductDescriptionEditor
                initialContent={
                    post.content
                        ? JSON.parse(post.content)
                        : undefined
                }
                onChange={handleDescriptionChange}
                onImagesChange={
                    onImagesChange
                }
            />

            {saving && (
                <div className="mt-4 text-sm text-slate-500">
                    저장 중입니다...
                </div>
            )}
        </section>
    );
}