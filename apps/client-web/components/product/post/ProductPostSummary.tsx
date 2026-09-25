"use client";

import { useState } from "react";
import type { ProductPostDetail } from "@mall/types";

import { ProductGallery } from "./ProductGallery";

interface ProductPostSummaryProps {
  post: ProductPostDetail;
}

/**
 * ProductPost thumbnail followed by the linked Products' images. Price is
 * shown per ProductVariant in the purchase panel, not on the ProductPost.
 */
export function ProductPostSummary({
  post,
}: ProductPostSummaryProps) {
  const images = [
    post.thumbnailUrl,
    ...post.products.flatMap((product) => product.imageUrls),
  ].filter((url, index, list): url is string =>
    Boolean(url) && list.indexOf(url) === index,
  );

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const selectedImage =
    images[selectedIndex];

  return (
    <section>
      {/* 선택된 이미지 */}
      <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
        {selectedImage && (
          <img
            src={selectedImage}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* 이미지 Gallery */}
      <div className="mt-4">
        <ProductGallery
          images={images}
          onSelect={setSelectedIndex}
        />
      </div>

      {/* 게시물 기본 정보 */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {post.title}
        </h1>

        {post.summary && (
          <p className="mt-2 text-sm text-slate-500">
            {post.summary}
          </p>
        )}

        {post.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
