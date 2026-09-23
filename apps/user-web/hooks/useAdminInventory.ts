"use client";

import { useCallback, useState } from "react";

import type { Ware, Warehouse } from "@mall/types";

export interface WareQuery {
    search?: string;
    isActive?: boolean;
}

export interface CreateWareInput {
    warehouseId: string;
    name: string;
    wareCode?: string;
    wareType?: string;
    currentStock?: number;
    meta?: Record<string, unknown>;
}

export interface UpdateWareInput {
    name?: string;
    wareCode?: string | null;
    wareType?: string;
    isActive?: boolean;
    meta?: Record<string, unknown>;
}

async function adminRequest<T>(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<T> {
    const response = await fetch(input, init);
    const payload = await response.json().catch(() => null) as {
        data?: T;
        message?: string;
    } | null;

    if (!response.ok) {
        throw new Error(payload?.message ?? "Admin request failed.");
    }

    return payload?.data as T;
}

/**
 * Admin-only Ware access. Browser requests are authorized by the Next Route
 * Handler; stock and metadata mutations are delegated to v2 warehouse RPCs.
 */
export function useAdminWare() {
    const [wareList, setWareList] = useState<Ware[]>([]);
    const [warehouseList, setWarehouseList] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWareList = useCallback(async (params?: WareQuery) => {
        setLoading(true);
        setError(null);

        try {
            const query = new URLSearchParams();

            if (params?.search?.trim()) {
                query.set("search", params.search.trim());
            }

            if (params?.isActive !== undefined) {
                query.set("isActive", String(params.isActive));
            }

            const suffix = query.size > 0 ? `?${query}` : "";
            const wares = await adminRequest<Ware[]>(
                `/api/admin/wares${suffix}`,
            );

            setWareList(wares ?? []);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Ware 목록을 불러오지 못했습니다.",
            );
            setWareList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWarehouseList = useCallback(async () => {
        try {
            const warehouses = await adminRequest<Warehouse[]>(
                "/api/admin/warehouses",
            );
            setWarehouseList(warehouses ?? []);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Warehouse 목록을 불러오지 못했습니다.",
            );
            setWarehouseList([]);
        }
    }, []);

    const createWare = useCallback(async (input: CreateWareInput) => {
        setLoading(true);
        setError(null);

        try {
            await adminRequest<string>("/api/admin/wares", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            await fetchWareList();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Ware 생성에 실패했습니다.",
            );
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, [fetchWareList]);

    const updateWare = useCallback(async (
        wareId: string,
        input: UpdateWareInput,
    ) => {
        setLoading(true);
        setError(null);

        try {
            await adminRequest<null>(`/api/admin/wares/${wareId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update", ...input }),
            });
            await fetchWareList();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Ware 수정에 실패했습니다.",
            );
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, [fetchWareList]);

    const adjustWareStock = useCallback(async (
        wareId: string,
        adjustment: number,
    ) => {
        setLoading(true);
        setError(null);

        try {
            await adminRequest<number>(`/api/admin/wares/${wareId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "adjust-stock",
                    adjustment,
                }),
            });
            await fetchWareList();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Ware 재고 조정에 실패했습니다.",
            );
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, [fetchWareList]);

    return {
        wareList,
        warehouseList,
        loading,
        error,
        fetchWareList,
        fetchWarehouseList,
        createWare,
        updateWare,
        adjustWareStock,
    };
}
