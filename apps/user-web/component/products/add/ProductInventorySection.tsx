// component/products/add/ProductInventorySection.tsx

"use client";

import { useEffect } from "react";
import type { Ware } from "@mall/types";

import { useProductAdd } from "@/hooks/products/useProductAdd";

import { InventorySearchBar } from "./InventorSearchBar";
import { InventoryList } from "./InventoryList";
import { InventoryInspector } from "./InventoryInspector";

interface ProductInventorySectionProps {
    onRegister: (inventory: Ware) => void;
}

export function ProductInventorySection({
    onRegister,
}: ProductInventorySectionProps) {
    const {
        inventoryList,
        selectedInventory,
        loadingInventory,
        fetchInventories,
        selectInventory,
    } = useProductAdd();

    useEffect(() => {
        fetchInventories();
    }, [fetchInventories]);

    const handleSearch = (value: string) => {
        fetchInventories({
            search: value,
        });
    };

    const handleReset = () => {
        fetchInventories();
    };

    return (
        <section className="space-y-4">
            <InventorySearchBar
                onSearch={handleSearch}
                onReset={handleReset}
            />

            <InventoryList
                items={inventoryList}
                selectedId={selectedInventory?.id}
                isLoading={loadingInventory}
                onSelect={selectInventory}
            />

            <InventoryInspector
                inventory={selectedInventory}
                onRegister={onRegister}
            />
        </section>
    );
}
