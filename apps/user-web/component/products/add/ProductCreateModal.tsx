"use client";

import { useState } from "react";
import type { Product, Ware } from "@mall/types";

import { useAdminProductCreate } from "@/hooks/products/useAdminProductCreate";
import { useImageApi } from "@/hooks/images/useImageApi";
import {
    ProductImagesField,
    type ProductImageItem,
} from "@/component/products/edit/ProductImagesField";

import {
    ProductAddForm,
    emptyProductAddForm,
    toProductOptions,
    toProductVariants,
} from "./ProductAddForm";

interface ProductCreateModalProps {
    ware: Ware;
    onCreated: (product: Product) => void;
    onCancel: () => void;
}

/**
 * Persists a Product with its Options/Variants through the Admin server
 * boundary and returns only the stored Product to the ProductPost draft.
 */
export function ProductCreateModal({ ware, onCreated, onCancel }: ProductCreateModalProps) {
    const [form, setForm] = useState(() => emptyProductAddForm(ware.name));
    const [validationError, setValidationError] = useState<string | null>(null);
    const [images, setImages] = useState<ProductImageItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const { createProduct, saving, error } = useAdminProductCreate();
    const { uploadProductImages } = useImageApi();

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setValidationError("상품명을 입력하세요.");
            return;
        }

        const variants = toProductVariants(form);

        if (variants.some((variant) => !Number.isFinite(variant.price) || variant.price < 0)) {
            setValidationError("Variant 가격은 0 이상이어야 합니다.");
            return;
        }

        setValidationError(null);

        // Upload pending images first; on failure nothing is created.
        let imageUrls: string[];
        setUploading(true);

        try {
            imageUrls = await uploadProductImages(images);
        } catch (cause) {
            setValidationError(
                cause instanceof Error ? cause.message : "상품 이미지 업로드에 실패했습니다.",
            );
            return;
        } finally {
            setUploading(false);
        }

        try {
            const product = await createProduct({
                name: form.name.trim(),
                description: form.description.trim() || null,
                imageUrls,
                options: toProductOptions(form),
                variants: variants.length === 1
                    ? [{ ...variants[0]!, wareId: ware.id }]
                    : variants,
            });

            onCreated(product);
        } catch {
            // error is exposed by useAdminProductCreate
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl">
                <ProductAddForm
                    value={form}
                    onChange={setForm}
                    onSubmit={handleSubmit}
                    onCancel={onCancel}
                    submitting={saving || uploading}
                    error={validationError ?? error}
                    wareName={ware.name}
                    imagesField={
                        <ProductImagesField
                            value={images}
                            onChange={setImages}
                            disabled={saving || uploading}
                        />
                    }
                />
            </div>
        </div>
    );
}
