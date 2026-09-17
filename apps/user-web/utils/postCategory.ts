import type { CategoryTree } from "@mall/category-tree";
import type { ProductPostCategory } from "@mall/types";

export interface ProductPostCategoryDiff {
    created: ProductPostCategory[];
    updated: ProductPostCategory[];
    deleted: ProductPostCategory[];
}

// ==========================================
// Item 변환
// ==========================================

/**
 * API Category → CategoryTree
 */
export function toCategoryTreeItem(
    category: ProductPostCategory,
): CategoryTree {
    return {
        id: category.id,
        parentId: category.parentId,

        name: category.name,
        slug: category.slug,

        depth: category.depth,
        displayOrder:
            category.displayOrder,
        isActive: category.isActive,

        isNew: false,
        isDeleted: false,

        children: [],
    };
}

/**
 * CategoryTree → ProductPostCategory
 *
 * 기존 Category인 경우 API 응답에만 존재하는 필드는
 * original에서 유지합니다.
 */
export function toProductPostCategoryItem(
    tree: CategoryTree,
    original?: ProductPostCategory,
): ProductPostCategory {
    return {
        id: tree.id,
        parentId: tree.parentId,

        name: tree.name,
        slug: tree.slug,

        depth: tree.depth,
        displayOrder:
            tree.displayOrder,
        isActive: tree.isActive,

        productPosts:
            original?.productPosts ?? [],

        createdAt:
            original?.createdAt ?? "",
        updatedAt:
            original?.updatedAt ?? "",
    };
}

// ==========================================
// List 변환
// ==========================================

/**
 * ProductPostCategory[] → CategoryTree[]
 */
export function toCategoryTreeList(
    categories: ProductPostCategory[],
): CategoryTree[] {
    const nodeMap = new Map<
        string,
        CategoryTree
    >();

    for (const category of categories) {
        nodeMap.set(
            category.id,
            toCategoryTreeItem(category),
        );
    }

    const roots: CategoryTree[] = [];

    for (const category of categories) {
        const node = nodeMap.get(
            category.id,
        );

        if (!node) {
            continue;
        }

        if (!category.parentId) {
            roots.push(node);
            continue;
        }

        const parent = nodeMap.get(
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

/**
 * CategoryTree[] → ProductPostCategory[]
 *
 * isDeleted인 노드는 제외합니다.
 */
export function toProductPostCategoryList(
    tree: CategoryTree[],
    originalCategories: ProductPostCategory[],
): ProductPostCategory[] {
    const originalMap = new Map(
        originalCategories.map(
            (category) => [
                category.id,
                category,
            ],
        ),
    );

    const result: ProductPostCategory[] = [];

    const walk = (
        nodes: CategoryTree[],
    ) => {
        for (const node of nodes) {
            if (!node.isDeleted) {
                result.push(
                    toProductPostCategoryItem(
                        node,
                        originalMap.get(node.id),
                    ),
                );
            }

            if (node.children.length > 0) {
                walk(node.children);
            }
        }
    };

    walk(tree);

    return result;
}

// ==========================================
// Diff
// ==========================================

/**
 * ProductPostCategory 배열 2개를 비교합니다.
 *
 * originalCategories
 * → 저장 전 서버 상태
 *
 * currentCategories
 * → Editor에서 수정된 현재 상태
 */
export function diffProductPostCategories(
    originalCategories: ProductPostCategory[],
    currentCategories: ProductPostCategory[],
): ProductPostCategoryDiff {
    const originalMap = new Map(
        originalCategories.map(
            (category) => [
                category.id,
                category,
            ],
        ),
    );

    const currentMap = new Map(
        currentCategories.map(
            (category) => [
                category.id,
                category,
            ],
        ),
    );

    const created: ProductPostCategory[] = [];
    const updated: ProductPostCategory[] = [];
    const deleted: ProductPostCategory[] = [];

    // ==========================================
    // CREATE / UPDATE
    // ==========================================

    for (const current of currentCategories) {
        const original =
            originalMap.get(current.id);

        // 원본에 없는 ID
        // → 새 Category
        if (!original) {
            created.push(current);
            continue;
        }

        const changed =
            original.parentId !==
                current.parentId ||
            original.name !== current.name ||
            original.slug !== current.slug ||
            original.depth !== current.depth ||
            original.displayOrder !==
                current.displayOrder ||
            original.isActive !==
                current.isActive;

        if (changed) {
            updated.push(current);
        }
    }

    // ==========================================
    // DELETE
    // ==========================================

    for (const original of originalCategories) {
        if (!currentMap.has(original.id)) {
            deleted.push(original);
        }
    }

    return {
        created,
        updated,
        deleted,
    };
}