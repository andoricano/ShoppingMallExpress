// hooks/products/useProductEditor.ts

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@mall/types';
import type { JSONContent } from '@tiptap/core';

export function useProductEditor(
    product: Product | null,
) {
    const [form, setForm] = useState<Product | null>(
        product,
    );

    useEffect(() => {
        setForm(product);
    }, [product]);

    const updateField = <K extends keyof Product>(
        key: K,
        value: Product[K],
    ) => {
        setForm((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                [key]: value,
            };
        });
    };

    const updateProduct = (
        product: Product,
    ) => {
        setForm(product);
    };

    const descriptionContent = useMemo<
        JSONContent | undefined
    >(() => {
        if (!form?.description) {
            return undefined;
        }

        try {
            return JSON.parse(
                form.description,
            ) as JSONContent;
        } catch {
            return undefined;
        }
    }, [form?.description]);

    const updateDescription = (
        content: JSONContent,
    ) => {
        updateField(
            'description',
            JSON.stringify(content),
        );
    };

    return {
        form,
        descriptionContent,

        setForm,
        updateField,
        updateProduct,
        updateDescription,
    };
}