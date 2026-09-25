// apps/client-web/hooks/useMainPage.ts

"use client";

import { useMemo } from "react";

import type {
    PageConfig,
    ProductCardData,
} from "@mall/mall-page-viewer";

import type {
    ProductPostSummary,
} from "@mall/types";

interface UseMainPageProps {
    config: PageConfig;
    postList: ProductPostSummary[];
}

export function useMainPage({
    config,
    postList,
}: UseMainPageProps) {
    const productCards =
        useMemo<ProductCardData[]>(
            () =>
                // ProductPost cards carry no price: price belongs to
                // ProductVariant and is shown on the detail page.
                postList.map(
                    (post) => ({
                        id: post.id,
                        imageUrl:
                            post.thumbnailUrl ??
                            undefined,
                        title: post.title,
                        summary:
                            post.summary ??
                            undefined,
                    }),
                ),
            [postList],
        );

    const heroes = useMemo(
        () =>
            [...config.hero]
                .filter(
                    (hero) =>
                        hero.isActive,
                )
                .sort(
                    (a, b) =>
                        a.order - b.order,
                ),
        [config.hero],
    );

    const sections = useMemo(
        () =>
            [...config.sections]
                .filter(
                    (section) =>
                        section.isActive,
                )
                .map((section) => {
                    if (
                        section.type ===
                        "PRODUCT"
                    ) {
                        return {
                            ...section,
                            products:
                                productCards,
                        };
                    }

                    return section;
                })
                .sort(
                    (a, b) =>
                        a.order - b.order,
                ),
        [
            config.sections,
            productCards,
        ],
    );

    return {
        header: config.header,
        heroes,
        sections,
        footer: config.footer,
    };
}