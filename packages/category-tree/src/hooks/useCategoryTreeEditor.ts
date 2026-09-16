// packages/category-tree/src/hooks/useCategoryTreeEditor.ts

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { CategoryTree } from "../types/categoryTree";

import {
    addCategoryChild,
    findCategory,
    updateCategory,
} from "../utils/categoryUtil";

export function useCategoryTreeEditor(
    initialTree: CategoryTree[] = [],
) {
    const [
        tree,
        setTree,
    ] = useState<CategoryTree[]>(
        initialTree,
    );

    const [
        selectedId,
        setSelectedId,
    ] = useState<string | null>(
        null,
    );

    const [
        undoStack,
        setUndoStack,
    ] = useState<CategoryTree[][]>(
        [],
    );

    const [
        redoStack,
        setRedoStack,
    ] = useState<CategoryTree[][]>(
        [],
    );

    useEffect(() => {
        setTree(initialTree);
        setSelectedId(null);
        setUndoStack([]);
        setRedoStack([]);
    }, [initialTree]);

    // ==========================================
    // Selected Category
    // ==========================================

    const selectedNode = useMemo(
        () => {
            if (!selectedId) {
                return null;
            }

            return findCategory(
                tree,
                selectedId,
            );
        },
        [tree, selectedId],
    );

    // ==========================================
    // Category 선택
    // ==========================================

    const selectCategory =
        useCallback(
            (id: string) => {
                setSelectedId(id);
            },
            [],
        );

    // ==========================================
    // 이름 수정
    //
    // Undo / Redo 기록하지 않음
    // ==========================================

    const updateSelectedName =
        useCallback(
            (name: string) => {
                if (!selectedId) {
                    return;
                }

                setTree((current) =>
                    updateCategory(
                        current,
                        selectedId,
                        (node) => ({
                            ...node,
                            name,
                        }),
                    ),
                );
            },
            [selectedId],
        );

    // ==========================================
    // 하위 Category 추가
    //
    // Undo 기록
    // ==========================================

    const addChildCategory =
        useCallback(() => {
            if (!selectedNode) {
                return;
            }

            if (selectedNode.depth >= 3) {
                return;
            }

            const child: CategoryTree = {
                id: crypto.randomUUID(),
                parentId: selectedNode.id,
                name: "새 카테고리",
                depth:
                    selectedNode.depth + 1,
                isNew: true,
                children: [],
            };

            setUndoStack((current) => [
                ...current,
                tree,
            ]);

            setRedoStack([]);

            const nextTree =
                addCategoryChild(
                    tree,
                    selectedNode.id,
                    child,
                );

            setTree(nextTree);
            setSelectedId(child.id);
        }, [selectedNode, tree]);

    // ==========================================
    // Category 삭제
    //
    // 기존 Category:
    //   isDeleted = true
    //
    // 새 Category:
    //   Tree에서 제거
    //
    // Undo 기록
    // ==========================================

    const deleteSelectedCategory =
        useCallback(() => {
            if (!selectedNode) {
                return;
            }

            setUndoStack((current) => [
                ...current,
                tree,
            ]);

            setRedoStack([]);

            if (selectedNode.isNew) {
                const parent =
                    findCategory(
                        tree,
                        selectedNode.parentId ??
                        "",
                    );

                if (!parent) {
                    return;
                }

                setTree((current) =>
                    updateCategory(
                        current,
                        parent.id,
                        (node) => ({
                            ...node,
                            children:
                                node.children.filter(
                                    (child) =>
                                        child.id !==
                                        selectedNode.id,
                                ),
                        }),
                    ),
                );

                setSelectedId(null);

                return;
            }

            setTree((current) =>
                updateCategory(
                    current,
                    selectedNode.id,
                    (node) => ({
                        ...node,
                        isDeleted: true,
                    }),
                ),
            );

            setSelectedId(null);
        }, [selectedNode, tree]);

    // ==========================================
    // Undo
    // ==========================================

    const undo = useCallback(() => {
        const previous =
            undoStack.at(-1);

        if (!previous) {
            return;
        }

        setUndoStack((current) =>
            current.slice(0, -1),
        );

        setRedoStack((current) => [
            tree,
            ...current,
        ]);

        setTree(previous);
        setSelectedId(null);
    }, [undoStack, tree]);

    // ==========================================
    // Redo
    // ==========================================

    const redo = useCallback(() => {
        const next =
            redoStack[0];

        if (!next) {
            return;
        }

        setRedoStack((current) =>
            current.slice(1),
        );

        setUndoStack((current) => [
            ...current,
            tree,
        ]);

        setTree(next);
        setSelectedId(null);
    }, [redoStack, tree]);

    // ==========================================
    // 초기화
    // ==========================================

    const reset = useCallback(() => {
        setTree(initialTree);
        setSelectedId(null);
        setUndoStack([]);
        setRedoStack([]);
    }, [initialTree]);

    // ==========================================
    // 변경 여부
    // ==========================================

    const hasChanges = useMemo(
        () =>
            JSON.stringify(tree) !==
            JSON.stringify(
                initialTree,
            ),
        [tree, initialTree],
    );

    return {
        tree,
        selectedId,
        selectedNode,

        hasChanges,

        canUndo:
            undoStack.length > 0,

        canRedo:
            redoStack.length > 0,

        selectCategory,
        updateSelectedName,
        addChildCategory,
        deleteSelectedCategory,

        undo,
        redo,
        reset,
    };
}