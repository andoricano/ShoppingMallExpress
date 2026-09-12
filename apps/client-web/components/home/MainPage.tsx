// apps/client-web/components/home/MainPage.tsx

"use client";

import {
    BusinessInfoFooter,
    Header,
    HeroBanner,
    ProductSection,
    PromotionSection,
} from "@mall/mall-page-viewer";

import type { PageConfig } from "@mall/mall-page-viewer";
import type { ProductPost } from "@mall/types";

import { useMainPage } from "@/hooks/useMainPage";

interface MainPageProps {
    config: PageConfig;

    postList: ProductPost[];

    loading: boolean;
    error: string | null;
}

export default function MainPage({
    config,
    postList,
    loading,
    error,
}: MainPageProps) {
    const {
        header,
        heroes,
        sections,
        footer,
    } = useMainPage({
        config,
        postList,
    });

    const handleNavigate = (
        path: string,
    ) => {
        window.location.href = path;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                상품 게시물을 불러오는 중입니다.
            </div>
        );
    }

    return (
        <main className="min-h-screen">
            {header.isActive && (
                <Header
                    config={header}
                    isLoggedIn={false}
                    cartItemCount={0}
                    wishlistItemCount={0}
                    onNavigate={
                        handleNavigate
                    }
                />
            )}

            {heroes.map((hero) => (
                <HeroBanner
                    key={hero.id}
                    section={hero}
                    onNavigate={
                        handleNavigate
                    }
                />
            ))}

            <div className="divide-y divide-neutral-100">
                {sections.map((section) => {
                    switch (section.type) {
                        case "PRODUCT":
                            return (
                                <ProductSection
                                    key={
                                        section.id
                                    }
                                    section={
                                        section
                                    }
                                    onNavigate={
                                        handleNavigate
                                    }
                                />
                            );

                        case "PROMOTION":
                            return (
                                <PromotionSection
                                    key={
                                        section.id
                                    }
                                    section={
                                        section
                                    }
                                    onNavigate={
                                        handleNavigate
                                    }
                                />
                            );

                        default:
                            return null;
                    }
                })}
            </div>

            {footer.isActive && (
                <BusinessInfoFooter
                    config={footer}
                />
            )}

            {error && (
                <div className="fixed bottom-4 right-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
                    {error}
                </div>
            )}
        </main>
    );
}