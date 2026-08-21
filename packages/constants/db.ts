// 백엔드 내부용 DB 테이블 및 컬럼명 정의
export const DB_TABLES = {
    // 1. 재고 모듈
    INVENTORY_ITEMS: 'inventory_items',
    INVENTORY_LOGS: 'inventory_logs',

    // 2. 상품 관리 모듈 [추가]
    PRODUCTS: 'products',                       // 상품 마스터
    PRODUCT_OPTIONS: 'product_options',         // 상품 옵션 및 SKU 매핑
    CATEGORIES: 'categories',                   // 카테고리 마스터 (계층형)
    PRODUCT_CATEGORIES: 'product_categories',   // 상품-카테고리 다중 매핑
    WISHLISTS: 'wishlists',                     // 관심상품 (위시리스트)
} as const;