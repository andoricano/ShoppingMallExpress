// apps/user-web/component/design/main/PageDesignWorkspace.tsx

"use client";

import type {
    HeroSectionConfig,
    PageConfig,
    PageSection,
    PromotionSectionConfig,
} from "@mall/mall-page-viewer";

import { usePageEditor } from "@/hooks/design/usePageEditor";

import AdminHeroBanner from "./herobanner/AdminHerorBanner";
import AdminPromotionSection from "./promotion/PromotionSection";
import AdminBusinessInfoFooter from "./footer/BusinessInfoFooter";
import AdminMainHeader from "./header/AdminMainHeader";

interface PageDesignWorkspaceProps {
    config: PageConfig;
    section: string;
}

export function PageDesignWorkspace({
    config,
    section,
}: PageDesignWorkspaceProps) {
    const {
        config: editingConfig,
        updateHeader,
        updateHero,
        updateSections,
        updateFooter,
        resetConfig,
    } = usePageEditor({
        initialConfig: config,
    });

    // ==========================================
    // Header
    // ==========================================

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

    // ==========================================
    // Hero
    // ==========================================

    const handleHeroChange = (
        heroes: HeroSectionConfig[],
    ) => {
        console.log(
            "[Design] Hero 변경:",
            heroes,
        );

        updateHero(() => heroes);
    };

    // ==========================================
    // Section
    // ==========================================

    const handleSectionChange = (
        updatedSection: PageSection,
    ) => {
        updateSections((sections) => {
            const nextSections =
                sections.map((section) =>
                    section.id ===
                        updatedSection.id
                        ? updatedSection
                        : section,
                );

            console.log(
                "[Design] Section 변경:",
                nextSections,
            );

            return nextSections;
        });
    };

    // ==========================================
    // Promotion
    // ==========================================

    const promotionSections =
        editingConfig.sections.filter(
            (
                section,
            ): section is PromotionSectionConfig =>
                section.type === "PROMOTION",
        );

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

            {/* Selected Editor */}
            {section === "header" && (
                <AdminMainHeader
                    config={editingConfig.header}
                    onChange={handleHeaderChange}
                />
            )}

            {section === "hero" && (
                <AdminHeroBanner
                    heroes={editingConfig.hero}
                    onChange={handleHeroChange}
                />
            )}

            {section === "promotion" &&
                promotionSections.map(
                    (promotionSection) => (
                        <AdminPromotionSection
                            key={
                                promotionSection.id
                            }
                            section={
                                promotionSection
                            }
                            onChange={
                                handleSectionChange
                            }
                        />
                    ),
                )}

            {section === "footer" && (
                <AdminBusinessInfoFooter
                    config={editingConfig.footer}
                    onChange={updateFooter}
                />
            )}
        </div>
    );
}