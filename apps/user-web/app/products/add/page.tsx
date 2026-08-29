"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { AdminMenuItem } from "@/component/common/AdminMenu";

import { InventoryList } from "@/component/products/add/InventoryList";
import { InventoryInspector } from "@/component/products/add/InventoryInspector";
import { ProductsTable } from "@/component/products/add/ProductsTable";
import { InventorySearchBar } from "@/component/products/add/InventorSearchBar";

import type { SkuInventory } from "@mall/types";
import { useProductAdd } from "@/hooks/products/useProductAdd";

export default function ProductAddPage() {
    const router = useRouter();

    const {
        inventoryList,
        selectedInventory,
        productList,

        loadingInventory,
        loadingProducts,
        error,

        fetchInventories,
        selectInventory,
        fetchProducts,
    } = useProductAdd();

    useEffect(() => {
        fetchInventories();
        fetchProducts();
    }, [fetchInventories, fetchProducts]);

    const menu: AdminMenuItem[] = [
        {
            menuTitle: "상품 목록",
            onClick: () => router.push("/products"),
        },
        {
            menuTitle: "상품 등록",
            onClick: () => router.push("/products/add"),
        },
        {
            menuTitle: "비활성화 목록",
            onClick: () => router.push("/products/inactive"),
        },
    ];

    const handleInventorySearch = (value: string) => {
        fetchInventories({
            search: value,
        });
    };

    const handleInventoryReset = () => {
        fetchInventories();
    };

    const handleRegisterProduct = (inventory: SkuInventory) => {
        router.push(`/products/add/${inventory.id}`);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-[1800px] mx-auto space-y-6">
                <ProductAdminHeader menu={menu} />

                {error && (
                    <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="font-semibold">
                            ⚠️ 오류 발생:
                        </span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(400px,1fr)_minmax(500px,1.5fr)] gap-5 items-start">
                    {/* Left: Inventory */}
                    <section className="space-y-3">
                        <InventorySearchBar
                            onSearch={handleInventorySearch}
                            onReset={handleInventoryReset}
                        />

                        <InventoryList
                            items={inventoryList}
                            selectedId={selectedInventory?.id}
                            isLoading={loadingInventory}
                            onSelect={selectInventory}
                        />
                    </section>

                    {/* Center: Inventory Inspector */}
                    <section>
                        <InventoryInspector
                            inventory={selectedInventory}
                            onRegister={handleRegisterProduct}
                        />
                    </section>

                    {/* Right: Products */}
                    <section>
                        <ProductsTable
                            products={productList}
                            isLoading={loadingProducts}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}