// @/components/product/ProductCreatePanel.tsx
"use client";

import type { CreateProductPayload, InventoryItem, ProductCategory } from "@mall/types";
import { useState } from "react";
import { ProductInventoryTable } from "./ProductInventoryTable";
import { ProductInputForm } from "./ProductInputForm";

interface ProductCreatePanelProps {
    inventoryList: InventoryItem[]; 
    categoryList?: ProductCategory[]; 
    onCreateProduct: (payload: CreateProductPayload) => Promise<boolean>;
}

export function ProductCreatePanel({
    inventoryList = [],
    categoryList = [],
    onCreateProduct,
}: ProductCreatePanelProps) {
    const [selectedSku, setSelectedSku] = useState<InventoryItem | null>(null);

    // 1. 테이블에서 '>' 또는 '+' 클릭 시 선택 처리
    const handleSelectSku = (item: InventoryItem) => {
        setSelectedSku(item);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* 1. 원천 재고(SKU) 목록 조회 및 선택 테이블 */}
            <ProductInventoryTable
                inventoryList={inventoryList}
                onSelectSku={handleSelectSku}
                onAddSku={handleSelectSku}
            />

            {/* 2. 선택된 SKU 기반 상품 정보 입력 폼 배치 */}
            <ProductInputForm
                selectedSku={selectedSku}
                categoryList={categoryList}
                onCreateProduct={onCreateProduct}
            />
        </div>
    );
}