// apps/user-web/app/main-page/page.tsx

"use client";

import { useEffect } from "react";

import MainPagePreview from "@/component/design/main/MainPagePreview";
import DesignSidebar from "@/component/design/main/DeisgnSidebar";
import { useAdminPageConfig } from "@/hooks/design/useAdminPageConfig";

export default function MainPageConfigPage() {
  const {
    config,
    selectedEditor,
    fetchConfig,
    openEditor,
    closeEditor,
    loading,
    error,
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

  const isPreview =
    selectedEditor === null;

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <DesignSidebar
        selectedSection={
          selectedEditor ?? undefined
        }
        onSelectSection={openEditor}
      />

      {/* Content */}
      <main className="min-w-0 flex-1 overflow-auto p-6 md:p-8">
        {isPreview && (
          <MainPagePreview
            config={config}
          />
        )}

        {selectedEditor && (
          <div className="rounded-xl border-2 border-slate-600 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {selectedEditor}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  선택한 영역을 편집합니다.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>

            {/* Editor 연결 예정 */}
          </div>
        )}
      </main>
    </div>
  );
}