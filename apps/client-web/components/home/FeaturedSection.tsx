import { FEATURED_PRODUCTS } from "@/mockData";
import ProductCard from "./ProductCard";

export default function FeaturedSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Featured Collection
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            가장 사랑받는 베스트 및 추천 아이템
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {FEATURED_PRODUCTS.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </section>
  );
}