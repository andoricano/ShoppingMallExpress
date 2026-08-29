// src/constants/api.ts

export const API_ENDPOINTS = {
    // ==========================================
    // 재고 관리
    // ==========================================
    INVENTORY: {
        BASE: "/api/inventory-items",
        BY_ID: (id: string) => `/api/inventory-items/${id}`,
        STOCK: (id: string) => `/api/inventory-items/${id}/stock`,
        STATUS: (id: string) => `/api/inventory-items/${id}/status`,
    },

    // ==========================================
    // 상품 관리 - Admin
    // ==========================================
    PRODUCTS: {
        BASE: "/api/admin/products",
        // GET: 상품 목록 조회 / 검색
        // POST: 상품 신규 등록

        BY_ID: (id: string) => `/api/admin/products/${id}`,
        // GET: 상품 상세 조회
        // PATCH: 상품 정보 수정
        // DELETE: 비활성 상품 삭제

        STATUS: (id: string) => `/api/admin/products/${id}/status`,
        // PATCH: 상품 활성 / 비활성
    },

    // ==========================================
    // 상품 조회 - Client
    // ==========================================
    CLIENT_PRODUCTS: {
        BASE: "/api/products",
        // GET: 활성 상품 목록 조회
    },

    // ==========================================
    // SKU / 원천 재고 조회
    // ==========================================
    SKUS: {
        BASE: "/api/admin/skus",
        BY_ID: (id: string) => `/api/admin/skus/${id}`,
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
        BY_ID: (id: string) => `/api/admin/categories/${id}`,
        REORDER: "/api/admin/categories/reorder",
    },
} as const;