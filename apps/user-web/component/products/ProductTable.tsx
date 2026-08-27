"use client";

import React from "react";
import { StatusBadge } from "./StatusBadge";
import { Product } from "@mall/types";
import { PaginationState } from "@/hooks/useAdminInventory";
import { ProductPagination } from "./ProductPagenation";

interface ProductTableProps {
  productList: Product[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne: (productId: string) => void;
  onEdit: (productId: string) => void;
  onDelete: (productId: string, productName: string) => void;
  onPageChange: (page: number) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  productList,
  selectedIds,
  loading,
  error,
  pagination,
  onSelectAll,
  onSelectOne,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  const isAllSelected =
    productList.length > 0 && selectedIds.length === productList.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {error && (
        <div className="p-4 bg-rose-50 border-b border-rose-100 text-xs font-semibold text-rose-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-4">상품 정보</th>
              <th className="p-4">카테고리 ID</th>
              <th className="p-4 text-right">판매가</th>
              <th className="p-4 text-center">진열 상태</th>
              <th className="p-4 text-center">등록일</th>
              <th className="p-4 text-right">관리</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading && productList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  상품 목록을 불러오는 중입니다...
                </td>
              </tr>
            ) : productList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  조회된 상품이 없습니다.
                </td>
              </tr>
            ) : (
              productList.map((product) => {
                const isSelected = selectedIds.includes(product.productId);
                return (
                  <tr
                    key={product.productId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectOne(product.productId)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {product.mainImageUrl ? (
                            <img
                              src={product.mainImageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 line-clamp-1">
                            {product.productName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            ID: {product.productId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-xs text-slate-600">
                      {product.categoryIds?.join(", ") || "-"}
                    </td>

                    <td className="p-4 text-right">
                      <div className="font-semibold text-slate-900">
                        {product.discountedPrice
                          ? product.discountedPrice.toLocaleString()
                          : product.basePrice?.toLocaleString()}
                        원
                      </div>
                      {product.discountedPrice && (
                        <div className="text-xs text-slate-400 line-through">
                          {product.basePrice?.toLocaleString()}원
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge status={product.status} />
                    </td>

                    <td className="p-4 text-center text-xs text-slate-500">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(product.productId)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onDelete(product.productId, product.productName)
                          }
                          className="px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ProductPagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
};