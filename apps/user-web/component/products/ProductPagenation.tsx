"use client";

import { PaginationState } from "@/hooks/useAdminInventory";
import React from "react";

interface ProductPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  pagination,
  onPageChange,
}) => {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
      <div className="text-xs text-slate-500">
        Page <span className="font-semibold">{pagination.page}</span> of{" "}
        <span className="font-semibold">{pagination.totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 transition-colors"
        >
          이전
        </button>

        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
          (pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                pagination.page === pageNum
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {pageNum}
            </button>
          )
        )}

        <button
          type="button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
};