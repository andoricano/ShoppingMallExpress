// packages/category-tree/src/components/CategoryTreeEditor.tsx

"use client";

import { useCategoryTreeEditor } from "../hooks/useCategoryTreeEditor";

import type { CategoryTree } from "../types/categoryTree";

import CategoryTreeEditorForm from "./CategoryTreeEditorForm";
import CategoryTreeEditorHeader from "./CategoryTreeEditorHeader";
import CategoryTreeView from "./CategoryTreeView";

interface CategoryTreeEditorProps {
    nodes: CategoryTree[];

    onSave?: (
        tree: CategoryTree[],
    ) => void;
}

export default function CategoryTreeEditor({
    nodes,
    onSave,
}: CategoryTreeEditorProps) {
    const {
        tree,
        selectedNode,
        selectCategory,
        updateSelectedName,
        addChildCategory,
        deleteSelectedCategory,

        hasChanges,
        canUndo,
        canRedo,
        undo,
        redo,
    } = useCategoryTreeEditor(
        nodes,
    );

    return (
        <section className="w-full">
            <CategoryTreeEditorHeader
                hasChanges={
                    hasChanges
                }
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onSave={() =>
                    onSave?.(tree)
                }
            />

            <div className="grid w-full grid-cols-[minmax(0,1fr)_360px] gap-6">
                {/* Category Tree */}
                <div className="min-h-80 rounded-xl border border-slate-200 bg-white p-5">
                    <CategoryTreeView
                        nodes={tree}
                        selectedId={
                            selectedNode?.id ??
                            null
                        }
                        onSelect={(node) =>
                            selectCategory(
                                node.id,
                            )
                        }
                    />
                </div>

                {/* Category Editor Form */}
                <CategoryTreeEditorForm
                    node={
                        selectedNode
                    }
                    onSaveName={
                        updateSelectedName
                    }
                    onAddChild={
                        addChildCategory
                    }
                    onDelete={
                        deleteSelectedCategory
                    }
                />
            </div>
        </section>
    );
}