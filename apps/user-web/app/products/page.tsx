"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminProducts } from "@/hooks/products/useAdminProduct";
import { ProductCategory, ProductFilterParams } from "@mall/types";
import { ProductsHeader } from "@/component/products/ProductsHeader";
import { ProductsFilterBar } from "@/component/products/ProductsFilterBar";
import { BatchActionToolbar } from "@/component/products/BatchActionToolbar";
import { ProductTable } from "@/component/products/ProductTable";

export default function AdminProductPage() {
  const router = useRouter();

  const {
    productList,
    pagination,
    loading,
    error,
    fetchProductList,
    deleteProduct,
  } = useAdminProducts();

  const [filters, setFilters] = useState<ProductFilterParams>({
    searchQuery: "",
    status: undefined,
    categoryId: "",
    page: 1,
    limit: 20,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categories] = useState<ProductCategory[]>([]);

  const loadProducts = useCallback(() => {
    fetchProductList(filters);
  }, [fetchProductList, filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
      <ProductsHeader
        totalCount={pagination.totalCount}
        onRegisterClick={() => router.push("/admin/products/new")}
      />

      <ProductsFilterBar
        searchQuery={filters.searchQuery || ""}
        status={filters.status || ""}
        categoryId={filters.categoryId || ""}
        categories={categories}
        onSearchQueryChange={(searchQuery) => setFilters((prev) => ({ ...prev, searchQuery, page: 1 }))}
        onStatusChange={(status) => setFilters((prev) => ({ ...prev, status: status === "" ? undefined : status, page: 1 }))}
        onCategoryChange={(categoryId) => setFilters((prev) => ({ ...prev, categoryId, page: 1 }))}
        onReset={() => setFilters({ searchQuery: "", status: undefined, categoryId: "", page: 1, limit: 20 })}
      />

      <BatchActionToolbar
        selectedCount={selectedIds.length}
        onOpenStatusModal={() => console.log("Open Status Modal", selectedIds)}
        onOpenCategoryModal={() => console.log("Open Category Modal", selectedIds)}
        onBatchDelete={handleBatchDelete}
      />

      {/* 4. 분리된 Data Table */}
      <ProductTable
        productList={productList}
        selectedIds={selectedIds}
        loading={loading}
        error={error}
        pagination={pagination}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onEdit={(id) => router.push(`/admin/products/${id}/edit`)}
        onDelete={handleDeleteSingle}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </div>
  );
}