"use client";

import { useEffect } from "react";

import { AdminMenuItem } from "@/component/common/AdminMenu";
import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { ProductInventorySection } from "@/component/products/add/ProductInventorySection";

import { useProductPostEditor } from "@/hooks/products/useProductPostEditor";
import { ProductPostEditor } from "@/component/products/edit/ProductEditor";

interface ProductAddPageProps {
    mode: "create" | "edit";
}

export default function ProductAddPage({
    mode,
}: ProductAddPageProps) {
    const {
        products,
        loading: loadingProducts,
        saving,
        error,

        fetchProducts,
    } = useProductPostEditor();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleRegisterProduct = () => {
        // Inventory 선택 후 Product 등록 로직 연결 예정
    };

    const handleSave = async () => {
        // ProductPost 저장 로직 연결 예정
    };

    const handleTemporarySave = async () => {
        // ProductPost 임시저장 로직 연결 예정
    };

    const handleDelete = async () => {
        // ProductPost 삭제 로직 연결 예정
    };

    const menu: AdminMenuItem[] = [
        {
            menuTitle: mode === "create" ? "게시하기" : "수정하기",
            onClick: handleSave,
        },
        {
            menuTitle: "임시저장",
            onClick: handleTemporarySave,
        },
        ...(mode === "edit"
            ? [
                {
                    menuTitle: "삭제하기",
                    onClick: handleDelete,
                },
            ]
            : []),
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-[1800px] space-y-6">
                <ProductAdminHeader menu={menu} />

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        <span className="font-semibold">
                            ⚠️ 오류 발생:
                        </span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_3fr]">
                    <ProductInventorySection
                        products={products}
                        isLoadingProducts={loadingProducts}
                        onRegister={handleRegisterProduct}
                    />

                    {/* 중앙 + 우측 */}
                    <ProductPostEditor
                        mode={mode}
                    />
                </div>

                {saving && (
                    <div className="text-sm text-slate-500">
                        저장 중입니다...
                    </div>
                )}
            </div>
        </div>
    );
}