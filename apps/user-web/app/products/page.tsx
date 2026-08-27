"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminProducts } from "@/hooks/products/useAdminProduct";
import { ProductCategory, ProductFilterParams, ProductStatus } from "@mall/types";
import { ProductsHeader } from "@/component/products/ProductsHeader";
import { ProductsFilterBar } from "@/component/products/ProductsFilterBar";
import { BatchActionToolbar } from "@/component/products/BatchActionToolbar";
import { StatusBadge } from "@/component/products/StatusBadge";

export default function AdminProductPage() {
  const router = useRouter();
  
  // 1. Hook 불러오기
  const {
    productList,
    pagination,
    loading,
    error,
    fetchProductList,
    deleteProduct,
  } = useAdminProducts();

  // 2. 필터 상태 관리
  const [filters, setFilters] = useState<ProductFilterParams>({
    searchQuery: "",
    status: undefined,
    categoryId: "",
    page: 1,
    limit: 20,
  });

  // 3. 선택된 상품 ID 목록 (일괄 처리를 위함)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 카테고리 목록 (추후 API 연동 또는 상위 Props 전달)
  const [categories] = useState<ProductCategory[]>([]);

  // 4. 상품 목록 Fetch (필터 변경 시 자동 호출)
  const loadProducts = useCallback(() => {
    fetchProductList(filters);
  }, [fetchProductList, filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // --- 필터 변경 핸들러 ---
  const handleSearchChange = (searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery, page: 1 }));
  };

  const handleStatusChange = (status: ProductStatus | "") => {
    setFilters((prev) => ({
      ...prev,
      status: status === "" ? undefined : status,
      page: 1,
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFilters((prev) => ({ ...prev, categoryId, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      status: undefined,
      categoryId: "",
      page: 1,
      limit: 20,
    });
  };

  // --- 체크박스 선택 핸들러 ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(productList.map((p) => p.productId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // --- 단일 삭제 핸들러 ---
  const handleDeleteSingle = async (productId: string, productName: string) => {
    if (!window.confirm(`'${productName}' 상품을 삭제하시겠습니까?`)) return;

    try {
      await deleteProduct(productId);
      alert("상품이 삭제되었습니다.");
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    }
  };

  // --- 일괄 삭제 핸들러 ---
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.length}개 상품을 삭제하시겠습니까?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)));
      alert("선택한 상품이 삭제되었습니다.");
      setSelectedIds([]);
      loadProducts();
    } catch (err) {
      alert("일괄 삭제 처리 중 일부 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-6">
      {/* 1. Header */}
      <ProductsHeader
        totalCount={pagination.totalCount}
        onRegisterClick={() => router.push("/admin/products/new")}
      />

      {/* 2. Filter Bar */}
      <ProductsFilterBar
        searchQuery={filters.searchQuery || ""}
        status={filters.status || ""}
        categoryId={filters.categoryId || ""}
        categories={categories}
        onSearchQueryChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onCategoryChange={handleCategoryChange}
        onReset={handleResetFilters}
      />

      {/* 3. Batch Action Toolbar */}
      <BatchActionToolbar
        selectedCount={selectedIds.length}
        onOpenStatusModal={() => {
          // 추후 모달 오픈 상태 변경
          console.log("Open Status Modal", selectedIds);
        }}
        onOpenCategoryModal={() => {
          // 추후 모달 오픈 상태 변경
          console.log("Open Category Modal", selectedIds);
        }}
        onBatchDelete={handleBatchDelete}
      />

      {/* 4. Data Table Container */}
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
                    checked={
                      productList.length > 0 &&
                      selectedIds.length === productList.length
                    }
                    onChange={handleSelectAll}
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
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(product.productId)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* 상품 정보 (이미지 + 상품명 + ID) */}
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

                      {/* 카테고리 */}
                      <td className="p-4 text-xs text-slate-600">
                        {product.categoryIds?.join(", ") || "-"}
                      </td>

                      {/* 판매가 */}
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

                      {/* 진열 상태 */}
                      <td className="p-4 text-center">
                        <StatusBadge status={product.status} />
                      </td>

                      {/* 등록일 */}
                      <td className="p-4 text-center text-xs text-slate-500">
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* 관리 버튼 */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/products/${product.productId}/edit`)
                            }
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSingle(product.productId, product.productName)
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

        {/* 5. Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Page <span className="font-semibold">{pagination.page}</span> of{" "}
              <span className="font-semibold">{pagination.totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))
                }
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 transition-colors"
              >
                이전
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: pageNum }))
                    }
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
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))
                }
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}