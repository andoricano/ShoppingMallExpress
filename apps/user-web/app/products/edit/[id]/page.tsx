"use client";

import {
    useEffect,
    useState,
} from "react";
import {
    useParams,
    useRouter,
} from "next/navigation";

import type { SkuInventory } from "@mall/types";

import { AdminMenuItem } from "@/component/common/AdminMenu";
import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { ProductInventorySection } from "@/component/products/add/ProductInventorySection";
import {
    ProductAddForm,
    type ProductAddFormValue,
} from "@/component/products/add/ProductAddForm";
import { ProductInfoSection } from "@/component/products/add/ProductInfoSection";
import { ProductPostEditor } from "@/component/products/edit/ProductEditor";

import { useProductPostEdit } from "@/hooks/products/useProductPostEdit";

export default function ProductPostEditPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const productPostId = params.id;

    const {
        draftPost,
        draftProducts,

        thumbnailFile,
        setThumbnailFile,
        setPendingImages,
        loading,
        saving,
        error,

        fetchProductPost,

        updatePost,
        addProduct,
        updateProduct,
        removeProduct,
        moveProduct,

        saveProductPost,
        deleteProductPost,
    } = useProductPostEdit(productPostId);

    const [
        selectedInventoryId,
        setSelectedInventoryId,
    ] = useState<string | null>(null);

    const [
        isProductModalOpen,
        setIsProductModalOpen,
    ] = useState(false);

    const [productForm, setProductForm] =
        useState<ProductAddFormValue>({
            name: "",
            price: 0,
            description: "",
        });

    // ==========================================
    // 상품 게시물 조회
    // ==========================================

    useEffect(() => {
        if (!productPostId) {
            return;
        }

        fetchProductPost();
    }, [
        productPostId,
        fetchProductPost,
    ]);

    // ==========================================
    // Product 등록 Modal
    // ==========================================

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
    // 게시물 수정
    // ==========================================

    const handleSave = async () => {
        try {
            await saveProductPost();

            router.replace("/products");
        } catch {
            // Hook에서 error 처리
        }
    };

    // ==========================================
    // 게시물 삭제
    // ==========================================

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "이 상품 게시물을 삭제하시겠습니까?",
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteProductPost();

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
            menuTitle: "수정하기",
            onClick: handleSave,
        },
        {
            menuTitle: "삭제하기",
            onClick: handleDelete,
        },
    ];

    // ==========================================
    // Loading
    // ==========================================

    if (loading || !draftPost) {
        return (
            <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-[1800px]">
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        상품 게시물을 불러오는 중입니다...
                    </div>
                </div>
            </div>
        );
    }

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
                        onRegister={
                            handleRegisterProduct
                        }
                    />


                    <ProductInfoSection
                        post={draftPost}
                        products={draftProducts}
                        onChange={updatePost}
                        onThumbnailSelect={setThumbnailFile}
                        onEditProduct={updateProduct}
                        onRemoveProduct={removeProduct}
                        onMoveProduct={moveProduct}
                    />


                    <ProductPostEditor
                        post={draftPost}
                        onChange={updatePost}
                        onImagesChange={setPendingImages}
                        saving={saving}
                    />
                </div>

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