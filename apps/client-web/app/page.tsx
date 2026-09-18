// apps/client-web/app/page.tsx

"use client";

import { useEffect } from "react";

import {
  Header,
  mainPageMock,
} from "@mall/mall-page-viewer";

import MainPage from "@/components/home/MainPage";
import { useProductPost } from "@/hooks/useProductPost";
import { useClientAuthStore } from "@/store/useClientAuthStore";
import MainHeader from "@/components/mypage/header/MainHeader";
import { useProductPostCategories } from "@/hooks/category/useProductPostCategories";


export default function HomePage() {
  const {
    postList,
    loading,
    error,
    fetchPosts,
  } = useProductPost();

  const authUserId =
    useClientAuthStore(
      (state) => state.authUserId,
    );

  const signOut =
    useClientAuthStore(
      (state) => state.signOut,
    );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleNavigate = (
    path: string,
  ) => {
    window.location.href = path;
  };

  const isLoggedIn =
    Boolean(authUserId);

  return (
    <main className="min-h-screen">
      {/* {mainPageMock.header.isActive && (
        <MainHeader
          config={mainPageMock.header}
          isLoggedIn={isLoggedIn}
          onNavigate={handleNavigate}
          onLogout={signOut}
        />
      )} */}

      <MainPage
        config={mainPageMock}
        postList={postList}
        loading={loading}
        error={error}
      />
    </main>
  );
}