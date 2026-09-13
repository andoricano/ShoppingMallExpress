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

    // ==========================================
    // 상품 게시물 관리 - Admin
    // ==========================================
    PRODUCT_POSTS: {
        BASE: "/api/admin/product-posts",

        BY_ID: (id: string) =>
            `/api/admin/product-posts/${id}`,

        STATUS: (id: string) =>
            `/api/admin/product-posts/${id}/status`,
    },

    // ==========================================
    // 상품 게시물 조회 - Client
    // ==========================================
    CLIENT_PRODUCT_POSTS: {
        BASE: "/api/product-posts",

        BY_ID: (id: string) =>
            `/api/product-posts/${id}`,
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
    CATEGORIES: {
        BASE: "/api/admin/categories",
        TREE: "/api/admin/categories/tree",
        BY_ID: (id: string) =>
            `/api/admin/categories/${id}`,
        REORDER: "/api/admin/categories/reorder",
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