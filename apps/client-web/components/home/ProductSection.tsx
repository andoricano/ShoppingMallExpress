// components/home/ProductSection.tsx

"use client";

import Link from "next/link";
import type { Product, ProductSection } from "@mall/types";
import ProductThumbnailBox from "./ProductThumbnailBox";


interface ProductSectionProps {
  section: ProductSection;
  products: Product[];
}

export default function ProductSection({
  section,
  products,
}: ProductSectionProps) {
  console.log("[ProductSection] productIds:", section.productIds);
  console.log("[ProductSection] products:", products);

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
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          {section.title}
        </h2>

        <Link
          href="/products"
          className="text-sm font-medium text-neutral-900 hover:underline"
        >
          전체보기 →
        </Link>
      </div>

      {/* GRID */}
      {section.layout === "GRID" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sectionProducts.map((product) => (
            <ProductThumbnailBox
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}

      {/* HORIZONTAL SCROLL */}
      {section.layout === "HORIZONTAL_SCROLL" && (
        <div className="flex gap-6 overflow-x-auto pb-2">
          {sectionProducts.map((product) => (
            <div
              key={product.id}
              className="w-[220px] shrink-0"
            >
              <ProductThumbnailBox product={product} />
            </div>
          ))}
        </div>
      )}

      {/* LARGE */}
      {section.layout === "LARGE" && (
        <div className="grid grid-cols-1 gap-6">
          {sectionProducts.map((product) => (
            <ProductThumbnailBox
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  );
}