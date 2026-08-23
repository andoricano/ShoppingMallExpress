import Link from "next/link";
import { Product } from "@mall/types";

export default function ProductCard({ product }: { product: Product }) {
  const { basePrice, discountedPrice, discountValue, discountType } = product.price;
  const hasDiscount = basePrice > discountedPrice;

  return (
    <div className="group relative">
      <div className="aspect-square w-full overflow-hidden bg-neutral-100 mb-4 relative">
        <img
          src={product.mainImageUrl}
          alt={product.productName}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        {/* 할인율 / 신상품 태그 */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold px-2 py-1">
            {discountType === "PERCENTAGE" ? `${discountValue}% OFF` : "SALE"}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-neutral-900 mb-1">
          <Link href={`/products/${product.productId}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {product.productName}
          </Link>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-neutral-900">
            {discountedPrice.toLocaleString()}원
          </span>
          {hasDiscount && (
            <span className="text-xs text-neutral-400 line-through">
              {basePrice.toLocaleString()}원
            </span>
          )}
        </div>
      </div>
    </div>
  );
}