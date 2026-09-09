// apps/user-web/app/main-page/page.tsx

"use client";

import { useEffect } from "react";

import { PageDesignWorkspace } from "@/component/design/main/PageDesignWorkspace";
import { useAdminPageConfig } from "@/hooks/design/useAdminPageConfig";

export default function MainPageConfigPage() {
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
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <PageDesignWorkspace
        config={config}
      />
    </div>
  );
}