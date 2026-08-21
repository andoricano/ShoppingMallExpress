// @/components/product/AddCategoryBox.tsx
"use client";

import { ProductCategory } from "@mall/types";
import { useState } from "react";

interface AddCategoryBoxProps {
    categoryList?: ProductCategory[];
    onAddCategory: (data: {
        categoryName: string;
        parentId: string | null;
        displayOrder: number;
    }) => Promise<boolean>;
}

export function AddCategoryBox({
    categoryList = [],
    onAddCategory,
}: AddCategoryBoxProps) {
    // 폼 입력 상태
    const [categoryName, setCategoryName] = useState("");
    const [parentId, setParentId] = useState<string>("");
    const [displayOrder, setDisplayOrder] = useState<number>(1);
    const [submitting, setSubmitting] = useState(false);

    // 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryName.trim()) {
            alert("카테고리명을 입력해주세요.");
            return;
        }

        setSubmitting(true);

        const success = await onAddCategory({
            categoryName: categoryName.trim(),
            parentId: parentId || null, // 빈 값일 경우 상위 카테고리 없음(1depth)
            displayOrder,
        });

        if (success) {
            // 폼 초기화
            setCategoryName("");
            setParentId("");
            setDisplayOrder(1);
        }

        setSubmitting(false);
    };

    return (
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
            <h3 className="text-md font-semibold text-white border-b border-zinc-800 pb-3">
                새 카테고리 추가
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
                {/* 1. 카테고리명 */}
                <div>
                    <label className="text-zinc-300 block mb-1 font-medium">
                        카테고리명 <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="예: 상의, 바지, 액세서리"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                </div>

                {/* 2. 상위 카테고리 선택 */}
                <div>
                    <label className="text-zinc-300 block mb-1 font-medium">
                        상위 카테고리 (Depth 선택)
                    </label>
                    <select
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                    >
                        <option value="">최상위 카테고리 (1 Depth)</option>
                        {categoryList.map((cat) => (
                            <option key={cat.categoryId} value={cat.categoryId}>
                                {cat.depth > 1 ? `${"─".repeat(cat.depth - 1)} ` : ""}
                                {cat.categoryName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. 표시 순서 */}
                <div>
                    <label className="text-zinc-300 block mb-1 font-medium">
                        표시 순서 (displayOrder)
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(Number(e.target.value))}
                        className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                    />
                </div>

                {/* 제출 버튼 */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-full p-3 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-semibold text-white transition-colors text-xs"
                >
                    {submitting ? "추가 중..." : "카테고리 등록"}
                </button>
            </form>
        </div>
    );
}