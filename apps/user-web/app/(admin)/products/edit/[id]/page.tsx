"use client";

import {
    useEffect,
    useState,
} from "react";
import {
    useParams,
    useRouter,
} from "next/navigation";

import type { Ware } from "@mall/types";

import { AdminMenuItem } from "@/component/common/AdminMenu";
import { ProductAdminHeader } from "@/component/products/ProductAdminHeader";
import { ProductInventorySection } from "@/component/products/add/ProductInventorySection";
import { ProductCreateModal } from "@/component/products/add/ProductCreateModal";
import { ProductPickerModal } from "@/component/products/add/ProductPickerModal";
import { ProductEditModal } from "@/component/products/edit/ProductEditModal";
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
        setPublishStatus,
        deleteProductPost,
    } = useProductPostEdit(productPostId);

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
        inventory: Ware,
    ) => {
        setRegisterWare(inventory);
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
    // 게시 / 비공개 전환
    // ==========================================

    const handleTogglePublish = async () => {
        if (!draftPost) {
            return;
        }

        const next =
            draftPost.status === "PUBLISHED"
                ? "DRAFT"
                : "PUBLISHED";

        const confirmed = window.confirm(
            next === "PUBLISHED"
                ? "이 상품 게시물을 게시(공개)하시겠습니까?"
                : "이 상품 게시물을 비공개로 전환하시겠습니까?",
        );

        if (!confirmed) {
            return;
        }

        await setPublishStatus(next);
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
            menuTitle:
                draftPost?.status === "PUBLISHED"
                    ? "비공개로 전환"
                    : "게시하기",
            onClick: handleTogglePublish,
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

                <p className="text-sm text-slate-600">
                    현재 상태:{" "}
                    <span className="font-semibold">
                        {draftPost.status === "PUBLISHED"
                            ? "공개 (Consumer에 노출)"
                            : "비공개 (초안)"}
                    </span>
                </p>

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
                        onEditProduct={(product) => setEditingProductId(product.id)}
                        onAddExistingProduct={() => setIsProductPickerOpen(true)}
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
