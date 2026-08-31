// components/home/ProductThumbnailBox.tsx

"use client";

import Link from "next/link";
import type { Product } from "@mall/types";

interface ProductThumbnailBoxProps {
  product: Product;
}

export default function ProductThumbnailBox({
  product,
}: ProductThumbnailBoxProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block"
    >
      {/* 상품 이미지 */}
      <div className="mb-3 aspect-square overflow-hidden rounded bg-neutral-100">
        <img
          src={product.mainImageUrl || "/placeholder.png"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* 상품 정보 */}
      <div>
        <h3 className="truncate text-sm font-medium text-neutral-900">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
            {product.description}
          </p>
        )}

        <p className="mt-2 text-sm font-bold text-neutral-900">
          {product.price.toLocaleString()}원
        </p>
      </div>
    </Link>
  );
}