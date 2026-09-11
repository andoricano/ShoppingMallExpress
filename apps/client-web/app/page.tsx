// apps/client-web/app/page.tsx

"use client";

import { useEffect } from "react";

import { useProductPost } from "@/hooks/useProductPost";
import MainPageTemplate from "@/components/home/MainPageTemplate";

export default function HomePage() {
  const {
    products,
    loading,
    error,
    fetchPosts,
  } = useProductPost();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <main className="min-h-screen">
      <MainPageTemplate
        products={products}
        loading={loading}
        error={error}
      />
    </main>
  );
}