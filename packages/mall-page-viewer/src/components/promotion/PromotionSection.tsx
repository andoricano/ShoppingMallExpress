// packages/mall-page-viewer/src/components/promotion/PromotionSection.tsx

"use client";

import { useRef } from "react";

import PromotionCard from "./PromotionCard";
import type { PromotionSectionConfig } from "../../types/mainPage";

interface PromotionSectionProps {
    section: PromotionSectionConfig;
    onNavigate?: (path: string) => void;
}

export default function PromotionSection({
    section,
    onNavigate,
}: PromotionSectionProps) {
    const containerRef =
        useRef<HTMLDivElement>(null);

    if (!section.isActive) {
        return null;
    }

    const promotions = Array.isArray(
        section.promotions,
    )
        ? section.promotions
        : [];

    if (promotions.length === 0) {
        return null;
    }

    const scroll = (
        direction: "left" | "right",
    ) => {
        const container =
            containerRef.current;

        if (!container) {
            return;
        }

        const amount =
            container.clientWidth * 0.8;

        container.scrollBy({
            left:
                direction === "right"
                    ? amount
                    : -amount,
            behavior: "smooth",
        });
    };

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            {section.title && (
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                        {section.title}
                    </h2>
                </div>
            )}

            <div className="relative w-full">
                <button
                    type="button"
                    onClick={() =>
                        scroll("left")
                    }
                    aria-label="이전 프로모션"
                    className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-lg text-neutral-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                    ‹
                </button>

                <div
                    ref={containerRef}
                    className="flex w-full gap-5 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {promotions.map(
                        (promotion) => (
                            <div
                                key={promotion.id}
                                className="w-full shrink-0"
                            >
                                <PromotionCard
                                    promotion={
                                        promotion
                                    }
                                    onNavigate={
                                        onNavigate
                                    }
                                />
                            </div>
                        ),
                    )}
                </div>

                <button
                    type="button"
                    onClick={() =>
                        scroll("right")
                    }
                    aria-label="다음 프로모션"
                    className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-lg text-neutral-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                    ›
                </button>
            </div>
        </section>
    );
}