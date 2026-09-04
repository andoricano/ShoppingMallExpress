// component/products/ProductPreview.tsx

"use client";

import { useState } from "react";
import { TiptapViewer, ProductThumbnailCard } from "@mall/tiptap";
import { ProductGallery } from "./ProductGallery";

export interface ProductPreviewProps {
    name: string;
    mainImageUrl: string;
    imageUrls: string[];
    description: string;
    price: number;
}

export function ProductPreview({
    name,
    mainImageUrl,
    imageUrls,
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
                <ProductThumbnailCard
                    imageUrl={images[selectedIndex]}
                    name={name}
                    price={price}
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