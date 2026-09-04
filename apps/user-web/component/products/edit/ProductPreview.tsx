// component/products/ProductPreview.tsx

"use client";

import { useState } from "react";
import { TiptapViewer, ProductPostCard } from "@mall/tiptap";
import { ProductGallery } from "./ProductGallery";

export interface ProductPreviewProps {
    name: string;
    summary?: string;
    discount: number;
    price: number;

    mainImageUrl: string;
    imageUrls: string[];
    tags: string[];
    description: string;
}

export function ProductPreview({
    name,
    summary,
    discount,
    mainImageUrl,
    imageUrls,
    tags,
    description,
    price,
}: ProductPreviewProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const images = [
        mainImageUrl,
        ...imageUrls,
    ].filter(Boolean);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* 상품 정보 */}
            <div className="p-4">
                <ProductPostCard
                    imageUrl={images[selectedIndex]}
                    title={name}
                    summary={summary}
                    discount={discount}
                    price={price}
                    tags={tags}
                />
            </div>

            <div className="space-y-5 p-6">
                {/* 상품 이미지 */}
                {images.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-slate-700">
                            상품 이미지
                        </h3>

                        <ProductGallery
                            images={images}
                            onSelect={setSelectedIndex}
                        />
                    </div>
                )}

                {/* 상세 설명 */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                        상품 상세 설명
                    </h3>

                    <div className="min-h-[300px] rounded-lg border border-slate-200 bg-white p-4">
                        {description ? (
                            <TiptapViewer content={description} />
                        ) : (
                            <p className="text-sm text-slate-400">
                                상품 상세 설명이 없습니다.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}