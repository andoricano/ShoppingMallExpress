// packages/category-tree/src/components/CategoryTreeEditor.tsx

"use client";

import { useCategoryTreeEditor } from "../hooks/useCategoryTreeEditor";

import type { CategoryTree } from "../types/categoryTree";

import CategoryTreePanel from "./CategoryTreePanel";
import CategoryTreeView from "./CategoryTreeView";

interface CategoryTreeEditorProps {
    nodes: CategoryTree[];
}

export default function CategoryTreeEditor({
    nodes,
}: CategoryTreeEditorProps) {
    const {
        tree,
        selectedNode,
        selectCategory,
        updateSelectedName,
    } = useCategoryTreeEditor(
        nodes,
    );

    const handleSelect = (
        node: CategoryTree,
    ) => {
        selectCategory(node.id);
    };

    return (
        <section className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Category Tree */}
            <div className="min-h-80 rounded-xl border border-slate-200 bg-white p-5">
                <header className="mb-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Category
                    </h2>
                </header>

                <CategoryTreeView
                    nodes={tree}
                    selectedId={
                        selectedNode?.id ??
                        null
                    }
                    onSelect={
                        handleSelect
                    }
                />
            </div>

            {/* Category Editor Panel */}
            <CategoryTreePanel
                node={selectedNode}
                onSaveName={
                    updateSelectedName
                }
            />
        </section>
    );
}