// apps/user-web/component/design/main/PageDesignWorkspace.tsx

"use client";

import type {
    HeroSectionConfig,
    PageConfig,
} from "@mall/mall-page-viewer";

import { usePageEditor } from "@/hooks/design/usePageEditor";
import AdminHeroBanner from "./herobanner/AdminHerorBanner";
import AdminMainHeader from "./header/Header";


interface PageDesignWorkspaceProps {
    config: PageConfig;
}

export function PageDesignWorkspace({
    config,
}: PageDesignWorkspaceProps) {
    const {
        config: editingConfig,
        updateHeader,
        updateHero,
        updateSections,
        updateFooter,
        replaceConfig,
        resetConfig,
    } = usePageEditor({
        initialConfig: config,
    });

    const handleHeaderChange = (
        updater: (
            header: PageConfig["header"],
        ) => PageConfig["header"],
    ) => {
        updateHeader((header) => {
            const nextHeader = updater(header);

            console.log(
                "[Design] Header 변경:",
                nextHeader,
            );

            return nextHeader;
        });
    };

    const handleHeroChange = (
        heroes: HeroSectionConfig[],
    ) => {
        console.log(
            "[Design] Hero 변경:",
            heroes,
        );

        updateHero(() => heroes);
    };

    return (
        <div className="space-y-6">
            {/* Workspace Header */}
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

            {/* Editor */}
            <div className="space-y-6">
                <AdminMainHeader
                    config={editingConfig.header}
                    onChange={handleHeaderChange}
                />

                <AdminHeroBanner
                    heroes={editingConfig.hero}
                    onChange={handleHeroChange}
                />
            </div>
        </div>
    );
}