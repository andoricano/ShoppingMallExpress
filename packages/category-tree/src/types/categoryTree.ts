// packages/category-tree/src/types/categoryTree.ts

export interface CategoryTree {
    id: string;

    parentId: string | null;

    name: string;

    depth: number;

    children: CategoryTree[];
}