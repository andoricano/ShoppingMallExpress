import ProductCard from "@/components/home/ProductCard";
import ProductFilter from "@/components/products/ProductFilter";
import { FEATURED_PRODUCTS } from "@/mockData";
import { ProductCategory } from "@mall/types";

// Mock 카테고리 데이터
const MOCK_CATEGORIES: ProductCategory[] = [
  { categoryId: "cat-1", categoryName: "리빙/키친", parentId: null, depth: 1, displayOrder: 1 },
  { categoryId: "cat-2", categoryName: "패션/잡화", parentId: null, depth: 1, displayOrder: 2 },
  { categoryId: "cat-3", categoryName: "디퓨저/향수", parentId: null, depth: 1, displayOrder: 3 },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; sort?: string }>;
}) {
  const { categoryId } = await searchParams;

  // 필터링 적용 (Mock 기준)
  const filteredProducts = categoryId
    ? FEATURED_PRODUCTS.filter((p) => p.categoryIds.includes(categoryId))
    : FEATURED_PRODUCTS;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">All Products</h1>

      <ProductFilter categories={MOCK_CATEGORIES} totalCount={filteredProducts.length} />

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-500">
          해당 조건의 상품이 존재하지 않습니다.
        </div>
      )}
    </main>
  );
}