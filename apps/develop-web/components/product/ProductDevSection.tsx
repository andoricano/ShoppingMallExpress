// @/components/product/ProductDevSection.tsx
"use client";

import { useState } from "react";
import { DevTabItem, DevTopbar } from "../ui/DevTopbar";
import { useProductAdmin } from "./useProductAdmin";
import { useInventoryDev } from "../inventory/useInventoryDev";
import { ProductOverviewPanel } from "./ProductOverviewPanel";
import { ProductCreatePanel } from "./ProductCreatePanel";
import { ProductCategoryPanel } from "./ProductCategoryPanel";
import { useProductCategory } from "./category/useProductCategory";

// 탭 ID 타입 정의
type TabType = "list" | "create" | "category";

export function ProductDevSection() {
    const [activeTab, setActiveTab] = useState<TabType>("list");

    // 1. Product 어드민 훅 (상품 CRUD 및 일괄 처리)
    const {
        productList,
        pagination,
        loading,
        fetchAdminProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        batchUpdateStatus,
        batchUpdateCategory,
    } = useProductAdmin();

    // 2. Product 카테고리 훅 (카테고리 메타데이터 트리 CRUD) 주석: 카테고리 전용 훅 호출
    const {
        categoryList,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useProductCategory();

    // 3. Inventory 훅 (상품 등록 시 SKU 매핑용 드롭다운 데이터 제공)
    const { inventoryList } = useInventoryDev();

    const navTabs: DevTabItem<TabType>[] = [
        { id: "list", label: `상품 목록 & 일괄 관리 (${productList.length})` },
        { id: "create", label: "신규 상품 등록 (SKU 매핑)" },
        { id: "category", label: "카테고리 트리 관리" },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* 1. 타이틀 영역 */}
            <div>
                <h2 className="text-lg font-bold text-white">
                    Product API & UI Test Section
                </h2>
                <p className="text-sm text-zinc-400">
                    원천 재고(SKU) 기반 상품 등록, 전시 상태, 일괄 변경 및 카테고리 관리 영역입니다.
                </p>
            </div>

            {/* 2. 상단 탭 (공통 컴포넌트 재사용) */}
            <DevTopbar<TabType>
                tabs={navTabs}
                activeTab={activeTab}
                onSelectTab={(tabId) => setActiveTab(tabId)}
            />

            {/* 3. 탭별 메인 콘텐츠 영역 */}
            <div className="grid grid-cols-1 gap-6">
                {/* [TAB 1] 상품 목록, 필터, 수정을 위한 개별/일괄 관리 패널 */}
                {activeTab === "list" && (
                    <ProductOverviewPanel
                        productList={productList}
                        pagination={pagination}
                        loading={loading}
                        onFetchProducts={fetchAdminProducts}
                        onDeleteProduct={deleteProduct}
                        onBatchUpdateStatus={batchUpdateStatus}
                        onBatchUpdateCategory={batchUpdateCategory}
                    />
                )}

                {/* [TAB 2] 원천 재고(inventoryList)를 불러와 매핑하는 상품 등록 패널 */}
                {activeTab === "create" && (
                    <ProductCreatePanel
                        inventoryList={inventoryList} // Inventory SKU 목록 전달
                        onCreateProduct={createProduct}
                    />
                )}

                {/* [TAB 3] 대/중/소 계층형 카테고리 트리 관리 패널 */}
                {activeTab === "category" && (
                    <ProductCategoryPanel
                        categoryList={categoryList}
                        onCreateCategory={createCategory} 
                        onUpdateCategory={updateCategory} 
                        onDeleteCategory={deleteCategory} 
                    />
                )}
            </div>
        </div>
    );
}