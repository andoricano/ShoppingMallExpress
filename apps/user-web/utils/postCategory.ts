import type { ProductPostCategory } from "@mall/types";
import type { CategoryTree } from "@mall/category-tree";

// ==========================================
// ProductPostCategory[] → CategoryTree[]
// ==========================================

export function toCategoryTree(
    categories: ProductPostCategory[],
): CategoryTree[] {
    const nodeMap = new Map<
        string,
        CategoryTree
    >();

    for (const category of categories) {
        nodeMap.set(category.id, {
            id: category.id,
            parentId: category.parentId,
            name: category.name,
            depth: category.depth,
            children: [],
        });
    }

    const roots: CategoryTree[] = [];

    for (const category of categories) {
        const node =
            nodeMap.get(category.id);

        if (!node) {
            continue;
        }

        if (!category.parentId) {
            roots.push(node);
            continue;
        }

        const parent =
            nodeMap.get(
                category.parentId,
            );

        if (!parent) {
            roots.push(node);
            continue;
        }

        parent.children.push(node);
    }

    return roots;
}

// ==========================================
// CategoryTree → flat list
// ==========================================

export function flattenCategoryTree(
    tree: CategoryTree[],
): CategoryTree[] {
    const result: CategoryTree[] = [];

    const walk = (
        nodes: CategoryTree[],
    ) => {
        for (const node of nodes) {
            result.push(node);

            if (
                node.children.length > 0
            ) {
                walk(node.children);
            }
        }
    };

    walk(tree);

    return result;
}