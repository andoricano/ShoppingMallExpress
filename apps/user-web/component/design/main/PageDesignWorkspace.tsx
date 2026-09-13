// apps/user-web/component/design/main/PageDesignWorkspace.tsx

"use client";

import type {
    HeroSectionConfig,
    PageConfig,
    PageSection,
    ProductSectionConfig,
    PromotionSectionConfig,
} from "@mall/mall-page-viewer";

import { usePageEditor } from "@/hooks/design/usePageEditor";

import AdminHeroBanner from "./herobanner/AdminHerorBanner";
import AdminBusinessInfoFooter from "./footer/BusinessInfoFooter";
import AdminMainHeader from "./header/AdminMainHeader";
import AdminProductSection from "./product/AdminProductSection";
import AdminPromotionSection from "./promotion/PromotionSection";

interface PageDesignWorkspaceProps {
    config: PageConfig;
    section: string;
    onClose: () => void;
    onChangeConfig: (
        config: PageConfig,
    ) => void;
}

export function PageDesignWorkspace({
    config,
    section,
    onClose,
    onChangeConfig,
}: PageDesignWorkspaceProps) {
    const {
        config: editingConfig,
        updateHeader,
        updateHero,
        updateSections,
        updateFooter,
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

            const nextConfig: PageConfig = {
                ...editingConfig,
                header: nextHeader,
            };

            onChangeConfig(nextConfig);

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

        onChangeConfig({
            ...editingConfig,
            hero: heroes,
        });
    };

    const handleSectionChange = (
        updatedSection: PageSection,
    ) => {
        const nextSections =
            editingConfig.sections.map(
                (currentSection) =>
                    currentSection.id ===
                        updatedSection.id
                        ? updatedSection
                        : currentSection,
            );

        updateSections(() => nextSections);

        onChangeConfig({
            ...editingConfig,
            sections: nextSections,
        });
    };

    const handleFooterChange = (
        footer: PageConfig["footer"],
    ) => {
        updateFooter(() => footer);

        onChangeConfig({
            ...editingConfig,
            footer,
        });
    };

    const promotionSections =
        editingConfig.sections.filter(
            (
                currentSection,
            ): currentSection is PromotionSectionConfig =>
                currentSection.type ===
                "PROMOTION",
        );

    const productSections =
        editingConfig.sections.filter(
            (
                currentSection,
            ): currentSection is ProductSectionConfig =>
                currentSection.type ===
                "PRODUCT",
        );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        {section}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        선택한 영역을 편집합니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                    닫기
                </button>
            </div>

            {section === "HEADER" && (
                <AdminMainHeader
                    config={editingConfig.header}
                    onChange={
                        handleHeaderChange
                    }
                />
            )}

            {section === "HERO" && (
                <AdminHeroBanner
                    heroes={editingConfig.hero}
                    onChange={handleHeroChange}
                />
            )}

            {section === "PRODUCT" &&
                productSections.map(
                    (productSection) => (
                        <AdminProductSection
                            key={
                                productSection.id
                            }
                            section={
                                productSection
                            }
                            onChange={
                                handleSectionChange
                            }
                        />
                    ),
                )}

            {section === "PROMOTION" &&
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

            {section === "FOOTER" && (
                <AdminBusinessInfoFooter
                    config={
                        editingConfig.footer
                    }
                    onChange={
                        handleFooterChange
                    }
                />
            )}
        </div>
    );
}