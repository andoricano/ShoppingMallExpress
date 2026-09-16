// packages/category-tree/src/hooks/useCategoryTreeEditor.ts

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { CategoryTree } from "../types/categoryTree";

function findCategory(
    nodes: CategoryTree[],
    id: string,
): CategoryTree | null {
    for (const node of nodes) {
        if (node.id === id) {
            return node;
        }

        const found = findCategory(
            node.children,
            id,
        );

        if (found) {
            return found;
        }
    }

    return null;
}

function updateCategory(
    nodes: CategoryTree[],
    id: string,
    updater: (
        node: CategoryTree,
    ) => CategoryTree,
): CategoryTree[] {
    return nodes.map((node) => {
        if (node.id === id) {
            return updater(node);
        }

        if (node.children.length === 0) {
            return node;
        }

        return {
            ...node,
            children: updateCategory(
                node.children,
                id,
                updater,
            ),
        };
    });
}

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

    useEffect(() => {
        setTree(initialTree);
        setSelectedId(null);
    }, [initialTree]);

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

    const selectCategory =
        useCallback(
            (id: string) => {
                setSelectedId(id);
            },
            [],
        );

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
    // ==========================================
    const addChildCategory =
        useCallback(() => {
            if (!selectedId) {
                return;
            }

            const parent =
                findCategory(
                    tree,
                    selectedId,
                );

            if (!parent) {
                return;
            }

            if (parent.depth >= 3) {
                return;
            }

            const child: CategoryTree = {
                id: crypto.randomUUID(),
                parentId: parent.id,
                name: "새 카테고리",
                depth: parent.depth + 1,
                children: [],
            };

            setTree((current) =>
                updateCategory(
                    current,
                    selectedId,
                    (node) => ({
                        ...node,
                        children: [
                            ...node.children,
                            child,
                        ],
                    }),
                ),
            );

            setSelectedId(child.id);
        }, [selectedId, tree]);

    const reset = useCallback(() => {
        setTree(initialTree);
        setSelectedId(null);
    }, [initialTree]);

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

        selectCategory,
        updateSelectedName,
        addChildCategory,

        reset,
    };
}

function getDepth(
    node: CategoryTree,
): number {
    let depth = 1;
    let current = node;

    return depth;
}