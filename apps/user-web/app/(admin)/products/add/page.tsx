// apps/user-web/app/products/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ware } from "@mall/types";

import { AdminMenuItem } from "@/component/common/AdminMenu";
import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { ProductInventorySection } from "@/component/products/add/ProductInventorySection";
import { ProductCreateModal } from "@/component/products/add/ProductCreateModal";
import { ProductPickerModal } from "@/component/products/add/ProductPickerModal";
import { ProductEditModal } from "@/component/products/edit/ProductEditModal";
import { ProductInfoSection } from "@/component/products/add/ProductInfoSection";
import { ProductPostEditor } from "@/component/products/edit/ProductEditor";

import { useProductPostAdd } from "@/hooks/products/useProductPostAdd";

export default function ProductPostAddPage() {
    const router = useRouter();

    const {
        addProduct,

        draftPost,
        draftProducts,
        updatePost,
        createProductPost,

        removeProduct,
        moveProduct,
        updateProduct,

        saving,
        error,
        thumbnailFile,
        setPendingImages,
        setThumbnailFile,
    } = useProductPostAdd();

    // Ware selected in the inventory panel; the Product itself is created
    // through the Admin server boundary before it joins the ProductPost draft.
    const [registerWare, setRegisterWare] =
        useState<Ware | null>(null);

    // Persisted Product picker / editor (admin_update_product).
    const [isProductPickerOpen, setIsProductPickerOpen] =
        useState(false);
    const [editingProductId, setEditingProductId] =
        useState<string | null>(null);

    // ==========================================
    // Product 등록 Modal
    // ==========================================

    const handleRegisterProduct = (
        inventory: Ware,
    ) => {
        setRegisterWare(inventory);
    };

    // "게시하기" creates a PUBLISHED post; "저장 (비공개)" keeps it a DRAFT.
    const handleSave = async (status: "DRAFT" | "PUBLISHED") => {
        try {
            await createProductPost(status);
            router.replace("/products");
        } catch {
            // Hook에서 error 처리
        }
    };

    // ==========================================
    // Header Menu
    // ==========================================

    const menu: AdminMenuItem[] = [
        {
            menuTitle: "저장 (비공개)",
            onClick: () => handleSave("DRAFT"),
        },
        {
            menuTitle: "게시하기",
            onClick: () => handleSave("PUBLISHED"),
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-[1800px] space-y-6">
                <ProductAdminHeader menu={menu} />

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
                    <ProductInventorySection
                        onRegister={handleRegisterProduct}
                    />

                    <ProductInfoSection
                        post={draftPost}
                        products={draftProducts}
                        onChange={updatePost}
                        onEditProduct={(product) => setEditingProductId(product.id)}
                        onAddExistingProduct={() => setIsProductPickerOpen(true)}
                        onRemoveProduct={removeProduct}
                        onMoveProduct={moveProduct}
                        onThumbnailSelect={setThumbnailFile}
                    />


                    <ProductPostEditor
                        post={draftPost}
                        onChange={updatePost}
                        onImagesChange={setPendingImages}
                        saving={saving}
                    />


                </div>

                {/* Product 등록 Modal */}
                {registerWare && (
                    <ProductCreateModal
                        ware={registerWare}
                        onCreated={(product) => {
                            addProduct(product);
                            setRegisterWare(null);
                        }}
                        onCancel={() => setRegisterWare(null)}
                    />
                )}

                {isProductPickerOpen && (
                    <ProductPickerModal
                        excludeIds={draftProducts.map((product) => product.id)}
                        onSelect={(product) => {
                            addProduct(product);
                            setIsProductPickerOpen(false);
                        }}
                        onClose={() => setIsProductPickerOpen(false)}
                    />
                )}

                {editingProductId && (
                    <ProductEditModal
                        productId={editingProductId}
                        onSaved={(product) => {
                            updateProduct(product);
                            setEditingProductId(null);
                        }}
                        onClose={() => setEditingProductId(null)}
                    />
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
