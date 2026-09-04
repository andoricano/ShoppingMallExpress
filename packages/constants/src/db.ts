// 백엔드 내부용 DB 테이블, 컬럼명 및 Enum 정의

export const DB_TABLES = {
    INVENTORY_ITEMS: "inventory_items",
    INVENTORY_LOGS: "inventory_logs",

    PRODUCTS: "products",

    PRODUCT_POSTS: "product_posts",
    PRODUCT_POST_PRODUCTS: "product_post_products",

    CATEGORIES: "categories",
    PRODUCT_CATEGORIES: "product_categories",
    WISHLISTS: "wishlists",

    ORDERS: "orders",
    ORDER_ITEMS: "order_items",
} as const;

// 2. 주요 DB 컬럼명 상수 (선택 - 오탈자 방지용) 주석: 자주 쓰이는 PK/FK 및 정렬 컬럼명 상수화
export const DB_COLUMNS = {
    CATEGORIES: {
        CATEGORY_ID: 'category_id',
        PARENT_ID: 'parent_id',
        DISPLAY_ORDER: 'display_order', // 주석: sort_order와 혼동 방지
        DEPTH: 'depth',
    },
    PRODUCT_POSTS: {
        PRODUCT_POST_ID: "product_post_id",
        IS_PUBLISHED: "is_published",
        PUBLISHED_AT: "published_at",
        VIEW_COUNT: "view_count",
    },

    PRODUCT_POST_PRODUCTS: {
        PRODUCT_POST_ID: "product_post_id",
        PRODUCT_ID: "product_id",
        DISPLAY_ORDER: "display_order",
    },
    PRODUCT_CATEGORIES: {
        PRODUCT_ID: 'product_id',
        CATEGORY_ID: 'category_id',
    },
    // [추가] 주문 관련 주요 컬럼명 상수화
    ORDERS: {
        ORDER_ID: 'order_id',
        USER_ID: 'user_id',
        ORDER_STATUS: 'order_status',
        HOLD_EXPIRES_AT: 'hold_expires_at',
    },
    ORDER_ITEMS: {
        ORDER_ITEM_ID: 'order_item_id',
        ORDER_ID: 'order_id',
        PRODUCT_ID: 'product_id',
        OPTION_ID: 'option_id',
        SKU_ID: 'sku_id',
    },
} as const;


// 3. 상품 진열 상태 Enum 상수 주석: 상품 status 값 상수화
export const PRODUCT_STATUS = {
    DISPLAY: 'DISPLAY',   // 진열중
    HIDDEN: 'HIDDEN',     // 숨김
    SOLD_OUT: 'SOLD_OUT', // 품절
    DELETED: 'DELETED',   // 삭제(Soft Delete)
} as const;

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];


// 4. 할인 유형 Enum 상수 주석: 상품 discount_type 값 상수화
export const DISCOUNT_TYPE = {
    FIXED_AMOUNT: 'FIXED_AMOUNT', // 정액 할인
    PERCENTAGE: 'PERCENTAGE',     // 정률 할인
} as const;

export type DiscountType = typeof DISCOUNT_TYPE[keyof typeof DISCOUNT_TYPE];


// 5. 주문 상태 Enum 상수 [추가] 주석: orders의 order_status 값 상수화
export const ORDER_STATUS = {
    PAYMENT_PENDING: 'PAYMENT_PENDING', // 결제 대기
    ORDER_RECEIVED: 'ORDER_RECEIVED',   // 주문 접수
    CANCELLED: 'CANCELLED',             // 취소/만료
    COMPLETED: 'COMPLETED',             // 완료
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];