"use client";

import Link from "next/link";
import { useOrderStore } from "@/store/useOrderStore";
import { FEATURED_PRODUCTS } from "@/mockData";

export default function OrderWishlistPage() {
  const { wishlistIds, toggleWishlist, addCartItem } = useOrderStore();

  // 위시리스트 ID 기반 상품 필터링
  const wishedProducts = FEATURED_PRODUCTS.filter((product) =>
    wishlistIds.includes(product.productId)
  );

  const handleAddToCart = (product: (typeof FEATURED_PRODUCTS)[0]) => {
    // 옵션이 있는 경우 상세페이지로 이동 유도, 없을 경우 바로 담기
    if (product.options && product.options.length > 0) {
      alert("옵션 선택이 필요한 상품입니다. 상세 페이지로 이동합니다.");
      window.location.href = `/products/${product.productId}`;
      return;
    }
    addCartItem(product, null, 1);
    alert("장바구니에 담겼습니다.");
  };

  if (wishedProducts.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">위시리스트가 비어 있습니다.</h1>
        <p className="text-neutral-500 mb-8">
          마음에 드는 상품을 위시리스트에 담아보세요!
        </p>
        <Link
          href="/products"
          className="inline-block bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800"
        >
          상품 둘러보기
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold">Wishlist</h1>
        <span className="text-sm text-neutral-500">
          전체 {wishedProducts.length}개
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishedProducts.map((product) => (
          <div
            key={product.productId}
            className="group border border-neutral-200 rounded overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="aspect-square bg-neutral-100 overflow-hidden relative">
                <img
                  src={product.mainImageUrl}
                  alt={product.productName}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.productId)}
                  className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-full text-xs hover:bg-white transition-colors"
                  aria-label="위시리스트 삭제"
                >
                  ✕
                </button>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium text-neutral-900 truncate">
                  {product.productName}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                  {product.description}
                </p>
                <div className="mt-2 text-sm font-bold text-neutral-900">
                  {product.price.discountedPrice.toLocaleString()}원
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 grid grid-cols-2 gap-2">
              <Link
                href={`/products/${product.productId}`}
                className="text-center border border-neutral-300 text-xs py-2 rounded hover:bg-neutral-50"
              >
                상세보기
              </Link>
              <button
                type="button"
                onClick={() => handleAddToCart(product)}
                className="bg-black text-white text-xs py-2 rounded hover:bg-neutral-800"
              >
                담기
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}