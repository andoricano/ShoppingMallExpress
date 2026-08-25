// src/constants/api.ts

export const API_ENDPOINTS = {
    INVENTORY: {
        BASE: '/api/inventory-items',
        LOGS: '/api/inventory-items/logs',
        ADJUST: '/api/inventory-items/adjust',
        BY_UUID: (uuid: string) => `/api/inventory-items/${uuid}`, // BY_ID -> BY_UUID 수정
    },
    PRODUCTS: {
        CLIENT: '/api/products/client',
        ADMIN: '/api/products/admin',
        BY_ID: (id: string) => `/api/products/${id}`,
    },
} as const;