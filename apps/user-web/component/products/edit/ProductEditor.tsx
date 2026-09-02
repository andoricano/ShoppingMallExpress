// component/products/edit/ProductEditor.tsx

"use client";

import type { JSONContent } from "@tiptap/core";
import type { Product } from "@mall/types";

import { ProductEditHeader } from "./ProductEditHeader";
import { ProductEditForm } from "./ProductEditForm";
import { ProductPreview } from "./ProductPreview";

import { useProductEditor } from "./useProductEditor";
import { ProductDescriptionEditor } from "../post/editor/PostEditor";

export type ProductEditorMode = "create" | "edit";

export type ProductEditorProps = {
    mode: ProductEditorMode;
    product?: Product | null;

    saving?: boolean;

    onCreate?: (
        data: Partial<Product>,
    ) => Promise<Product | undefined>;

    onUpdate?: (
        data: Partial<Product>,
    ) => Promise<Product | undefined>;
};

export function ProductEditor({
    mode,
    product = null,
    saving = false,
    onCreate,
    onUpdate,
}: ProductEditorProps) {
    const {
        form,
        descriptionContent,
        updateProduct,
        updateDescription,
    } = useProductEditor({
        mode,
        product,
    });

    const handleSave = async () => {
        if (mode === "create") {
            if (!onCreate) {
                return;
            }

            await onCreate({
                ...form,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined,
            });

            return;
        }

        if (!onUpdate) {
            return;
        }

        await onUpdate({
            ...form,
            description: form.description,
        });
    };

    const handleProductChange = (
        updatedProduct: Product,
    ) => {
        updateProduct(updatedProduct);
    };

    const handleDescriptionChange = (
        content: JSONContent,
    ) => {
        updateDescription(content);
    };

    const handleDelete = () => {
        if (mode !== "edit") {
            return;
        }

        console.log(
            "[ProductEditor] 삭제",
            form.id,
        );
    };

    const handleToggleActive = () => {
        if (mode !== "edit") {
            return;
        }

        updateProduct({
            ...form,
            isActive: !form.isActive,
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-[1400px] space-y-6 p-6 md:p-8">
                <ProductEditHeader
                    productName={form.name}
                    mode={mode}
                    onSave={handleSave}
                    onDelete={
                        mode === "edit"
                            ? handleDelete
                            : undefined
                    }
                    onToggleActive={
                        mode === "edit"
                            ? handleToggleActive
                            : undefined
                    }
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Editor */}
                    <div className="space-y-6">
                        <ProductEditForm
                            product={form}
                            onSubmit={handleProductChange}
                        />

                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                상품 상세 설명
                            </h2>

                            <ProductDescriptionEditor
                                initialContent={descriptionContent}
                                onChange={handleDescriptionChange}
                            />
                        </section>
                    </div>

                    {/* Preview */}
                    <div>
                        <div className="sticky top-6">
                            <ProductPreview product={form} />
                        </div>
                    </div>
                </div>

                {saving && (
                    <div className="text-sm text-slate-500">
                        저장 중입니다...
                    </div>
                )}
            </div>
        </div>
    );
}