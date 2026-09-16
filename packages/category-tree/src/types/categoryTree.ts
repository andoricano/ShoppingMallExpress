// packages/category-tree/src/types/categoryTree.ts

export interface CategoryTree {
    id: string;

    parentId: string | null;

    name: string;

    depth: number;

    isLeaf?: boolean;

    isNew?: boolean;
    isDeleted?: boolean;

    children: CategoryTree[];
}