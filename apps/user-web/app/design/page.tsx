// apps/user-web/app/main-page/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import MainPagePreview from "@/component/design/main/MainPagePreview";
import DesignSidebar from "@/component/design/main/DeisgnSidebar";
import { useAdminPageConfig } from "@/hooks/design/useAdminPageConfig";

export default function MainPageConfigPage() {
  const router = useRouter();

  const {
    config,
    loading,
    error,
    fetchConfig,
  } = useAdminPageConfig();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        메인 페이지 설정을 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        메인 페이지 설정이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <DesignSidebar
        onSelectSection={(section) =>
          router.push(
            `/main-page/${section.toLowerCase()}`,
          )
        }
      />

      {/* Preview */}
      <main className="min-w-0 flex-1 overflow-auto p-6 md:p-8">
        <MainPagePreview
          config={config}
        />
      </main>
    </div>
  );
}