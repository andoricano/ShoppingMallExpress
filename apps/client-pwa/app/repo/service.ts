// app/repositories/inventory.repository.ts

import type {
    CreateInventoryInput,
    SkuInventory,
} from "@mall/types";


export const API_BASE_URL = 'https://shopping-ex-kz5p4lagfq-du.a.run.app';

type UpdateInventoryInput = Partial<
    Pick<SkuInventory, "skuCode" | "isActive" | "meta">
>;

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
    item: CreateInventoryInput,
): Promise<SkuInventory> => {
    return request<SkuInventory>(
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
export const getInventoryItems = async (): Promise<SkuInventory[]> => {
    return request<SkuInventory[]>(
        `${API_BASE_URL}/api/inventory-items`,
        {
            method: 'GET',
        },
    );
};

/**
 * InventoryItem 수정
 */
export const updateInventoryItem = async (
    id: string,
    update: UpdateInventoryInput,
): Promise<SkuInventory | null> => {
    try {
        return await request<SkuInventory>(
            `${API_BASE_URL}/api/inventory-items/${id}`,
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
    id: string,
): Promise<void> => {
    await request<void>(
        `${API_BASE_URL}/api/inventory-items/${id}`,
        {
            method: 'DELETE',
        },
    );
};
