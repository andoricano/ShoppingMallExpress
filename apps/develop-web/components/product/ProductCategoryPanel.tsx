// @/components/product/ProductCategoryPanel.tsx
"use client";

import { ProductCategory } from "@mall/types";
import { useState } from "react";

interface ProductCategoryPanelProps {
    categoryList?: ProductCategory[];
    onCreateCategory?: (payload: Omit<ProductCategory, "categoryId">) => Promise<boolean>;
    onUpdateCategory?: (categoryId: string, payload: Partial<ProductCategory>) => Promise<boolean>;
    onDeleteCategory?: (categoryId: string) => Promise<boolean>;
}

// 더미 데이터 (서버 연동 전 UI 테스트 및 백업용)
const DEFAULT_CATEGORIES: ProductCategory[] = [
    {
        categoryId: "CAT-100",
        categoryName: "패션의류",
        parentId: null,
        depth: 1,
        displayOrder: 1,
        children: [
            {
                categoryId: "CAT-110",
                categoryName: "상의",
                parentId: "CAT-100",
                depth: 2,
                displayOrder: 1,
                children: [
                    {
                        categoryId: "CAT-111",
                        categoryName: "반팔티",
                        parentId: "CAT-110",
                        depth: 3,
                        displayOrder: 1,
                    },
                    {
                        categoryId: "CAT-112",
                        categoryName: "맨투맨/후드",
                        parentId: "CAT-110",
                        depth: 3,
                        displayOrder: 2,
                    },
                ],
            },
            {
                categoryId: "CAT-120",
                categoryName: "하의",
                parentId: "CAT-100",
                depth: 2,
                displayOrder: 2,
            },
        ],
    },
    {
        categoryId: "CAT-200",
        categoryName: "잡화/신발",
        parentId: null,
        depth: 1,
        displayOrder: 2,
    },
];

export function ProductCategoryPanel({
    categoryList = DEFAULT_CATEGORIES,
    onCreateCategory,
    onDeleteCategory,
}: ProductCategoryPanelProps) {
    // 카테고리 추가 폼 상태
    const [categoryName, setCategoryName] = useState("");
    const [selectedParentId, setSelectedParentId] = useState<string>("ROOT");
    const [displayOrder, setDisplayOrder] = useState<number>(1);
    const [submitting, setSubmitting] = useState(false);

    // 평탄화된 (Flattened) 부모 선택용 목록 추출 함수
    const getFlattenCategories = (
        nodes: ProductCategory[],
        prefix = ""
    ): Array<{ id: string; name: string; depth: number }> => {
        let result: Array<{ id: string; name: string; depth: number }> = [];
        for (const node of nodes) {
            result.push({
                id: node.categoryId,
                name: `${prefix}${node.categoryName}`,
                depth: node.depth,
            });
            if (node.children && node.children.length > 0) {
                result = result.concat(
                    getFlattenCategories(node.children, `${prefix}${node.categoryName} > `)
                );
            }
        }
        return result;
    };

    const flatCategoryOptions = getFlattenCategories(categoryList);

    // 카테고리 등록
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryName.trim()) {
            alert("카테고리 이름을 입력해주세요.");
            return;
        }

        const isRoot = selectedParentId === "ROOT";
        let depth = 1;

        if (!isRoot) {
            const parentCat = flatCategoryOptions.find((c) => c.id === selectedParentId);
            if (parentCat) {
                if (parentCat.depth >= 3) {
                    alert("카테고리는 최대 3단계(depth)까지만 생성 가능합니다.");
                    return;
                }
                depth = parentCat.depth + 1;
            }
        }

        const payload = {
            categoryName: categoryName.trim(),
            parentId: isRoot ? null : selectedParentId,
            depth,
            displayOrder: Number(displayOrder),
        };

        setSubmitting(true);
        if (onCreateCategory) {
            const success = await onCreateCategory(payload);
            if (success) {
                setCategoryName("");
                setSelectedParentId("ROOT");
                setDisplayOrder(1);
            }
        } else {
            // 목업 실행 알림
            alert(`[테스트] 카테고리 생성 요청: ${JSON.stringify(payload, null, 2)}`);
            setCategoryName("");
        }
        setSubmitting(false);
    };

    // 카테고리 삭제
    const handleDelete = async (categoryId: string, name: string) => {
        if (!confirm(`'${name}' 카테고리를 정말 삭제하시겠습니까?\n하위 카테고리가 있다면 함께 영향을 받습니다.`)) {
            return;
        }

        if (onDeleteCategory) {
            await onDeleteCategory(categoryId);
        } else {
            alert(`[테스트] 카테고리 삭제 요청 ID: ${categoryId}`);
        }
    };

    // 트리 재귀 렌더링 컴포넌트
    const renderCategoryTree = (nodes: ProductCategory[]) => {
        return (
            <ul className="flex flex-col gap-2 pl-4 border-l border-zinc-800 my-1">
                {nodes.map((node) => (
                    <li key={node.categoryId} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between p-2 rounded bg-zinc-800/60 border border-zinc-700/60 hover:border-zinc-600">
                            <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-700 text-zinc-300 rounded">
                                    {node.depth}Depth
                                </span>
                                <span className="font-semibold text-white text-xs">
                                    {node.categoryName}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-500">
                                    ({node.categoryId})
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-zinc-400">
                                    순서: <strong className="text-zinc-200">{node.displayOrder}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(node.categoryId, node.categoryName)}
                                    className="px-2 py-0.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 rounded text-[10px]"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>

                        {/* 자식 노드가 존재하는 경우 재귀 렌더링 */}
                        {node.children && node.children.length > 0 && renderCategoryTree(node.children)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-zinc-300">
            {/* 1. 카테고리 구조 트리 뷰어 (Left - 2cols) */}
            <div className="lg:col-span-2 p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <h3 className="text-sm font-semibold text-white">
                        계층형 카테고리 트리 현황
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                        최대 3depth 구조 지원
                    </span>
                </div>

                {categoryList.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                        등록된 카테고리가 없습니다. 우측 폼에서 신규 카테고리를 추가해주세요.
                    </div>
                ) : (
                    <div className="overflow-x-auto pr-2">
                        {renderCategoryTree(categoryList)}
                    </div>
                )}
            </div>

            {/* 2. 카테고리 신규 추가 폼 (Right - 1col) */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4 h-fit">
                <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
                    신규 카테고리 추가
                </h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {/* 상위 카테고리 선택 */}
                    <div>
                        <label className="block text-zinc-400 mb-1">상위 카테고리</label>
                        <select
                            value={selectedParentId}
                            onChange={(e) => setSelectedParentId(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                        >
                            <option value="ROOT">[대분류] 최상위 카테고리 (1depth)</option>
                            {flatCategoryOptions.map((cat) => (
                                <option
                                    key={cat.id}
                                    value={cat.id}
                                    disabled={cat.depth >= 3}
                                >
                                    {cat.name} {cat.depth >= 3 ? "(최대 깊이 달성)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 카테고리명 */}
                    <div>
                        <label className="block text-zinc-400 mb-1">
                            카테고리명 <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="예: 반팔티, 청바지"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* 노출 순서 */}
                    <div>
                        <label className="block text-zinc-400 mb-1">노출 정렬 순서</label>
                        <input
                            type="number"
                            placeholder="1"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(Number(e.target.value))}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 w-full p-2.5 bg-blue-600 hover:bg-blue-500 font-semibold text-white rounded disabled:opacity-50 transition-colors"
                    >
                        {submitting ? "등록 중..." : "카테고리 추가"}
                    </button>
                </form>
            </div>
        </div>
    );
}