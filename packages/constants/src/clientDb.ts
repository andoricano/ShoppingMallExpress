// clientDb.ts

// ==========================================
// Client Order DB
// ==========================================

export const CLIENT_ORDER_TABLES = {
    ORDERS: "orders",
    ORDER_ITEMS: "order_items",
} as const;

export const CLIENT_ORDER_COLUMNS = {
    ORDERS: {
        CLIENT_ID: "client_id",
        PAYMENT_ID: "payment_id",
        STATUS: "status",
        TOTAL_PRICE: "total_price",
    },

    ORDER_ITEMS: {
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

// ==========================================
// Client Order API
// ==========================================

export const CLIENT_ORDER_API = {
    BASE: "/api/client/orders",
    DETAIL: (id: string) =>
        `/api/client/orders/${id}`,
} as const;