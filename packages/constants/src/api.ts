// src/constants/api.ts

export const API_ENDPOINTS = {

    // ==========================================
    // Config 값 설정 : Master
    // ==========================================
    PAGE_CONFIG: {
        BASE: "/api/page-config",
    },

    // ==========================================
    // 회원 관리 - Admin
    // ==========================================
    USERS: {
        BASE: "/api/users",
    },

    // ==========================================
    // 회원 관리의 일환
    // ==========================================
    CLIENT_HISTORY: {
        BASE: "/api/client/history",
    },
    IMAGES: {
        UPLOAD_URL: "/api/images/upload-url",
    },
    // ==========================================
    // 환불
    // ==========================================
    REFUNDS: {
        BASE: "/api/admin/refunds",

        BY_ID: (id: string) =>
            `/api/admin/refunds/${id}`,
    },
    // ==========================================
    // 주문 관리 - Client
    // ==========================================
    CLIENT_ORDERS: {
        BASE: "/api/client/orders",

        BY_ID: (id: string) =>
            `/api/client/orders/${id}`,

        CANCEL: (id: string) =>
            `/api/client/orders/${id}/cancel`,
    },
    CLIENT_REFUNDS: {
        BASE: "/api/client/refunds",
    },

    CLIENT_PAYMENT: {
        POINT_RESERVE:
            "/api/client/payment/point/reserve",
    },
    CLIENT_WISHLIST: {
        BASE: "/api/client/wishlist",
    },
    CLIENT_CART: {
        BASE: "/api/client/cart",
    },
    // ==========================================
    // 재고 관리 - Admin
    // ==========================================
    INVENTORY: {
        BASE: "/api/inventory-items",

        BY_ID: (id: string) =>
            `/api/inventory-items/${id}`,

        STOCK: (id: string) =>
            `/api/inventory-items/${id}/stock`,

        STATUS: (id: string) =>
            `/api/inventory-items/${id}/status`,
    },
    PRODUCT_POSTS: {
        BASE: "/api/admin/product-posts",

        BY_ID: (id: string) =>
            `/api/admin/product-posts/${id}`,

        STATUS: (id: string) =>
            `/api/admin/product-posts/${id}/status`,

        BY_CATEGORY: (categoryId: string) =>
            `/api/admin/product-posts/category/${categoryId}`,
    },

    // ==========================================
    // 상품 게시물 조회 - Client
    // ==========================================
    CLIENT_PRODUCT_POSTS: {
        BASE: "/api/product-posts",

        BY_ID: (id: string) =>
            `/api/product-posts/${id}`,
    },
    CLIENT_POINTS: {
        BASE: "/api/client/points",

        CHARGE:
            "/api/client/points/charge",
    },
    // ==========================================
    // 상품 이미지 / 에셋
    // ==========================================
    ASSETS: {
        UPLOAD: "/api/admin/assets/upload",
    },

    // ==========================================
    // 카테고리 관리
    // ==========================================
    PRODUCT_POST_CATEGORIES: {
        BASE: "/api/admin/product-post-categories",
        BY_ID: (id: string) =>
            `/api/admin/product-post-categories/${id}`,
    },

    // ==========================================
    // 주문 관리 - Admin
    // ==========================================
    ORDERS: {
        BASE: "/api/orders",

        BY_ID: (id: string) =>
            `/api/orders/${id}`,
    },

} as const;