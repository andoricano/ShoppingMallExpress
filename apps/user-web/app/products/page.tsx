"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { useAdminProducts } from "@/hooks/products/useAdminProduct";
import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { AdminMenuItem } from "@/component/common/AdminMenu";
import { ProductSearchToolbar } from "@/component/products/ProductSearchToolbar";
import { AdminProductThumbnailBox } from "@/component/products/list/AdminProductThumbnailBox";

export default function AdminProductPage() {
  const router = useRouter();

  const {
    productList,
    loading,
    error,
    fetchProducts,
    toggleProductStatus,
    deleteProduct,
  } = useAdminProducts();

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const menu: AdminMenuItem[] = [
    {
      menuTitle: "상품 목록",
      onClick: () => router.push("/products"),
    },
    {
      menuTitle: "상품 등록",
      onClick: () => router.push("/products/add"),
    },
    {
      menuTitle: "비활성화 목록",
      onClick: () => router.push("/products/inactive"),
    },
  ];

  const handleSearch = (params: {
    search?: string;
    isActive?: boolean;
  }) => {
    fetchProducts(params);
  };

  const handleReset = () => {
    fetchProducts();
  };

  const handleEdit = (productId: string) => {
    router.push(`/admin/products/${productId}`);
  };

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm(
      "비활성화된 상품을 삭제하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    await deleteProduct(productId);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <ProductAdminHeader menu={menu} />

        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="font-semibold">
              ⚠️ 오류 발생:
            </span>
            <span>{error}</span>
          </div>
        )}

        <ProductSearchToolbar
          onSearch={handleSearch}
          onReset={handleReset}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-sm text-slate-400">
              상품 목록을 불러오는 중입니다...
            </div>
          ) : productList.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-slate-400">
              등록된 상품이 없습니다.
            </div>
          ) : (
            productList.map((product) => (
              <AdminProductThumbnailBox
                key={product.id}
                product={product}
                onEdit={() => handleEdit(product.id)}
                onToggleStatus={toggleProductStatus}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}