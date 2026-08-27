"use client";

import { ProductCategory, ProductStatus } from "@mall/types";
import React from "react";

interface ProductsFilterBarProps {
  searchQuery: string;
  status: ProductStatus | "";
  categoryId: string;
  categories: ProductCategory[];
  onSearchQueryChange: (query: string) => void;
  onStatusChange: (status: ProductStatus | "") => void;
  onCategoryChange: (categoryId: string) => void;
  onReset: () => void;
}

export const ProductsFilterBar: React.FC<ProductsFilterBarProps> = ({
  searchQuery,
  status,
  categoryId,
  categories,
  onSearchQueryChange,
  onStatusChange,
  onCategoryChange,
  onReset,
}) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* 검색어 입력 */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">검색어</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="상품명 또는 키워드 입력"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>

        {/* 카테고리 필터 */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">카테고리</label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="">전체 카테고리</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* 진열 상태 필터 */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">진열 상태</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ProductStatus | "")}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="">전체 상태</option>
            <option value="DISPLAY">진열중</option>
            <option value="HIDDEN">숨김</option>
            <option value="SOLD_OUT">품절</option>
            <option value="DELETED">삭제됨</option>
          </select>
        </div>

        {/* 초기화 버튼 */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="w-full px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            필터 초기화
          </button>
        </div>
      </div>
    </div>
  );
};