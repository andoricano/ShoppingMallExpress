// @/types/product.ts

// ==========================================
// 1. 공통 Enum & Status 타입
// ==========================================

/** 상품 진열/판매 상태 (PRD 2.1) */
export type ProductStatus = "DISPLAY" | "HIDDEN" | "SOLD_OUT" | "DELETED";

/** 할인 정책 유형 (PRD 3.6) */
export type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";

/** 클라이언트 목록 정렬 옵션 (PRD 3.2) */
export type ProductSortOption = "RECOMMENDED" | "NEWEST" | "POPULAR" | "PRICE_ASC" | "PRICE_DESC";


// ==========================================
// 2. 하위 구성 요소 타입
// ==========================================

/** 상품 가격 및 할인 정보 (PRD 2.1 & 3.6) */
export interface ProductPriceInfo {
    basePrice: number;            // 정상가
    discountedPrice: number;      // 최종 판매가
    discountType?: DiscountType;  // 정액 / 정률
    discountValue?: number;       // 할인 금액 또는 할인율(%)
    discountStartDate?: string;   // 할인 시작 일시 (ISO8601)
    discountEndDate?: string;     // 할인 종료 일시 (ISO8601)
}

/** 옵션 상세 및 SKU 매핑 (PRD 2.1 & 3.1) */
export interface ProductOption {
    optionId: string;
    optionName: string;           // 예: "색상", "사이즈"
    optionValue: string;          // 예: "Black", "XL"
    surcharge: number;            // 옵션 추가 금액
    skuId: string;                // Inventory 모듈의 skuId와 연결되는 외래키
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
    children?: ProductCategory[];  // 트리 구조 표현용
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
        skuId: string;            // Inventory 모듈의 원천 SKU 필수 지정
    }>;
    categoryIds: string[];
}

/** 상품 수정 Payload (PRD 3.3) */
export type UpdateProductPayload = Partial<CreateProductPayload>;

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