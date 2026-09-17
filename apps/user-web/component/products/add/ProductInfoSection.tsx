"use client";

import type { Product, ProductPost } from "@mall/types";

import { ProductsTable } from "../add/ProductsTable";
import { ProductPostInfoForm } from "../edit/ProductPostInfoForm";

interface ProductInfoSectionProps {
    post: ProductPost;
    products: Product[];

    onChange: (post: ProductPost) => void;

    onThumbnailSelect: (file: File) => void;

    onEditProduct: (product: Product) => void;
    onRemoveProduct: (productId: string) => void;
    onMoveProduct: (
        fromIndex: number,
        toIndex: number,
    ) => void;
}

export function ProductInfoSection({
    post,
    products,
    onChange,
    onThumbnailSelect,
    onEditProduct,
    onRemoveProduct,
    onMoveProduct,
}: ProductInfoSectionProps) {
    return (
        <section className="space-y-6">
            {/* 게시물 정보 */}
            <ProductPostInfoForm
                post={post}
                onChange={onChange}
                onThumbnailSelect={
                    onThumbnailSelect
                }
            />

            {/* Product 목록 */}
            <ProductsTable
                products={products}
                onEdit={onEditProduct}
                onRemove={onRemoveProduct}
                onMove={onMoveProduct}
            />
        </section>
    );
}