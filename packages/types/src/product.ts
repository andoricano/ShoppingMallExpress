// @/types/product.ts

/**
 * 상품
 */
export interface Product {
    id: string;
    name: string;

    mainImageUrl: string;
    imageUrls: string[];
    description: string;

    price: number;

    isActive: boolean;
    isVisible: boolean;

    itemIds: string[];

    createdAt: string;
    updatedAt: string;
}