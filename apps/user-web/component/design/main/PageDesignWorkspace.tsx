// apps/user-web/component/design/main/PageDesignWorkspace.tsx

"use client";

import React from "react";

import type {
    PageConfig,
} from "@mall/mall-page-viewer";

import { usePageEditor } from "@/hooks/design/usePageEditor";

interface PageDesignWorkspaceProps {
    config: PageConfig;
    onChange?: (
        config: PageConfig,
    ) => void;
}

export function PageDesignWorkspace({
    config,
    onChange,
}: PageDesignWorkspaceProps) {
    const {
        config: editingConfig,

        updateConfig,
        updateHeader,
        updateHero,
        updateSections,
        updateFooter,

        replaceConfig,
        resetConfig,
    } = usePageEditor({
        initialConfig: config,
    });

    React.useEffect(() => {
        onChange?.(editingConfig);
    }, [editingConfig, onChange]);

    return (
        <div className="space-y-6">
            {/* ==========================================
                Workspace Header
            ========================================== */}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        Page Design
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        메인 페이지 구성을 관리합니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={resetConfig}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                    초기화
                </button>
            </div>

            {/* ==========================================
                Editing Area
            ========================================== */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                {/* Editor */}
                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Page Configuration
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                            각 영역의 설정을 수정할 수 있습니다.
                        </p>
                    </div>

                    {/* TODO:
                        AdminHeader
                        AdminHeroBanner
                        AdminProductSection
                        AdminPromotionSection
                        AdminBusinessInfoFooter
                    */}

                    <div className="rounded-lg bg-slate-50 p-4">
                        <p className="mb-3 text-xs font-semibold text-slate-500">
                            Editing Config
                        </p>

                        <pre className="max-h-[700px] overflow-auto text-xs leading-5 text-slate-600">
                            {JSON.stringify(
                                editingConfig,
                                null,
                                2,
                            )}
                        </pre>
                    </div>
                </section>

                {/* Preview */}
                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Preview
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                            수정된 Page Config를 미리봅니다.
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                            Preview 영역
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}