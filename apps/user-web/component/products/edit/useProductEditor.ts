// hooks/products/useProductEditor.ts

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@mall/types";
import type { JSONContent } from "@tiptap/core";

type ProductEditorMode = "create" | "edit";

interface UseProductEditorParams {
    mode: ProductEditorMode;
    product?: Product | null;
}

const DEFAULT_PRODUCT: Product = {
    id: "",
    name: "",
    mainImageUrl: "1111111111",
    imageUrls: [],
    description: "",
    price: 0,
    inventoryId: "",
    isActive: true,
    createdAt: "",
    updatedAt: "",
};

export function useProductEditor({
    mode,
    product,
}: UseProductEditorParams) {
    const [form, setForm] = useState<Product>(
        mode === "edit" && product
            ? product
            : DEFAULT_PRODUCT,
    );

    useEffect(() => {
        if (mode === "edit" && product) {
            setForm(product);
            return;
        }

        setForm(DEFAULT_PRODUCT);
    }, [mode, product]);

    const updateField = <K extends keyof Product>(
        key: K,
        value: Product[K],
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateProduct = (product: Product) => {
        setForm(product);
    };

    const descriptionContent = useMemo<
        JSONContent | undefined
    >(() => {
        if (!form.description) {
            return undefined;
        }

        try {
            return JSON.parse(
                form.description,
            ) as JSONContent;
        } catch {
            return undefined;
        }
    }, [form.description]);

    const updateDescription = (
        content: JSONContent,
    ) => {
        updateField(
            "description",
            JSON.stringify(content),
        );
    };

    const validate = (): string | null => {
        if (!form.name.trim()) {
            return "상품명을 입력해주세요.";
        }

        if (form.price < 0) {
            return "가격은 0 이상이어야 합니다.";
        }

        return null;
    };

    return {
        form,
        descriptionContent,

        setForm,
        updateField,
        updateProduct,
        updateDescription,
        validate
    };
}