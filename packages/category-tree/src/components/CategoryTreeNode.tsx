// packages/category-tree/src/components/CategoryTreeNode.tsx

"use client";

import type { CategoryTree } from "../types/categoryTree";

interface CategoryTreeNodeProps {
    node: CategoryTree;

    depth?: number;

    selectedId?: string | null;

    onSelect?: (
        node: CategoryTree,
    ) => void;
}

export default function CategoryTreeNode({
    node,
    depth = 0,
    selectedId = null,
    onSelect,
}: CategoryTreeNodeProps) {
    const isSelected =
        selectedId === node.id;

    return (
        <div>
            <button
                type="button"
                onClick={() =>
                    onSelect?.(node)
                }
                className={[
                    "flex w-full items-center rounded-md py-2 text-left transition-colors",
                    isSelected
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                style={{
                    paddingLeft:
                        `${depth * 20 + 8}px`,
                }}
            >
                <span className="mr-2 w-4 shrink-0 text-center text-sm text-slate-400">
                    {node.children.length >
                        0
                        ? "└"
                        : "·"}
                </span>

                <span className="text-sm font-medium">
                    {node.name}
                </span>
            </button>

            {node.children.length > 0 && (
                <div>
                    {node.children.map(
                        (child) => (
                            <CategoryTreeNode
                                key={
                                    child.id
                                }
                                node={
                                    child
                                }
                                depth={
                                    depth + 1
                                }
                                selectedId={
                                    selectedId
                                }
                                onSelect={
                                    onSelect
                                }
                            />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}