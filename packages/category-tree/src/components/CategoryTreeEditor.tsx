"use client";

import { useEffect, useState } from "react";

import { useCategoryTreeEditor } from "../hooks/useCategoryTreeEditor";

import type { CategoryTree } from "../types/categoryTree";

import CategoryTreeEditorEmpty from "./CategoryTreeEditorEmpty";
import CategoryTreeEditorForm from "./CategoryTreeEditorForm";
import CategoryTreeEditorHeader from "./CategoryTreeEditorHeader";
import CategoryTreeView from "./CategoryTreeView";

type SaveStatus =
    | "saving"
    | "saved"
    | "editing"
    | null;

interface CategoryTreeEditorProps {
    nodes: CategoryTree[];

    onSave?: (
        tree: CategoryTree[],
    ) => void | Promise<void>;
}

export default function CategoryTreeEditor({
    nodes,
    onSave,
}: CategoryTreeEditorProps) {
    const {
        tree,
        selectedNode,
        addRootCategory,
        selectCategory,
        updateSelectedName,
        addChildCategory,
        deleteSelectedCategory,

        hasChanges,
        canUndo,
        canRedo,
        undo,
        redo,
    } = useCategoryTreeEditor(nodes);




    const [
        saveStatus,
        setSaveStatus,
    ] = useState<SaveStatus>(null);



    useEffect(() => {
        if (!hasChanges) {
            return;
        }

        if (saveStatus === "saving") {
            return;
        }

        if (saveStatus === "saved") {
            return;
        }

        setSaveStatus("editing");
    }, [tree, hasChanges]);




    const handleSave = async () => {
        if (!onSave || !hasChanges) {
            return;
        }

        setSaveStatus("saving");

        try {
            await onSave(tree);
            setSaveStatus("saved");
        } catch (error) {
            setSaveStatus("editing");
            throw error;
        }
    };



    

    if (tree.length === 0) {
        return (
            <section className="w-full">
                <CategoryTreeEditorEmpty
                    onStart={addRootCategory}
                />
            </section>
        );
    }

    return (
        <section className="w-full">
            <CategoryTreeEditorHeader
                hasChanges={hasChanges}
                canUndo={canUndo}
                canRedo={canRedo}
                saveStatus={saveStatus}
                onUndo={undo}
                onRedo={redo}
                onSave={handleSave}
            />

            <div className="grid w-full grid-cols-[minmax(0,1fr)_360px] gap-6">
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

                <CategoryTreeEditorForm
                    node={selectedNode}
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