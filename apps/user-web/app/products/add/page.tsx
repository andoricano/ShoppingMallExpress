"use client";

import { useEffect } from "react";

import { AdminMenuItem } from "@/component/common/AdminMenu";
import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { ProductInventorySection } from "@/component/products/add/ProductInventorySection";
import { ProductPostEditor } from "@/component/products/edit/ProductEditor";

import { useProductPostEditor } from "@/hooks/products/useProductPostEditor";

interface ProductAddPageProps {
    mode: "create" | "edit";
}

export default function ProductAddPage({
    mode,
}: ProductAddPageProps) {
    const {
        productPost,
        products,
        selectedProducts,

        loading,
        saving,
        error,

        fetchProducts,
        fetchProductPost,

        addProduct,
        removeProduct,
        moveProduct,

        createProductPost,
        updateProductPost,
        deleteProductPost,
    } = useProductPostEditor();

    useEffect(() => {
        fetchProducts();

        if (mode === "edit") {
            fetchProductPost();
        }
    }, [
        mode,
        fetchProducts,
        fetchProductPost,
    ]);

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
        if (mode !== "edit") {
            return;
        }

        await deleteProductPost();
    };

    const menu: AdminMenuItem[] = [
        {
            menuTitle:
                mode === "create"
                    ? "게시하기"
                    : "수정하기",
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
                        isLoadingProducts={loading}
                        onRegister={handleRegisterProduct}
                    />

                    <ProductPostEditor
                        mode={mode}
                        productPost={productPost}
                        selectedProducts={selectedProducts}
                        saving={saving}
                        onCreate={createProductPost}
                        onUpdate={updateProductPost}
                    />
                </div>
            </div>
        </div>
    );
}