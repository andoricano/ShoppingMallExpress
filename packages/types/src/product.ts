// @/types/product.ts

// ==========================================
// 1. Core Enums
// ==========================================

/** 상품 상태 */
export type ProductStatus =
    | "DISPLAY"
    | "HIDDEN"
    | "SOLD_OUT"
    | "DELETED";

/** 할인 유형 */
export type DiscountType =
    | "FIXED"
    | "PERCENT";

/** 상품 목록 정렬 */
export type ProductSortOption =
    | "RECOMMENDED"
    | "NEWEST"
    | "POPULAR"
    | "PRICE_ASC"
    | "PRICE_DESC";

/** 카테고리 상태 */
export type ProductCategoryStatus =
    | "DISPLAY"
    | "HIDDEN";


// ==========================================
// 2. Domain Models
// ==========================================

/** 상품 옵션 (Inventory SKU 매핑) */
export interface ProductOption {
    optionId?: string;
    optionName: string;
    optionValue: string;
    surcharge: number;
    skuId: string;
}

/** 상품 */
export interface Product {
    productId: string;
    productName: string;
    mainImageUrl: string;
    subImageUrls: string[];
    description: string;
    status: ProductStatus;
    sortOrder: number;

    // 가격 / 할인
    basePrice: number;
    discountedPrice: number;
    discountType?: DiscountType;
    discountValue?: number;
    discountStartDate?: string;
    discountEndDate?: string;

    // 연동
    options: ProductOption[];
    categoryIds: string[];

    createdAt: string;
    updatedAt: string;
}

/** 계층형 카테고리 */
export interface ProductCategory {
    categoryId: string;
    categoryName: string;
    parentId: string | null;
    depth: number;
    sortOrder: number;
    status: ProductCategoryStatus;
    children?: ProductCategory[];
}