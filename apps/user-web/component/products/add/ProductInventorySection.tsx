"use client";

import { useEffect } from "react";
import type { Product, SkuInventory } from "@mall/types";

import { useProductAdd } from "@/hooks/products/useProductAdd";

import { InventorySearchBar } from "./InventorSearchBar";
import { InventoryList } from "./InventoryList";
import { InventoryInspector } from "./InventoryInspector";
import { ProductsTable } from "./ProductsTable";

interface ProductInventorySectionProps {
    products?: Product[];
    isLoadingProducts?: boolean;
    onRegister: (inventory: SkuInventory) => void;
}

export function ProductInventorySection({
    products = [],
    isLoadingProducts = false,
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

            <ProductsTable
                items={inventoryList}
                products={products}
                isLoading={isLoadingProducts}
            />
        </section>
    );
}