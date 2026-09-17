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
    removeCategory,
    updateCategory,
} from "../utils/categoryUtil";

import { useHistory } from "./useHistory";

export function useCategoryTreeEditor(
    initialTree: CategoryTree[] = [],
) {
    const {
        value: tree,
        set: setTree,
        commit,
        undo,
        redo,
        reset: resetHistory,
        canUndo,
        canRedo,
    } = useHistory<CategoryTree[]>(
        initialTree,
    );

    const [
        selectedId,
        setSelectedId,
    ] = useState<string | null>(
        null,
    );

    // ==========================================
    // 외부 Tree 변경
    // ==========================================

    useEffect(() => {
        resetHistory(initialTree);
        setSelectedId(null);
    }, [
        initialTree,
        resetHistory,
    ]);


    // ==========================================
    // 저장 완료 처리
    // 현재 Tree를 새로운 기준 상태로 지정
    // ==========================================

    const markSaved = useCallback(() => {
        resetHistory(tree);
    }, [tree, resetHistory]);

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
    // 최상위 Category 추가
    //
    // Undo 기록하지 않음
    // ==========================================

    const addRootCategory =
        useCallback(() => {
            const id =
                crypto.randomUUID();

            const root: CategoryTree = {
                id,
                parentId: null,
                name: "새 카테고리",
                slug: `category-${id}`,
                depth: 1,
                displayOrder:
                    tree.length,
                isActive: true,
                isNew: true,
                children: [],
            };

            setTree([
                ...tree,
                root,
            ]);

            setSelectedId(root.id);
        }, [tree, setTree]);

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

                setTree(
                    updateCategory(
                        tree,
                        selectedId,
                        (node) => ({
                            ...node,
                            name,
                        }),
                    ),
                );
            },
            [
                selectedId,
                tree,
                setTree,
            ],
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

            const id =
                crypto.randomUUID();

            const child: CategoryTree = {
                id,
                parentId:
                    selectedNode.id,
                name: "새 카테고리",
                slug: `category-${id}`,
                depth:
                    selectedNode.depth + 1,
                displayOrder:
                    selectedNode.children
                        .length,
                isActive: true,
                isNew: true,
                children: [],
            };

            const nextTree =
                addCategoryChild(
                    tree,
                    selectedNode.id,
                    child,
                );

            commit(nextTree);

            setSelectedId(child.id);
        }, [
            selectedNode,
            tree,
            commit,
        ]);

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

            let nextTree: CategoryTree[];

            if (selectedNode.isNew) {
                nextTree =
                    removeCategory(
                        tree,
                        selectedNode.id,
                    );
            } else {
                nextTree =
                    updateCategory(
                        tree,
                        selectedNode.id,
                        (node) => ({
                            ...node,
                            isDeleted: true,
                        }),
                    );
            }

            commit(nextTree);

            setSelectedId(null);
        }, [
            selectedNode,
            tree,
            commit,
        ]);

    // ==========================================
    // 초기화
    // ==========================================

    const reset = useCallback(() => {
        resetHistory(initialTree);
        setSelectedId(null);
    }, [
        initialTree,
        resetHistory,
    ]);

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

        canUndo,
        canRedo,

        selectCategory,
        updateSelectedName,

        addRootCategory,
        addChildCategory,
        deleteSelectedCategory,

        undo,
        redo,
        reset,
        markSaved,
    };
}