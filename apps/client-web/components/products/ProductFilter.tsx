"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ProductCategory, ProductSortOption } from "@mall/types";

interface ProductFilterProps {
  categories: ProductCategory[];
  totalCount: number;
}

const SORT_OPTIONS: { label: string; value: ProductSortOption }[] = [
  { label: "추천순", value: "RECOMMENDED" },
  { label: "신상품순", value: "NEWEST" },
  { label: "낮은 가격순", value: "PRICE_ASC" },
  { label: "높은 가격순", value: "PRICE_DESC" },
];

export default function ProductFilter({ categories, totalCount }: ProductFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("categoryId") || "";
  const currentSort = (searchParams.get("sort") as ProductSortOption) || "RECOMMENDED";

  const updateQueryParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="border-b border-neutral-200 pb-6 mb-8">
      {/* 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        <button
          onClick={() => updateQueryParams("categoryId", "")}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
            !currentCategory
              ? "bg-black text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.categoryId}
            onClick={() => updateQueryParams("categoryId", cat.categoryId)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
              currentCategory === cat.categoryId
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {cat.categoryName}
          </button>
        ))}
      </div>

      {/* 개수 및 정렬 드롭다운 */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-neutral-500">
          총 <strong className="text-neutral-900">{totalCount}</strong>개의 상품
        </span>

        <select
          value={currentSort}
          onChange={(e) => updateQueryParams("sort", e.target.value)}
          className="border border-neutral-300 rounded px-3 py-1.5 text-neutral-700 focus:outline-none focus:border-black"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}