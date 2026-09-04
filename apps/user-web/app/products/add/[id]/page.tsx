// apps/user-web/app/products/add/[id]/page.tsx

"use client";

import { useRouter } from "next/navigation";
import type { ProductPost } from "@mall/types";
import { ProductPostEditor } from "@/component/products/edit/ProductEditor";


export default function ProductAddPage() {
    const router = useRouter();

    const handleCreate = async (
        data: Partial<ProductPost>,
    ): Promise<ProductPost | undefined> => {
        try {
            console.log("[ProductPost] create:", data);

            router.push("/products");

            return data as ProductPost;
        } catch {
            return undefined;
        }
    };

    return (
        <ProductPostEditor
            mode="create"
            onCreate={handleCreate}
        />
    );
}