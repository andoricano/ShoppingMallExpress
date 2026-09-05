"use client";

import { useState } from "react";
import type { ProductPost } from "@mall/types";

import { ProductGallery } from "./ProductGallery";

interface ProductPostSummaryProps {
  post: ProductPost;
}

export function ProductPostSummary({
  post,
}: ProductPostSummaryProps) {
  const images = [
    post.thumbnail.imageUrl,
    ...post.imageUrls,
  ].filter(Boolean);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const selectedImage =
    images[selectedIndex];

  return (
    <section>
      {/* 선택된 게시물 이미지 */}
      <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
        {selectedImage && (
          <img
            src={selectedImage}
            alt={post.thumbnail.title}
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

        {post.thumbnail.summary && (
          <p className="mt-2 text-sm text-slate-500">
            {post.thumbnail.summary}
          </p>
        )}

        {/* 가격 */}
        <div className="mt-4">
          {post.thumbnail.discount > 0 ? (
            <>
              <p className="text-sm text-slate-400 line-through">
                {post.thumbnail.price.toLocaleString()}원
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {post.thumbnail.discount.toLocaleString()}원
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-900">
              {post.thumbnail.price.toLocaleString()}원
            </p>
          )}
        </div>

        {/* 태그 */}
        {post.thumbnail.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.thumbnail.tags.map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                >
                  #{tag}
                </span>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}