// src/constants/api.ts

export const API_ENDPOINTS = {
    INVENTORY: {
        BASE: "/api/inventory-items",
        BY_ID: (id: string) => `/api/inventory-items/${id}`,
        STOCK: (id: string) => `/api/inventory-items/${id}/stock`,
        STATUS: (id: string) => `/api/inventory-items/${id}/status`,
    },

    // ==========================================
    // 상품 관리
    // ==========================================
    PRODUCTS: {
        BASE: '/api/admin/products',
        // GET: 상품 목록 조회
        // POST: 상품 신규 등록

        BY_ID: (id: string) => `/api/admin/products/${id}`,
        // GET: 상품 상세 조회
        // PUT: 상품 정보 수정
        // DELETE: 상품 Soft Delete

        BATCH_STATUS: '/api/admin/products/batch/status',
        // PATCH: 상품 진열 상태 일괄 변경

        BATCH_CATEGORY: '/api/admin/products/batch/category',
        // PATCH: 상품 카테고리 일괄 변경

        BATCH_DELETE: '/api/admin/products/batch',
        // DELETE: 상품 일괄 Soft Delete
    },

    // ==========================================
    // 클라이언트 상품 조회
    // ==========================================
    CLIENT_PRODUCTS: {
        BASE: '/api/products',
        // GET: 클라이언트 상품 목록 조회
    },

    // ==========================================
    // SKU / 원천 재고 조회
    // ==========================================
    SKUS: {
        BASE: '/api/admin/skus',
        // GET: 원천 SKU 검색

        BY_ID: (id: string) => `/api/admin/skus/${id}`,
        // GET: SKU 상세 및 현재 재고 조회
    },

    // ==========================================
    // 상품 이미지 / 에셋
    // ==========================================
    ASSETS: {
        UPLOAD: '/api/admin/assets/upload',
        // POST: 상품 이미지 업로드
    },

    // ==========================================
    // 카테고리 관리
    // ==========================================
    CATEGORIES: {
        BASE: '/api/admin/categories',
        // POST: 카테고리 신규 생성

        TREE: '/api/admin/categories/tree',
        // GET: 전체 카테고리 트리 조회

        BY_ID: (id: string) => `/api/admin/categories/${id}`,
        // PUT: 카테고리 정보 수정
        // DELETE: 카테고리 삭제

        REORDER: '/api/admin/categories/reorder',
        // PATCH: 카테고리 순서 / 계층 일괄 변경
    },
} as const;