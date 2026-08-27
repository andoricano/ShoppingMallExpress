// src/constants/api.ts

export const API_ENDPOINTS = {
    INVENTORY: {
        BASE: '/api/inventory-items',
        LOGS: '/api/inventory-items/logs',
        ADJUST: '/api/inventory-items/adjust',
        BY_UUID: (uuid: string) => `/api/inventory-items/${uuid}`,
    },
    PRODUCTS: {
        BASE: '/api/products',                            // POST: 상품 생성
        CLIENT: '/api/products/client',                  // GET: 클라이언트 상품 목록
        ADMIN: '/api/products/admin',                    // GET: 어드민 상품 목록
        BATCH_STATUS: '/api/products/admin/batch-status',// PATCH: 진열 상태 일괄 변경
        BATCH_CATEGORY: '/api/products/admin/batch-category', // PATCH: 카테고리 일괄 이동
        ALERTS: '/api/products/admin/alerts',            // GET: 상품 알림 목록
        BY_ID: (id: string) => `/api/products/${id}`,   // GET, PATCH, DELETE: 단일 상품
    },
} as const;