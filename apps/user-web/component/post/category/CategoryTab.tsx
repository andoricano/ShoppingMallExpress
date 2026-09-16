"use client";

import { useCategoryEditor } from "@/hooks/category/useCategoryEditor";
import type { ProductPostCategory } from "@mall/types";

interface CategoryTabProps {
    categories: ProductPostCategory[];

    onChange?: (
        categories: ProductPostCategory[],
    ) => void;

    onCreate?: () => void;
}

export default function CategoryTab({
    categories,
    onChange,
    onCreate,
}: CategoryTabProps) {
    const {
        originalCategories,
        editedCategories,
        updateCategoryName,
    } = useCategoryEditor(
        categories,
    );

    const handleUpdateCategoryName = (
        categoryId: string,
    ) => {
        updateCategoryName(
            categoryId,
        );

        const nextCategories =
            editedCategories.map(
                (category) =>
                    category.id ===
                    categoryId
                        ? {
                              ...category,
                              name: "TEST",
                          }
                        : category,
            );

        onChange?.(nextCategories);
    };

    return (
        <section className="w-full">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                    Category
                </h2>

                <button
                    type="button"
                    onClick={onCreate}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                    카테고리 생성
                </button>
            </div>

            {originalCategories.length ===
            0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                    <p className="text-sm text-slate-400">
                        등록된 카테고리가 없습니다.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {originalCategories.map(
                        (original) => {
                            const edited =
                                editedCategories.find(
                                    (category) =>
                                        category.id ===
                                        original.id,
                                );

                            return (
                                <div
                                    key={
                                        original.id
                                    }
                                    className="rounded-md border border-slate-200 bg-white p-4"
                                >
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                                        {/* 수정 전 */}
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-slate-400">
                                                수정 전
                                            </p>

                                            <p className="text-sm font-medium text-slate-900">
                                                {
                                                    original.name
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                ID:{" "}
                                                {
                                                    original.id
                                                }
                                            </p>

                                            <p className="text-xs text-slate-400">
                                                depth:{" "}
                                                {
                                                    original.depth
                                                }
                                                {" · "}
                                                parent:{" "}
                                                {original.parentId ??
                                                    "ROOT"}
                                            </p>
                                        </div>

                                        {/* 수정 후 */}
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-slate-400">
                                                수정 후
                                            </p>

                                            <p
                                                className={[
                                                    "text-sm font-medium",
                                                    edited?.name !==
                                                    original.name
                                                        ? "text-rose-500"
                                                        : "text-slate-900",
                                                ].join(
                                                    " ",
                                                )}
                                            >
                                                {
                                                    edited?.name
                                                }
                                            </p>
                                        </div>

                                        {/* 수정 버튼 */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUpdateCategoryName(
                                                    original.id,
                                                )
                                            }
                                            className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                        >
                                            랜덤 변경
                                        </button>
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
            )}
        </section>
    );
}