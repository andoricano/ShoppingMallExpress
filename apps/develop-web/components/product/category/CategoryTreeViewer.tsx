// @/components/product/category/CategoryTreeViewer.tsx
"use client";

import { ProductCategory } from "@mall/types";

interface CategoryTreeViewerProps {
    categoryList?: ProductCategory[];
    onUpdateCategory?: (categoryId: string, payload: Partial<ProductCategory>) => Promise<boolean>; // onUpdateCategory 프로퍼티 추가 주석: 수정 핸들러 타입 정의
    onDeleteCategory?: (categoryId: string, name: string) => void;
}

export function CategoryTreeViewer({
    categoryList = [],
    onUpdateCategory, // onUpdateCategory 바인딩 주석: 수정 핸들러 받아오기
    onDeleteCategory,
}: CategoryTreeViewerProps) {
    console.log("CategoryList : ",categoryList)
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
                                    onClick={() => onDeleteCategory?.(node.categoryId, node.categoryName)}
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
        <div className="lg:col-span-2 p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-sm font-semibold text-white">
                    계층형 카테고리 트리 현황
                </h3>
                <span className="text-[11px] text-zinc-400">
                    최대 3depth 구조 지원
                </span>
            </div>

            {!categoryList || categoryList.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                    등록된 카테고리가 없습니다. 우측 폼에서 신규 카테고리를 추가해주세요.
                </div>
            ) : (
                <div className="overflow-x-auto pr-2">
                    {renderCategoryTree(categoryList)}
                </div>
            )}
        </div>
    );
}