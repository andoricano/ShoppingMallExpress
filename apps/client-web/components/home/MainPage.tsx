"use client";

import {
    BusinessInfoFooter,
    HeroBanner,
    ProductSection,
    PromotionSection,
} from "@mall/mall-page-viewer";

import type { PageConfig } from "@mall/mall-page-viewer";
import type { ProductPostSummary } from "@mall/types";

import { useMainPage } from "@/hooks/useMainPage";
import { useWishlist } from "@/hooks/user/useWishlist";
import { useClientAuthStore } from "@/store/useClientAuthStore";

interface MainPageProps {
    config: PageConfig;
    postList: ProductPostSummary[];
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
        heroes,
        sections,
        footer,
    } = useMainPage({
        config,
        postList,
    });

    const authUserId =
        useClientAuthStore(
            (state) => state.authUserId,
        );

    const {
        wishlist,
        addWishlist,
        removeWishlist,
    } = useWishlist();

    const handleNavigate = (
        path: string,
    ) => {
        window.location.href = path;
    };

    const handleWishlistClick = async (
        productPostId: string,
    ) => {
        const isWishlisted =
            wishlist.some(
                (item) =>
                    item.productPostId ===
                    productPostId,
            );

        if (isWishlisted) {
            await removeWishlist(
                productPostId,
            );

            return;
        }

        await addWishlist(
            productPostId,
        );
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
                                    isWishlisted={
                                        authUserId
                                            ? (
                                                  productPostId,
                                              ) =>
                                                  wishlist.some(
                                                      (
                                                          item,
                                                      ) =>
                                                          item.productPostId ===
                                                          productPostId,
                                                  )
                                            : undefined
                                    }
                                    onWishlistClick={
                                        authUserId
                                            ? handleWishlistClick
                                            : undefined
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