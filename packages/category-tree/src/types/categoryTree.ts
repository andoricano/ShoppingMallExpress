export interface CategoryTree {
    id: string;

    parentId: string | null;

    name: string;
    slug: string;

    depth: number;
    displayOrder: number;
    isActive: boolean;

    isLeaf?: boolean;

    isNew?: boolean;
    isDeleted?: boolean;

    children: CategoryTree[];
}