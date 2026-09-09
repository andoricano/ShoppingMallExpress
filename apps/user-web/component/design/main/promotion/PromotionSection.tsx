// packages/mall-page-viewer/src/components/promotion/PromotionSection.tsx

"use client";

import { useRef } from "react";


import PromotionCard from "./PromotionCard";
import { PromotionSectionConfig } from "../../types/mainPage";

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
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            {/* Section Header */}
            {section.title && (
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                        {section.title}
                    </h2>
                </div>
            )}

            {/* Promotion Queue */}
            <div className="relative">
                {/* Left */}
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

                {/* Cards */}
                <div
                    ref={containerRef}
                    className="flex gap-5 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {promotions.map(
                        (promotion) => (
                            <div
                                key={
                                    promotion.id
                                }
                                className="w-[calc(100%-48px)] shrink-0 sm:w-[70%] lg:w-[60%]"
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

                {/* Right */}
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