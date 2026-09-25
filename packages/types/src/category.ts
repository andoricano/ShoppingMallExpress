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
