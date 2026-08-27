// @/types/product.ts

// ==========================================
// 1. Core Enums & Status
// ==========================================

/** 상품 진열/판매 상태 */
export type ProductStatus = "DISPLAY" | "HIDDEN" | "SOLD_OUT" | "DELETED";

/** 할인 정책 유형 */
export type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";

/** 클라이언트 목록 정렬 옵션 */
export type ProductSortOption = "RECOMMENDED" | "NEWEST" | "POPULAR" | "PRICE_ASC" | "PRICE_DESC";

/** 판매자 알림 유형 */
export type ProductAlertType = "OUT_OF_STOCK" | "LOW_STOCK" | "SALES_SPIKE";


// ==========================================
// 2. Sub Models & Main Entity
// ==========================================

/** 옵션 항목 (원천 재고 SkuInventory.id 매핑) */
export interface ProductOption {
    optionId?: string;           // 수정 시 기존 옵션 식별용
    optionName: string;          // 예: "색상", "사이즈"
    optionValue: string;         // 예: "Red", "250"
    surcharge: number;           // 옵션 추가 금액
    skuId: string;               // Inventory 모듈의 SkuInventory.id
}

/** 상품 마스터 데이터 (Admin & Client Read-Only) */
export interface Product {
    productId: string;
    productName: string;
    mainImageUrl: string;
    subImageUrls: string[];
    description: string;
    status: ProductStatus;
    sortOrder: number;
    
    // 가격 및 할인
    basePrice: number;
    discountedPrice: number;
    discountType?: DiscountType;
    discountValue?: number;
    discountStartDate?: string;
    discountEndDate?: string;

    // 연동 데이터
    options: ProductOption[];
    categoryIds: string[];
    
    createdAt: string;
    updatedAt: string;
}

/** 계층형 카테고리 트리 */
export interface ProductCategory {
    categoryId: string;
    categoryName: string;
    parentId: string | null;
    depth: number;
    displayOrder: number;
    children?: ProductCategory[];
}

/** 판매자 알림 */
export interface ProductAlert {
    alertId: string;
    productId: string;
    productName: string;
    skuId?: string;
    type: ProductAlertType;
    message: string;
    isRead: boolean;
    createdAt: string;
}


// ==========================================
// 3. API Payloads & Filter Params
// ==========================================

/** 상품 등록 Payload */
export interface CreateProductPayload {
    productName: string;
    mainImageUrl: string;
    subImageUrls?: string[];
    description: string;
    status: Extract<ProductStatus, "DISPLAY" | "HIDDEN">;
    sortOrder?: number;
    basePrice: number;
    discountType?: DiscountType;
    discountValue?: number;
    discountStartDate?: string;
    discountEndDate?: string;
    options: ProductOption[];
    categoryIds: string[];
}

/** 상품 수정 Payload */
export type UpdateProductPayload = Partial<CreateProductPayload>;

/** 어드민 일괄 작업 Payload */
export interface BatchUpdatePayload {
    productIds: string[];
    status?: Extract<ProductStatus, "DISPLAY" | "HIDDEN">;
    targetCategoryIds?: string[];
}

/** 카테고리 CUD Payload */
export interface SaveCategoryPayload {
    categoryName: string;
    parentId?: string | null;
    displayOrder?: number;
}

/** 상품 목록 조회 필터 파라미터 */
export interface ProductFilterParams {
    searchQuery?: string;
    status?: ProductStatus;
    categoryId?: string;
    sort?: ProductSortOption;
    page?: number;
    limit?: number;
}