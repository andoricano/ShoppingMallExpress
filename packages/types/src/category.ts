// @/types/productPostCategory.ts

import type { ThumbnailInfo } from "./productPost.js";

export interface ProductPostCategoryItem {
    id: string;
    thumbnail: ThumbnailInfo;
}

export interface ProductPostCategory {
    id: string;

    parentId: string | null;

    name: string;
    slug: string;

    depth: number;
    displayOrder: number;

    isActive: boolean;

    productPosts: ProductPostCategoryItem[];

    createdAt: string;
    updatedAt: string;
}