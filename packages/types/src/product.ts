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

    inventoryId: string;

    isActive: boolean;

    createdAt: string;
    updatedAt: string;
}