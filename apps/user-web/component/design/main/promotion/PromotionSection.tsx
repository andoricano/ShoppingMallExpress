// apps/user-web/component/design/main/promotion/AdminPromotionSection.tsx

"use client";

import { useState } from "react";

import type {
    PromotionSectionConfig,
} from "@mall/mall-page-viewer";

interface AdminPromotionSectionProps {
    section: PromotionSectionConfig;

    onChange: (
        section: PromotionSectionConfig,
    ) => void;

    onDelete?: () => void;
}

export default function AdminPromotionSection({
    section,
    onChange,
    onDelete,
}: AdminPromotionSectionProps) {
    const [isEditorOpen, setIsEditorOpen] =
        useState(false);

    const updateSection = (
        updates: Partial<PromotionSectionConfig>,
    ) => {
        onChange({
            ...section,
            ...updates,
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Promotion
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        프로모션 Section의 콘텐츠를 관리합니다.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={
                            section.isActive
                                ? "text-sm text-emerald-600"
                                : "text-sm text-slate-400"
                        }
                    >
                        {section.isActive
                            ? "활성"
                            : "비활성"}
                    </span>

                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="text-xs text-rose-500 transition-colors hover:text-rose-700"
                        >
                            삭제
                        </button>
                    )}

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

            {/* Summary */}
            <div className="mt-6 rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            {section.title ||
                                "제목 없음"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            프로모션{" "}
                            {
                                section.promotions
                                    .length
                            }
                            개
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor */}
            {isEditorOpen && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Section 제목
                            </label>

                            <input
                                type="text"
                                value={
                                    section.title ??
                                    ""
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateSection({
                                        title: event
                                            .target
                                            .value,
                                    })
                                }
                                placeholder="Promotion Section 제목"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        {/* Active */}
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Section 노출
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    비활성화하면 Client에 표시되지 않습니다.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    updateSection(
                                        {
                                            isActive:
                                                !section.isActive,
                                        },
                                    )
                                }
                                className={
                                    section.isActive
                                        ? "relative h-6 w-11 rounded-full bg-slate-900"
                                        : "relative h-6 w-11 rounded-full bg-slate-300"
                                }
                            >
                                <span
                                    className={
                                        section.isActive
                                            ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-white"
                                            : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white"
                                    }
                                />
                            </button>
                        </div>

                        {/* Promotions */}
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        Promotion
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-400">
                                        현재 Section에 포함된 프로모션입니다.
                                    </p>
                                </div>

                                <span className="text-xs text-slate-400">
                                    {
                                        section
                                            .promotions
                                            .length
                                    }
                                    개
                                </span>
                            </div>

                            <div className="mt-4 space-y-2">
                                {section.promotions.map(
                                    (
                                        promotion,
                                    ) => (
                                        <div
                                            key={
                                                promotion.id
                                            }
                                            className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                                        >
                                            <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                                {promotion.imageUrl ? (
                                                    <img
                                                        src={
                                                            promotion.imageUrl
                                                        }
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                                                        없음
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-700">
                                                    {
                                                        promotion.title
                                                    }
                                                </p>

                                                <p className="mt-1 truncate text-xs text-slate-400">
                                                    {
                                                        promotion.description
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}

                                {section.promotions
                                    .length ===
                                    0 && (
                                        <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-xs text-slate-400">
                                            등록된 프로모션이 없습니다.
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}