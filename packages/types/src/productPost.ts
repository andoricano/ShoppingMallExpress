// @/types/productPost.ts

export interface ThumbnailInfo {
    imageUrl: string;
    title: string;
    summary?: string;
    discount: number;
    price: number;
    tags: string[];
}

/**
 * 상품 게시물
 */
export interface ProductPost {
    id: string;

    title: string;

    thumbnail: ThumbnailInfo;

    imageUrls: string[];

    content: string;

    productIds: string[];

    tags: string[];

    isPublished: boolean;

    viewCount: number;

    publishedAt?: string;

    metadata?: Record<string, unknown>;

    createdAt: string;
    updatedAt: string;
}