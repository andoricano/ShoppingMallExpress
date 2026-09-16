// @/types/productPost.ts

export interface ThumbnailInfo {
    imageUrl: string;
    title: string;
    summary?: string;

    // 할인 적용 후 최종 판매 가격
    // (discountPrice 의미로 사용)
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

    isPublished: boolean;

    viewCount: number;

    publishedAt?: string;

    metadata?: Record<string, unknown>;

    createdAt: string;
    updatedAt: string;
}