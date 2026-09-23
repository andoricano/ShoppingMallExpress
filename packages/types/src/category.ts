export interface ProductPostCategory {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductPostCategoryLink {
    id: string;
    productPostId: string;
    categoryId: string;
    displayOrder: number;
    createdAt: string;
}

/**
 * @deprecated Mall v2 categories are flat ProductPost classification records.
 * parentId, depth, and embedded thumbnail fields are legacy UI concerns.
 */
export interface ProductPostCategoryItem {
    id: string;
}

/** @deprecated Use ProductPostCategory. */
export interface ClientCategory extends ProductPostCategory {}
