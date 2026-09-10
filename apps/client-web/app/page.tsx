// apps/client-web/app/page.tsx

"use client";

import {
  MallTemplate,
  mainPageMock,
} from "@mall/mall-page-viewer";

export default function HomePage() {
  const handleNavigate = (
    path: string,
  ) => {
    window.location.href = path;
  };

  return (
    <main className="min-h-screen">
      <MallTemplate
        config={mainPageMock}
        isLoggedIn={false}
        cartItemCount={0}
        wishlistItemCount={0}
        onNavigate={handleNavigate}
      />
    </main>
  );
}