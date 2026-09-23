"use client";

import type { ProductPostCategory } from "@mall/types";
import { useEffect, useMemo, useState } from "react";

export function usePostCategoryEditor(categories: ProductPostCategory[]) {
    const [draftCategories, setDraftCategories] = useState(categories);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    useEffect(() => setDraftCategories(categories), [categories]);
    const selectedCategory = useMemo(() => draftCategories.find((item) => item.id === selectedCategoryId) ?? null, [draftCategories, selectedCategoryId]);
    return {
        draftCategories,
        selectedCategoryId,
        selectedCategory,
        selectedPostIds: [] as string[],
        isDirty: draftCategories.some((item, index) => item.name !== categories[index]?.name),
        selectCategory: setSelectedCategoryId,
        togglePostInCategory: (_categoryId: string, _post: unknown) => undefined,
        addPostToCategory: (_categoryId: string, _post: unknown) => undefined,
        removePostFromCategory: (_categoryId: string, _postId: string) => undefined,
        reset: () => setDraftCategories(categories),
    };
}
