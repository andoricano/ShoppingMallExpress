// apps/user-web/app/products/page.tsx

"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { AdminMenuItem } from "@/component/common/AdminMenu";
import { useAdminPostProducts } from "@/hooks/products/useAdminPostProducts";
import { ProductPostSearchToolbar } from "@/component/products/ProductSearchToolbar";
import { AdminProductPostCard } from "@/component/products/list/AdminProductThumbnailBox";

export default function AdminProductPage() {
  const router = useRouter();

  const {
    postList,
    loading,
    error,
    fetchPosts,
    deletePost,
  } = useAdminPostProducts();

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const menu: AdminMenuItem[] = [
    {
      menuTitle: "상품 게시물 등록",
      onClick: () => router.push("/products/add"),
    },
  ];

  const handleSearch = (params: {
    search?: string;
    isPublished?: boolean;
  }) => {
    fetchPosts(params);
  };

  const handleReset = () => {
    fetchPosts();
  };

  const handleEdit = (postId: string) => {
    router.push(`/products/edit/${postId}`);
  };

  const handleDelete = async (postId: string) => {
    const confirmed = window.confirm(
      "상품 게시물을 삭제하시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    await deletePost(postId);
    await fetchPosts();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ProductAdminHeader menu={menu} />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <span className="font-semibold">
              ⚠️ 오류 발생:
            </span>
            <span>{error}</span>
          </div>
        )}

        <ProductPostSearchToolbar
          onSearch={handleSearch}
          onReset={handleReset}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-sm text-slate-400">
              상품 게시물 목록을 불러오는 중입니다...
            </div>
          ) : postList.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-slate-400">
              등록된 상품 게시물이 없습니다.
            </div>
          ) : (
            postList.map((post) => (
              <AdminProductPostCard
                key={post.id}
                post={post}
                onEdit={() =>
                  handleEdit(post.id)
                }
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}