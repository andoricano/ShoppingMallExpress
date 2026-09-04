// components/products/post/ProductSummary.tsx

"use client";

import { useState } from "react";
import type { Product } from "@mall/types";
import { ProductGallery } from "./ProductGallery";


interface ProductSummaryProps {
  product: Product;
}

export function ProductSummary({
  product,
}: ProductSummaryProps) {
  const images = [
    product.mainImageUrl,
    ...product.imageUrls,
  ].filter(Boolean);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = images[selectedIndex];

  return (
    <section>
      {/* 선택된 상품 이미지 */}
      <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
        {selectedImage && (
          <img
            src={selectedImage}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* 상품 이미지 Gallery */}
      <div className="mt-4">
        <ProductGallery
          images={images}
          onSelect={setSelectedIndex}
        />
      </div>

      {/* 상품 기본 정보 */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {product.name}
        </h1>

        <p className="mt-3 text-xl font-bold text-slate-900">
          {product.price.toLocaleString()}원
        </p>
      </div>
    </section>
  );
}