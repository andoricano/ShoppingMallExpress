// apps/user-web/app/main-page/page.tsx

"use client";

import { useEffect } from "react";

import MainPagePreview from "@/component/design/main/MainPagePreview";
import DesignSidebar from "@/component/design/main/DeisgnSidebar";
import { PageDesignWorkspace } from "@/component/design/main/PageDesignWorkspace";
import { useAdminPageConfig } from "@/hooks/design/useAdminPageConfig";

export default function MainPageConfigPage() {
  const {
    config,
    selectedEditor,
    fetchConfig,
    saveConfig,
    openEditor,
    closeEditor,
    loading,
    saving,
    error,
  } = useAdminPageConfig();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleLoad = async () => {
    const result = await fetchConfig();

    console.log(
      "[MainPageConfig] Load:",
      result,
    );
  };

  const handleSave = async () => {
    if (!config) {
      return;
    }

    const result =
      await saveConfig(config);

    console.log(
      "[MainPageConfig] Save:",
      result,
    );
  };

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
        selectedSection={
          selectedEditor ?? undefined
        }
        onSelectSection={openEditor}
      />

      {/* Content */}
      <main className="min-w-0 flex-1 overflow-auto p-6 md:p-8">
        {/* Config Test */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoad}
            className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Load
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>
        </div>

        {selectedEditor === null ? (
          <MainPagePreview
            config={config}
          />
        ) : (
          <PageDesignWorkspace
            config={config}
            section={
              selectedEditor
            }
            onClose={
              closeEditor
            }
          />
        )}
      </main>
    </div>
  );
}