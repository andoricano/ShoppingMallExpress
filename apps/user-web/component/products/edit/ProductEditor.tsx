// component/products/edit/ProductEditor.tsx

'use client';

import type { JSONContent } from '@tiptap/core';
import type { Product } from '@mall/types';

import { ProductEditHeader } from './ProductEditHeader';
import { ProductEditForm } from './ProductEditForm';
import { ProductPreview } from './ProductPreview';

import { PostEditor } from '../post/editor/PostEditor';
import { useProductEditor } from './useProductEditor';

export type ProductEditorProps = {
    product: Product;
    saving?: boolean;
    onUpdate?: (
        data: Partial<Product>,
    ) => Promise<Product | undefined>;
};

export function ProductEditor({
    product,
    saving = false,
    onUpdate,
}: ProductEditorProps) {
    const {
        form,
        descriptionContent,
        updateProduct,
        updateDescription,
    } = useProductEditor(product);

    if (!form) {
        return null;
    }

    const handleSave = async () => {
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
        console.log(
            '[ProductEditor] 삭제',
            form.id,
        );
    };

    const handleToggleActive = async () => {
        const nextIsActive = !form.isActive;

        updateProduct({
            ...form,
            isActive: nextIsActive,
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-[1400px] space-y-6 p-6 md:p-8">
                {/* Header */}
                <ProductEditHeader
                    productName={form.name}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onToggleActive={
                        handleToggleActive
                    }
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Editor */}
                    <div className="space-y-6">
                        {/* 기본 상품 정보 */}
                        <ProductEditForm
                            product={form}
                            onSubmit={
                                handleProductChange
                            }
                        />

                        {/* 상품 상세 설명 */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                상품 상세 설명
                            </h2>

                            <PostEditor
                                initialContent={
                                    descriptionContent
                                }
                                onSave={
                                    handleDescriptionChange
                                }
                            />
                        </section>
                    </div>

                    {/* Preview */}
                    <div>
                        <div className="sticky top-6">
                            <ProductPreview
                                product={form}
                            />
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