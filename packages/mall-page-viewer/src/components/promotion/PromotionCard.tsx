// packages/mall-page-viewer/src/components/promotion/PromotionCard.tsx

"use client";

import type { PromotionCardData } from "../../types/mainPage";

interface PromotionCardProps {
    promotion: PromotionCardData;
    onNavigate?: (path: string) => void;
}

export default function PromotionCard({
    promotion,
    onNavigate,
}: PromotionCardProps) {
    const handleClick = () => {
        if (
            promotion.relativePath &&
            onNavigate
        ) {
            onNavigate(
                promotion.relativePath,
            );
        }
    };

    return (
        <article className="group relative h-[400px] w-full overflow-hidden rounded-xl bg-neutral-100">
            {promotion.imageUrl ? (
                <img
                    src={promotion.imageUrl}
                    alt={
                        promotion.title ?? ""
                    }
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                    프로모션 이미지 없음
                </div>
            )}

            {promotion.relativePath && (
                <button
                    type="button"
                    onClick={handleClick}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100"
                >
                    <span className="rounded-lg bg-white/90 px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-sm">
                        보러가기
                    </span>
                </button>
            )}
        </article>
    );
}