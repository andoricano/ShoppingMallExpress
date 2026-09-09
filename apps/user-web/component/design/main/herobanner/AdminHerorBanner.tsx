// apps/user-web/component/design/main/herobanner/AdminHeroBanner.tsx

"use client";

import { useState } from "react";

import type {
    HeroSectionConfig,
} from "@mall/mall-page-viewer";

import AdminHeroBannerEditor from "./AdminHeroBannerEditor";

interface AdminHeroBannerProps {
    heroes: HeroSectionConfig[];

    onChange: (
        heroes: HeroSectionConfig[],
    ) => void;
}

export default function AdminHeroBanner({
    heroes,
    onChange,
}: AdminHeroBannerProps) {
    const [selectedHeroId, setSelectedHeroId] =
        useState<string | null>(
            heroes[0]?.id ?? null,
        );

    const [isEditorOpen, setIsEditorOpen] =
        useState(false);

    const selectedHero = heroes.find(
        (hero) =>
            hero.id === selectedHeroId,
    );

    const updateHero = (
        updatedHero: HeroSectionConfig,
    ) => {
        onChange(
            heroes.map((hero) =>
                hero.id === updatedHero.id
                    ? updatedHero
                    : hero,
            ),
        );
    };

    const addHero = () => {
        const nextOrder =
            heroes.length > 0
                ? Math.max(
                    ...heroes.map(
                        (hero) =>
                            hero.order,
                    ),
                ) + 1
                : 0;

        const newHero: HeroSectionConfig = {
            id: crypto.randomUUID(),
            imageUrl: "",
            title: "새 Hero",
            description: "",
            relativePath: "",
            order: nextOrder,
            isActive: true,
        };

        onChange([
            ...heroes,
            newHero,
        ]);

        setSelectedHeroId(newHero.id);
        setIsEditorOpen(true);
    };

    const removeHero = (
        heroId: string,
    ) => {
        const nextHeroes = heroes
            .filter(
                (hero) =>
                    hero.id !== heroId,
            )
            .map((hero, index) => ({
                ...hero,
                order: index,
            }));

        onChange(nextHeroes);

        if (selectedHeroId === heroId) {
            setSelectedHeroId(
                nextHeroes[0]?.id ?? null,
            );
            setIsEditorOpen(false);
        }
    };

    const handleSelectHero = (
        heroId: string,
    ) => {
        setSelectedHeroId(heroId);
        setIsEditorOpen(false);
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Hero
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        메인 페이지의 Hero 콘텐츠를 관리합니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addHero}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                    Hero 추가
                </button>
            </div>

            {/* Hero List */}
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                {heroes.map((hero) => (
                    <button
                        key={hero.id}
                        type="button"
                        onClick={() =>
                            handleSelectHero(
                                hero.id,
                            )
                        }
                        className={
                            hero.id ===
                                selectedHeroId
                                ? "w-40 shrink-0 rounded-lg border-2 border-slate-900 bg-slate-50 p-2 text-left"
                                : "w-40 shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-left hover:bg-slate-50"
                        }
                    >
                        <div className="aspect-[16/5] overflow-hidden rounded-md bg-slate-100">
                            {hero.imageUrl ? (
                                <img
                                    src={
                                        hero.imageUrl
                                    }
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                    이미지 없음
                                </div>
                            )}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-slate-700">
                                {hero.title ||
                                    "제목 없음"}
                            </span>

                            <span className="text-xs text-slate-400">
                                {hero.isActive
                                    ? "활성"
                                    : "비활성"}
                            </span>
                        </div>
                    </button>
                ))}

                {heroes.length === 0 && (
                    <div className="flex min-h-32 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
                        등록된 Hero가 없습니다.
                    </div>
                )}
            </div>

            {/* Editor Toggle */}
            {selectedHero && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                {selectedHero.title ||
                                    "선택한 Hero"}
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                                선택된 Hero의 콘텐츠를 편집합니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() =>
                                    removeHero(
                                        selectedHero.id,
                                    )
                                }
                                className="text-xs text-rose-500 transition-colors hover:text-rose-700"
                            >
                                Hero 삭제
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsEditorOpen(
                                        (current) =>
                                            !current,
                                    )
                                }
                                className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                            >
                                {isEditorOpen
                                    ? "편집 닫기"
                                    : "편집하기"}
                            </button>
                        </div>
                    </div>

                    {isEditorOpen && (
                        <div className="mt-6">
                            <AdminHeroBannerEditor
                                hero={selectedHero}
                                onChange={updateHero}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}