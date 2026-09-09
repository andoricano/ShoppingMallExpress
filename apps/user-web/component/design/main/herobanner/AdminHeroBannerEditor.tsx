// apps/user-web/component/design/main/herobanner/AdminHeroBannerEditor.tsx

"use client";

import type { HeroSectionConfig } from "@mall/mall-page-viewer";

interface AdminHeroBannerEditorProps {
    hero: HeroSectionConfig;

    onChange: (
        hero: HeroSectionConfig,
    ) => void;
}

export default function AdminHeroBannerEditor({
    hero,
    onChange,
}: AdminHeroBannerEditorProps) {
    const updateHero = (
        updates: Partial<HeroSectionConfig>,
    ) => {
        onChange({
            ...hero,
            ...updates,
        });
    };

    return (
        <div className="space-y-6">
            {/* Preview */}
            <div>
                <h3 className="text-sm font-semibold text-slate-800">
                    Hero Preview
                </h3>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {hero.imageUrl ? (
                        <img
                            src={hero.imageUrl}
                            alt=""
                            className="aspect-[16/5] w-full object-cover"
                        />
                    ) : (
                        <div className="flex aspect-[16/5] items-center justify-center text-sm text-slate-400">
                            이미지 없음
                        </div>
                    )}
                </div>
            </div>

            {/* Image */}
            <div>
                <label className="text-sm font-medium text-slate-700">
                    이미지 URL
                </label>

                <input
                    type="text"
                    value={
                        hero.imageUrl ?? ""
                    }
                    onChange={(event) =>
                        updateHero({
                            imageUrl:
                                event.target
                                    .value,
                        })
                    }
                    placeholder="이미지 URL"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
                />
            </div>

            {/* Title */}
            <div>
                <label className="text-sm font-medium text-slate-700">
                    제목
                </label>

                <input
                    type="text"
                    value={
                        hero.title ?? ""
                    }
                    onChange={(event) =>
                        updateHero({
                            title: event.target
                                .value,
                        })
                    }
                    placeholder="Hero 제목"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
                />
            </div>

            {/* Description */}
            <div>
                <label className="text-sm font-medium text-slate-700">
                    설명
                </label>

                <textarea
                    value={
                        hero.description ?? ""
                    }
                    onChange={(event) =>
                        updateHero({
                            description:
                                event.target
                                    .value,
                        })
                    }
                    placeholder="Hero 설명"
                    rows={4}
                    className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
                />
            </div>

            {/* Relative Path */}
            <div>
                <label className="text-sm font-medium text-slate-700">
                    이동 경로
                </label>

                <input
                    type="text"
                    value={
                        hero.relativePath ??
                        ""
                    }
                    onChange={(event) =>
                        updateHero({
                            relativePath:
                                event.target
                                    .value,
                        })
                    }
                    placeholder="/products"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
                />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                    <p className="text-sm font-medium text-slate-700">
                        Hero 노출
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                        비활성화하면 Client에 표시되지 않습니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        updateHero({
                            isActive:
                                !hero.isActive,
                        })
                    }
                    className={
                        hero.isActive
                            ? "relative h-6 w-11 rounded-full bg-slate-900 transition-colors"
                            : "relative h-6 w-11 rounded-full bg-slate-300 transition-colors"
                    }
                    aria-label="Hero 노출 상태 변경"
                >
                    <span
                        className={
                            hero.isActive
                                ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-white transition-all"
                                : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all"
                        }
                    />
                </button>
            </div>
        </div>
    );
}