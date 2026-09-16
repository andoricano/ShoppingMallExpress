// packages/category-tree/src/components/CategoryTreeView.tsx

"use client";

import type { CategoryTree } from "../types/categoryTree";

import CategoryTreeNode from "./CategoryTreeNode";

interface CategoryTreeViewProps {
    nodes: CategoryTree[];

    selectedId?: string | null;

    onSelect?: (
        node: CategoryTree,
    ) => void;
}

export default function CategoryTreeView({
    nodes,
    selectedId = null,
    onSelect,
}: CategoryTreeViewProps) {
    return (
        <div className="w-full">
            {nodes.map((node) => (
                <CategoryTreeNode
                    key={node.id}
                    node={node}
                    selectedId={
                        selectedId
                    }
                    onSelect={
                        onSelect
                    }
                />
            ))}
        </div>
    );
}