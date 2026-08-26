// @/types/product.ts

import { StockStatus } from "@mall/types"; // 재고 모듈의 StockStatus 재활용 가능

// ==========================================
// 1. 공통 Enum & Status 타입
// ==========================================

/** 상품 진열/판매 상태 (PRD 2.1) */
export type ProductStatus = "DISPLAY" | "HIDDEN" | "SOLD_OUT" | "DELETED";

/** 할인 정책 유형 (PRD 3.6) */
export type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";

/** 클라이언트 목록 정렬 옵션 (PRD 3.2) */
export type ProductSortOption = "RECOMMENDED" | "NEWEST" | "POPULAR" | "PRICE_ASC" | "PRICE_DESC";

/** 판매자 알림 유형 (PRD 3.8) */
export type ProductAlertType = "OUT_OF_STOCK" | "LOW_STOCK" | "SALES_SPIKE";


// ==========================================
// 2. 하위 구성 요소 타입
// ==========================================

/** 상품 가격 및 할인 정보 (PRD 2.1 & 3.6) */
export interface ProductPriceInfo {
    basePrice: number;            // 정상가
    discountedPrice: number;      // 최종 판매가
    discountType?: DiscountType;  // 정액 / 정률
    discountValue?: number;       // 할인 금액 또는 설정 할인율(%)
    discountRate?: number;        // 클라이언트 표기용 최종 할인율 (%)
    discountStartDate?: string;   // 할인 시작 일시 (ISO8601)
    discountEndDate?: string;     // 할인 종료 일시 (ISO8601)
}

/** 옵션 상세 및 SKU 매핑 (PRD 2.1 & 3.1) */
export interface ProductOption {
    optionId: string;
    optionName: string;           // 예: "색상", "사이즈"
    optionValue: string;          // 예: "Black", "250"
    surcharge: number;            // 옵션 추가 금액
    skuId: string;                // Inventory 모듈의 SkuInventory.id 매핑
    stockStatus?: StockStatus;    // [선택] 조인 시 표시할 재고 상태 (IN_STOCK 등)
    currentStock?: number;        // [선택] 조인 시 표시할 현재 재고 수량
}


// ==========================================
// 3. 엔티티 메인 타입
// ==========================================

/** 상품 마스터 데이터 (PRD 2.1) */
export interface Product {
    productId: string;
    productName: string;
    mainImageUrl: string;
    subImageUrls: string[];
    description: string;          // HTML 또는 Markdown
    status: ProductStatus;
    sortOrder: number;            // 진열 우선순위
    price: ProductPriceInfo;
    options: ProductOption[];
    categoryIds: string[];        // 다중 카테고리 매핑 (PRD 3.5)
    isWishlisted?: boolean;       // 구매자 로그인 시 위시리스트 여부 (PRD 3.7)
    createdAt: string;
    updatedAt: string;
}

/** 계층형 카테고리 트리 (PRD 2.2 & 3.5) */
export interface ProductCategory {
    categoryId: string;
    categoryName: string;
    parentId: string | null;      // null일 경우 대분류 (1depth)
    depth: number;                // 1: 대분류, 2: 중분류, 3: 소분류
    displayOrder: number;
    children?: ProductCategory[]; // 트리 구조 표현용
}

/** 관심상품 항목 (PRD 2.2 & 3.7) */
export interface WishlistItem {
    wishlistId: string;
    userId: string;
    productId: string;
    product?: Product;            // 조인된 상품 요약 정보
    createdAt: string;
}

/** 관리자 알림 아이템 (PRD 3.8) */
export interface ProductAlert {
    alertId: string;
    productId: string;
    productName: string;
    skuId?: string;               // SkuInventory.id 참조
    type: ProductAlertType;
    message: string;
    isRead: boolean;
    createdAt: string;
}


// ==========================================
// 4. API Request & Payload 타입
// ==========================================

/** 상품 등록 Payload (PRD 3.1) */
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
    options: Array<{
        optionName: string;
        optionValue: string;
        surcharge: number;
        skuId: string;            // Inventory 모듈의 SkuInventory.id
    }>;
    categoryIds: string[];
}

/** 상품 수정 Payload (PRD 3.3) */
export interface UpdateProductPayload extends Partial<Omit<CreateProductPayload, "options">> {
    options?: Array<{
        optionId?: string;        // 기존 옵션 수정 시 optionId 전달, 신규 추가 시 생략
        optionName: string;
        optionValue: string;
        surcharge: number;
        skuId: string;            // Inventory 모듈의 SkuInventory.id
    }>;
}

/** 어드민 일괄 상태 변경 Payload (PRD 3.2) */
export interface BatchUpdateStatusPayload {
    productIds: string[];
    status: Extract<ProductStatus, "DISPLAY" | "HIDDEN">;
}

/** 어드민 일괄 카테고리 이동 Payload (PRD 3.2) */
export interface BatchUpdateCategoryPayload {
    productIds: string[];
    targetCategoryIds: string[];
}

/** 카테고리 생성 Payload (PRD 3.5) */
export interface CreateCategoryPayload {
    categoryName: string;
    parentId?: string | null;
    displayOrder?: number;
}

/** 카테고리 수정 Payload (PRD 3.5) */
export interface UpdateCategoryPayload {
    categoryName?: string;
    parentId?: string | null;
    displayOrder?: number;
}

/** 관심상품 토글 Payload (PRD 3.7) */
export interface ToggleWishlistPayload {
    productId: string;
}


// ==========================================
// 5. 검색 및 조회 필터 Params 타입
// ==========================================

/** Admin 전용 상품 목록 검색 파라미터 (PRD 3.2) */
export interface AdminProductFilterParams {
    searchQuery?: string;         // 상품명, 상품ID
    status?: ProductStatus;
    categoryId?: string;
    page?: number;
    limit?: number;
}

/** Client 전용 상품 목록 검색 파라미터 (PRD 3.2) */
export interface ClientProductFilterParams {
    categoryId?: string;
    sort?: ProductSortOption;
    page?: number;
    limit?: number;
}