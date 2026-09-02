// apps/user-web/app/products/add/[id]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import type { Product } from "@mall/types";

import { useAdminProducts } from "@/hooks/products/useAdminProduct";
import { ProductEditor } from "@/component/products/edit/ProductEditor";

export default function ProductAddPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const inventoryId = params.id;

    const {
        createProduct,
        loading,
        error,
    } = useAdminProducts();
    const handleCreate = async (
        data: Partial<Product>,
    ): Promise<Product | undefined> => {
        try {
            const product = await createProduct({
                name: data.name ?? "",
                mainImageUrl: data.mainImageUrl ?? "",
                imageUrls: data.imageUrls ?? [],
                description: data.description ?? "",
                price: data.price ?? 0,
                inventoryId,
                isActive: data.isActive ?? false,
            });

            router.push("/products");

            return product;
        } catch {
            return undefined;
        }
    };

    if (error) {
        return (
            <div className="p-6 text-red-500">
                {error}
            </div>
        );
    }

    return (
        <ProductEditor
            mode="create"
            saving={loading}
            onCreate={handleCreate}
        />
    );
}