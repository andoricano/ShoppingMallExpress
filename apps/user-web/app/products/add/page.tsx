"use client";

import React, { useEffect, useState } from "react";

import { InventoryList } from "@/component/products/add/InventoryList";
import { InventoryInspector } from "@/component/products/add/InventoryInspector";
import { ProductsTable } from "@/component/products/add/ProductsTable";

import type { SkuInventory } from "@mall/types";
import { useProductAdd } from "@/hooks/products/useProductAdd";
import { InventorySearchBar } from "../../../component/products/add/InventorSearchBar";

export default function ProductAddPage() {
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

    const [search, setSearch] = useState("");

    // 초기 데이터 조회
    useEffect(() => {
        fetchInventories();
        fetchProducts();
    }, [fetchInventories, fetchProducts]);

    // Inventory 검색
    const handleInventorySearch = (value: string) => {
        setSearch(value);
        fetchInventories({
            search: value,
        });
    };

    // Inventory 검색 초기화
    const handleInventoryReset = () => {
        setSearch("");
        fetchInventories();
    };

    // 상품 등록 페이지 이동
    const handleRegisterProduct = (inventory: SkuInventory) => {
        // TODO:
        // 선택한 inventory.id를 이용해 상품 등록 Form 페이지로 이동
        console.log("Register product:", inventory);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        상품 등록
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        판매할 Inventory를 선택하고 상품 등록을 진행합니다.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="font-semibold">
                            ⚠️ 오류 발생:
                        </span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Main */}
                <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(400px,1fr)_minmax(500px,1.5fr)] gap-5 items-start">
                    {/* ==========================================
                        Left: Inventory
                    ========================================== */}
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

                    {/* ==========================================
                        Center: Inventory Inspector
                    ========================================== */}
                    <section>
                        <InventoryInspector
                            inventory={selectedInventory}
                            onRegister={handleRegisterProduct}
                        />
                    </section>

                    {/* ==========================================
                        Right: Products
                    ========================================== */}
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