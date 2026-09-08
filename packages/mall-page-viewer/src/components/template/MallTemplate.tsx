// packages/mall-page-viewer/src/components/template/MallTemplate.tsx

"use client";

import Header from "../header/Header";
import HeroBanner from "../herobanner/HeroBanner";
import ProductSection from "../product/ProductSection";
import PromotionSection from "../promotion/PromotionSection";
import BusinessInfoFooter from "../footer/BusinessInfoFooter";

import type { PageConfig } from "../../types/mainPage";

interface MallTemplateProps {
    config: PageConfig;

    isLoggedIn?: boolean;
    cartItemCount?: number;
    wishlistItemCount?: number;

    onNavigate: (path: string) => void;
    onLogout?: () => void;
}

export default function MallTemplate({
    config,
    isLoggedIn = false,
    cartItemCount = 0,
    wishlistItemCount = 0,
    onNavigate,
    onLogout,
}: MallTemplateProps) {
    const heroes = [...config.hero]
        .filter((hero) => hero.isActive)
        .sort((a, b) => a.order - b.order);

    const sections = [...config.sections]
        .filter((section) => section.isActive)
        .sort((a, b) => a.order - b.order);

    return (
        <div className="min-h-screen bg-white">
            <Header
                config={config.header}
                isLoggedIn={isLoggedIn}
                cartItemCount={cartItemCount}
                wishlistItemCount={wishlistItemCount}
                onNavigate={onNavigate}
                onLogout={onLogout}
            />

            <main>
                {heroes.map((hero) => (
                    <HeroBanner
                        key={hero.id}
                        section={hero}
                        onNavigate={onNavigate}
                    />
                ))}

                {sections.map((section) => {
                    switch (section.type) {
                        case "PRODUCT":
                            return (
                                <ProductSection
                                    key={section.id}
                                    section={section}
                                    onNavigate={onNavigate}
                                />
                            );

                        case "PROMOTION":
                            return (
                                <PromotionSection
                                    key={section.id}
                                    section={section}
                                    onNavigate={onNavigate}
                                />
                            );

                        default:
                            return null;
                    }
                })}
            </main>

            <BusinessInfoFooter
                config={config.footer}
            />
        </div>
    );
}