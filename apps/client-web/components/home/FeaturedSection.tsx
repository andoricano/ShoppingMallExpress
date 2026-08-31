// components/home/ProductSection.tsx

"use client";

import Link from "next/link";
import type { Product, ProductSection } from "@mall/types";

interface FeaturedSectionProps {
  section: ProductSection;
  products: Product[];
}

export default function FeaturedSection({
  section,
  products,
}: FeaturedSectionProps) {
  const sectionProducts = section.productIds
    .map((productId) =>
      products.find((product) => product.id === productId)
    )
    .filter((product): product is Product => Boolean(product))
    .filter((product) => product.isActive);

  if (sectionProducts.length === 0) {
    return (
      <section className="py-20 max-w-7xl mx-auto px-4 text-center text-neutral-500">
        등록된 상품이 없습니다.
      </section>
    );
  }

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            {section.title}
          </h2>
        </div>

        <Link
          href="/products"
          className="text-sm font-medium text-neutral-900 hover:underline"
        >
          전체보기 →
        </Link>
      </div>

      {/* Product Layout */}
      {section.layout === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectionProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="aspect-square bg-neutral-100 overflow-hidden rounded mb-3">
                <img
                  src={product.mainImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <h3 className="text-sm font-medium text-neutral-900 truncate">
                {product.name}
              </h3>

              <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                {product.description}
              </p>

              <p className="mt-2 text-sm font-bold text-neutral-900">
                {product.price.toLocaleString()}원
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Horizontal Scroll */}
      {section.layout === "HORIZONTAL_SCROLL" && (
        <div className="flex gap-6 overflow-x-auto pb-2">
          {sectionProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group w-[220px] shrink-0"
            >
              <div className="aspect-square bg-neutral-100 overflow-hidden rounded mb-3">
                <img
                  src={product.mainImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <h3 className="text-sm font-medium text-neutral-900 truncate">
                {product.name}
              </h3>

              <p className="mt-2 text-sm font-bold text-neutral-900">
                {product.price.toLocaleString()}원
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Large */}
      {section.layout === "LARGE" && (
        <div className="grid grid-cols-1 gap-6">
          {sectionProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="relative aspect-[16/7] overflow-hidden rounded bg-neutral-100">
                <img
                  src={product.mainImageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 flex items-end bg-black/20 p-8">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-sm">
                      {product.price.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}