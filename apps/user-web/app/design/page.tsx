// apps/user-web/app/main-page/page.tsx

"use client";

import { useEffect } from "react";

import MainPagePreview from "@/component/design/main/MainPagePreview";
import DesignSidebar from "@/component/design/main/DeisgnSidebar";
import { PageDesignWorkspace } from "@/component/design/main/PageDesignWorkspace";
import { PageConfigAdminHeader } from "@/component/design/main/PageConfigAdminHeader";
import { useAdminPageConfig } from "@/hooks/design/useAdminPageConfig";

export default function MainPageConfigPage() {
  const {
    config,
    isMock,
    isDirty,

    selectedEditor,

    loadConfig,
    saveConfig,
    resetConfig,
    updateConfig,

    openEditor,
    closeEditor,

    loading,
    saving,
    error,
  } = useAdminPageConfig();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleLoad = async () => {
    const result =
      await loadConfig();

    console.log(
      "[MainPageConfig] Load:",
      result,
    );
  };

  const handleSave = async () => {
    if (
      !config ||
      isMock ||
      !isDirty
    ) {
      return;
    }

    const result =
      await saveConfig(config);

    console.log(
      "[MainPageConfig] Save:",
      result,
    );
  };

  const handleReset = () => {
    resetConfig();
  };

  if (loading && !config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        메인 페이지 설정을 불러오는 중입니다.
      </div>
    );
  }

  if (error && !config) {
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

  console.log("[MainPageConfig PAGE]", {
    isMock,
    isDirty,
  });
  return (
    <div className="min-h-screen overflow-hidden bg-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">
        <PageConfigAdminHeader
          title="메인 페이지 설정"
          description="쇼핑몰 메인 페이지의 구성과 노출 상태를 관리합니다."
          canSave={
            !isMock &&
            isDirty
          }
          isDirty={isDirty}
          menu={[
            {
              menuTitle: "Load",
              onClick:
                handleLoad,
            },
            {
              menuTitle: "Reset",
              onClick:
                handleReset,
            },
            {
              menuTitle: "Save",
              onClick:
                handleSave,
              locked:
                isMock ||
                !isDirty,
              variant:
                "primary",
            },
          ]}
        />
      </div>

      {/* Editor */}
      <div className="flex min-h-[calc(100vh-110px)]">
        {/* Sidebar */}
        <DesignSidebar
          selectedSection={
            selectedEditor ??
            undefined
          }
          onSelectSection={
            openEditor
          }
        />

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-auto p-6 md:p-8">
          {selectedEditor ===
            null ? (
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
              onChangeConfig={
                updateConfig
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}