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

export const DB_COLUMNS = {
    CATEGORIES: {
        CATEGORY_ID: "category_id",
        PARENT_ID: "parent_id",
        DISPLAY_ORDER: "display_order",
        DEPTH: "depth",
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
        PRODUCT_ID: "product_id",
        CATEGORY_ID: "category_id",
    },

    ORDERS: {
        ID: "id",
        CLIENT_ID: "client_id",
        PAYMENT_ID: "payment_id",
        STATUS: "status",
        TOTAL_PRICE: "total_price",
        SHIPPING_ADDRESS: "shipping_address",
        DELIVERY: "delivery",
        CREATED_AT: "created_at",
    },

    ORDER_ITEMS: {
        ID: "id",
        ORDER_ID: "order_id",
        PRODUCT_ID: "product_id",
        INVENTORY_ID: "inventory_id",
        PRODUCT_NAME: "product_name",
        SKU_CODE: "sku_code",
        PRICE: "price",
        QUANTITY: "quantity",
        INVENTORY_META: "inventory_meta",
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

export const ORDER_STATUS = {
    PENDING: "PENDING",
    SHIPPING: "SHIPPING",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
} as const;

export type OrderStatus =
    typeof ORDER_STATUS[
    keyof typeof ORDER_STATUS
    ];