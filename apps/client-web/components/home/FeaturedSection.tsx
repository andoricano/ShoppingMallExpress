"use client";

import Link from "next/link";
import { useProduct } from "@/hooks/useProduct";

export default function FeaturedSection() {
  const { productList, loading, error } = useProduct();

  // 진열(DISPLAY) 상태인 상품 중 메인 화면에 상위 4개만 표시
  const featuredProducts = productList
    ?.filter((product) => product.status === "DISPLAY")
    .slice(0, 4);

  if (loading) {
    return (
      <section className="py-20 max-w-7xl mx-auto px-4 text-center text-neutral-500">
        상품을 불러오는 중입니다...
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 max-w-7xl mx-auto px-4 text-center text-neutral-400">
        {error}
      </section>
    );
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return (
      <section className="py-20 max-w-7xl mx-auto px-4 text-center text-neutral-500">
        등록된 추천 상품이 없습니다.
      </section>
    );
  }

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Featured Products
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            지금 가장 사랑받는 컬렉션을 만나보세요.
          </p>
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-neutral-900 hover:underline"
        >
          전체보기 →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredProducts.map((product) => {
          // 💡 객체 구조(product.price)와 평탄화 구조(product.discountedPrice) 모두 안전하게 대응
          const discountedPrice =
            product.price?.discountedPrice ?? (product as any).discountedPrice ?? 0;
          const basePrice =
            product.price?.basePrice ?? (product as any).basePrice ?? 0;

          const hasDiscount = discountedPrice < basePrice;

          return (
            <Link
              key={product.productId}
              href={`/products/${product.productId}`}
              className="group"
            >
              <div className="aspect-square bg-neutral-100 overflow-hidden rounded mb-3">
                <img
                  src={product.mainImageUrl || "/placeholder.png"}
                  alt={product.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-sm font-medium text-neutral-900 truncate">
                {product.productName}
              </h3>
              <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                {product.description}
              </p>

              {/* 가격 표시 */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900">
                  {discountedPrice.toLocaleString()}원
                </span>
                {hasDiscount && (
                  <span className="text-xs text-neutral-400 line-through">
                    {basePrice.toLocaleString()}원
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}