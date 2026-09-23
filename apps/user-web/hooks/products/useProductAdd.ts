"use client";
import { useCallback, useState } from "react";
import type { Ware } from "@mall/types";

interface WareSearchParams { search?: string }

export function useProductAdd() {
    const [inventoryList, setInventoryList] = useState<Ware[]>([]);
    const [selectedInventory, setSelectedInventory] = useState<Ware | null>(null);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchInventories = useCallback(async (params?: WareSearchParams) => {
        setLoadingInventory(true); setError(null);
        try {
            const query = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
            const response = await fetch(`/api/admin/wares${query}`);
            const result = await response.json().catch(() => null);
            if (!response.ok) throw new Error(result?.message ?? "Ware를 불러오지 못했습니다.");
            setInventoryList(Array.isArray(result?.data) ? result.data : []);
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Ware를 불러오지 못했습니다."); setInventoryList([]); }
        finally { setLoadingInventory(false); }
    }, []);
    const selectInventory = useCallback((ware: Ware) => { setSelectedInventory(ware); setError(null); }, []);
    const clearSelectedInventory = useCallback(() => setSelectedInventory(null), []);
    return { inventoryList, selectedInventory, loadingInventory, error, fetchInventories, selectInventory, clearSelectedInventory };
}
