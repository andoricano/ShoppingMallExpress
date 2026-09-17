import type { CategoryTree } from "../types/categoryTree";

export function findCategory(
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

export function updateCategory(
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

export function addCategoryRoot(
    nodes: CategoryTree[],
    category: CategoryTree,
): CategoryTree[] {
    return [
        ...nodes,
        category,
    ];
}

export function addCategoryChild(
    nodes: CategoryTree[],
    parentId: string,
    child: CategoryTree,
): CategoryTree[] {
    return updateCategory(
        nodes,
        parentId,
        (parent) => ({
            ...parent,
            children: [
                ...parent.children,
                child,
            ],
        }),
    );
}

export function removeCategory(
    nodes: CategoryTree[],
    id: string,
): CategoryTree[] {
    return nodes
        .filter(
            (node) => node.id !== id,
        )
        .map((node) => ({
            ...node,
            children:
                removeCategory(
                    node.children,
                    id,
                ),
        }));
}

export function flattenCategoryTree(
    nodes: CategoryTree[],
): CategoryTree[] {
    const result: CategoryTree[] = [];

    const walk = (
        currentNodes: CategoryTree[],
    ) => {
        for (const node of currentNodes) {
            result.push(node);

            if (node.children.length > 0) {
                walk(node.children);
            }
        }
    };

    walk(nodes);

    return result;
}