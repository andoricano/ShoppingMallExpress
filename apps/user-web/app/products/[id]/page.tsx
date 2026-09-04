// apps/user-web/app/products/[id]/page.tsx

"use client";

import { useState } from "react";
import type { SkuInventory } from "@mall/types";

import { AdminMenuItem } from "@/component/common/AdminMenu";
import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { useRouter } from "next/navigation";
import { ProductInventorySection } from "@/component/products/add/ProductInventorySection";
import {
    ProductAddForm,
    type ProductAddFormValue,
} from "@/component/products/add/ProductAddForm";

import { ProductInfoSection } from "@/component/products/add/ProductInfoSection";

import { useProductPostEdit } from "@/hooks/products/useProductPostEdit";
import { ProductPostEditor } from "@/component/products/edit/ProductEditor";

interface ProductEditPageProps {
    productPostId: string;
}

export default function ProductEditPage({
    productPostId,
}: ProductEditPageProps) {
    const {
        draftPost,
        draftProducts,

        addProduct,
        updatePost,
        updateProduct,
        removeProduct,
        moveProduct,

        saveProductPost,
        deleteProductPost,

        loading,
        saving,
        error,
    } = useProductPostEdit(productPostId);

    const router = useRouter();


    // ==========================================
    // Product 등록 Modal
    // ==========================================

    const [selectedInventoryId, setSelectedInventoryId] =
        useState<string | null>(null);

    const [isProductModalOpen, setIsProductModalOpen] =
        useState(false);

    const [productForm, setProductForm] =
        useState<ProductAddFormValue>({
            name: "",
            price: 0,
            description: "",
        });

    const handleRegisterProduct = (
        inventory: SkuInventory,
    ) => {
        setSelectedInventoryId(inventory.id);

        setProductForm({
            name: inventory.skuCode,
            price: 0,
            description: "",
        });

        setIsProductModalOpen(true);
    };

    const handleProductSubmit = () => {
        if (!selectedInventoryId) {
            return;
        }

        if (!productForm.name.trim()) {
            return;
        }

        addProduct({
            id: crypto.randomUUID(),

            name: productForm.name.trim(),

            mainImageUrl: "",
            imageUrls: [],

            description: productForm.description,

            price: productForm.price,

            inventoryId: selectedInventoryId,

            createdAt: "",
            updatedAt: "",
        });

        setIsProductModalOpen(false);
        setSelectedInventoryId(null);
    };

    const handleProductCancel = () => {
        setIsProductModalOpen(false);
        setSelectedInventoryId(null);
    };

    // ==========================================
    // 저장 / 삭제
    // ==========================================

    const handleSave = async () => {
        await saveProductPost();


        router.push("/products");
    };

    const handleDelete = async () => {
        await deleteProductPost();
    };

    // ==========================================
    // Header Menu
    // ==========================================

    const menu: AdminMenuItem[] = [
        {
            menuTitle: "수정하기",
            onClick: handleSave,
        },
        {
            menuTitle: "임시저장",
            onClick: handleSave,
        },
        {
            menuTitle: "삭제하기",
            onClick: handleDelete,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-[1800px] space-y-6">
                <ProductAdminHeader menu={menu} />

                {loading && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        상품 게시물을 불러오는 중입니다...
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {draftPost && (
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
                        <ProductInventorySection
                            onRegister={
                                handleRegisterProduct
                            }
                        />

                        <ProductInfoSection
                            post={draftPost}
                            products={draftProducts}
                            onChange={updatePost}
                            onEditProduct={
                                updateProduct
                            }
                            onRemoveProduct={
                                removeProduct
                            }
                            onMoveProduct={
                                moveProduct
                            }
                        />

                        <ProductPostEditor
                            post={draftPost}
                            onChange={updatePost}
                            saving={saving}
                        />
                    </div>
                )}

                {/* Product 등록 Modal */}
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-lg">
                            <ProductAddForm
                                value={productForm}
                                onChange={setProductForm}
                                onSubmit={
                                    handleProductSubmit
                                }
                                onCancel={
                                    handleProductCancel
                                }
                            />
                        </div>
                    </div>
                )}

                {saving && (
                    <div className="fixed bottom-6 right-6 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
                        저장 중입니다...
                    </div>
                )}
            </div>
        </div>
    );
}