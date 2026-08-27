"use client";

import React from "react";

interface ProductsHeaderProps {
  totalCount: number;
  onRegisterClick: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  totalCount,
  onRegisterClick,
}) => {
  return (
    <div className="flex items-center justify-between pb-5 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">상품 관리</h1>
        <p className="text-xs text-slate-500 mt-1">
          전체 <span className="font-semibold text-blue-600">{totalCount}</span>개의 상품이 등록되어 있습니다.
        </p>
      </div>
      <button
        type="button"
        onClick={onRegisterClick}
        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
      >
        <span>+</span> 신규 상품 등록
      </button>
    </div>
  );
};