import type { JsonObject, ProductDetail } from "./product.js";

export type ProductPostStatus = "DRAFT" | "PUBLISHED";

/** ProductPost content metadata; not a Product price or inventory contract. */
export interface ProductPost {
    id: string;
    title: string;
    slug: string | null;
    summary: string | null;
    content: JsonObject;
    thumbnailUrl: string | null;
    status: ProductPostStatus;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProductPostProduct {
    id: string;
    productPostId: string;
    productId: string;
    displayOrder: number;
    createdAt: string;
}

/** Consumer-safe ProductPost list payload. */
export interface ProductPostSummary {
    id: string;
    title: string;
    slug: string | null;
    summary: string | null;
    thumbnailUrl: string | null;
    publishedAt: string | null;
}

/** Consumer-safe payload returned by get_product_post_detail(). */
export interface ProductPostDetail {
    id: string;
    title: string;
    slug: string | null;
    summary: string | null;
    content: JsonObject;
    thumbnailUrl: string | null;
    publishedAt: string | null;
    categories: ProductPostCategorySummary[];
    products: ProductDetail[];
}

export interface ProductPostCategorySummary {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
}

/**
 * @deprecated Mall v2 ProductPosts use thumbnailUrl and do not own price,
 * discount, tags, or inventory presentation.
 */
export interface ThumbnailInfo {
    imageUrl: string;
    title: string;
    summary?: string;
    discount: number;
    price: number;
    tags: string[];
}
