"use client";

import { useState } from "react";
import type { Product } from "@mall/types";

import FormField from "@/component/common/field/FormField";
import CheckboxField from "@/component/common/field/CheckboxField";
import ImageUploadField from "@/component/common/field/ImageUploadField";

export type ProductEditFormProps = {
    product: Product;
    onSubmit?: (product: Product) => void;
};

export function ProductEditForm({
    product,
    onSubmit,
}: ProductEditFormProps) {
    const [name, setName] = useState(product.name);

    const [mainImageUrl, setMainImageUrl] = useState(
        product.mainImageUrl,
    );

    const [imageUrls, setImageUrls] = useState<string[]>(
        product.imageUrls,
    );

    const [price, setPrice] = useState(
        String(product.price),
    );

    const [isActive, setIsActive] = useState(
        product.isActive,
    );

    const [error, setError] = useState<string | null>(
        null,
    );

    const handleSubmit = (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError(null);

        const nextProduct: Product = {
            ...product,
            name: name.trim(),
            mainImageUrl: mainImageUrl.trim(),
            imageUrls,
            price: Number(price),
            isActive,
        };

        if (!nextProduct.name) {
            setError("상품명을 입력해주세요.");
            return;
        }

        if (nextProduct.price < 0) {
            setError("가격은 0 이상이어야 합니다.");
            return;
        }

        onSubmit?.(nextProduct);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
            <FormField
                label="Inventory ID"
                value={product.inventoryId}
                disabled
            />

            <FormField
                label="상품명"
                value={name}
                onChange={setName}
                placeholder="상품명을 입력하세요."
            />

            <ImageUploadField
                label="대표 이미지"
                imageUrl={mainImageUrl}
                onUpload={(files) => {
                    console.log("대표 이미지:", files);
                }}
            />

            <ImageUploadField
                label="추가 이미지"
                imageUrls={imageUrls}
                multiple
                onUpload={(files) => {
                    console.log("추가 이미지:", files);
                }}
            />

            <FormField
                label="가격"
                value={price}
                onChange={setPrice}
                placeholder="0"
                type="number"
                min={0}
                step={1}
            />

            <CheckboxField
                label="상품 활성화"
                checked={isActive}
                onChange={setIsActive}
            />

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
                상품 정보 저장
            </button>
        </form>
    );
}