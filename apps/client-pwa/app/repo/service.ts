// app/repositories/inventory.repository.ts

import type { InventoryItem } from '../types/Store';

export const API_BASE_URL = 'https://shopping-ex-kz5p4lagfq-du.a.run.app';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

/**
 * 공통 API 요청
 */
async function request<T>(
    url: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const result = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !result.success) {
        throw new Error(
            result.error ||
            result.message ||
            `Request failed: ${response.status}`,
        );
    }

    return result.data;
}

/**
 * InventoryItem 생성
 */
export const createInventoryItem = async (
    item: InventoryItem,
): Promise<InventoryItem> => {
    return request<InventoryItem>(
        `${API_BASE_URL}/api/inventory-items`,
        {
            method: 'POST',
            body: JSON.stringify(item),
        },
    );
};

/**
 * InventoryItem 전체 조회
 */
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    return request<InventoryItem[]>(
        `${API_BASE_URL}/api/inventory-items`,
        {
            method: 'GET',
        },
    );
};

/**
 * InventoryItem 단일 조회
 */
export const getInventoryItem = async (
    uuid: string,
): Promise<InventoryItem | null> => {
    try {
        return await request<InventoryItem>(
            `${API_BASE_URL}/api/inventory-items/${uuid}`,
            {
                method: 'GET',
            },
        );
    } catch {
        return null;
    }
};

/**
 * InventoryItem 수정
 */
export const updateInventoryItem = async (
    uuid: string,
    update: Partial<InventoryItem>,
): Promise<InventoryItem | null> => {
    try {
        return await request<InventoryItem>(
            `${API_BASE_URL}/api/inventory-items/${uuid}`,
            {
                method: 'PATCH',
                body: JSON.stringify(update),
            },
        );
    } catch {
        return null;
    }
};

/**
 * InventoryItem 삭제
 */
export const deleteInventoryItem = async (
    uuid: string,
): Promise<InventoryItem | null> => {
    try {
        return await request<InventoryItem>(
            `${API_BASE_URL}/api/inventory-items/${uuid}`,
            {
                method: 'DELETE',
            },
        );
    } catch {
        return null;
    }
};