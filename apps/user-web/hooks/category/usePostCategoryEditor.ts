"use client";

import { ProductPostCategory, ProductPostCategoryItem } from "@mall/types";
import { useEffect, useMemo, useState } from "react";


function cloneCategories(
    categories: ProductPostCategory[],
): ProductPostCategory[] {
    return categories.map((category) => ({
        ...category,
        productPosts: category.productPosts
            ? [...category.productPosts]
            : [],
    }));
}

function getCategoryPostIds(
    category: ProductPostCategory,
): string[] {
    return (category.productPosts ?? [])
        .map((post) => post.id)
        .sort();
}

function areCategoriesEqual(
    a: ProductPostCategory[],
    b: ProductPostCategory[],
): boolean {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i += 1) {
        const aCategory = a[i];
        const bCategory = b[i];

        if (aCategory.id !== bCategory.id) {
            return false;
        }

        const aPostIds = getCategoryPostIds(aCategory);
        const bPostIds = getCategoryPostIds(bCategory);

        if (aPostIds.length !== bPostIds.length) {
            return false;
        }

        for (let j = 0; j < aPostIds.length; j += 1) {
            if (aPostIds[j] !== bPostIds[j]) {
                return false;
            }
        }
    }

    return true;
}

export function usePostCategoryEditor(
    categories: ProductPostCategory[],
) {
    const [draftCategories, setDraftCategories] = useState<
        ProductPostCategory[]
    >(() => cloneCategories(categories));

    const [selectedCategoryId, setSelectedCategoryId] =
        useState<string | null>(null);

    // 외부에서 새 카테고리 데이터를 받아오면
    // 현재 편집 상태를 새 데이터 기준으로 초기화합니다.
    useEffect(() => {
        setDraftCategories(cloneCategories(categories));

        setSelectedCategoryId((currentId) => {
            if (
                currentId &&
                categories.some(
                    (category) => category.id === currentId,
                )
            ) {
                return currentId;
            }

            return null;
        });
    }, [categories]);

    const selectedCategory = useMemo(() => {
        if (!selectedCategoryId) {
            return null;
        }

        return (
            draftCategories.find(
                (category) =>
                    category.id === selectedCategoryId,
            ) ?? null
        );
    }, [draftCategories, selectedCategoryId]);

    const selectedPostIds = useMemo(() => {
        return (
            selectedCategory?.productPosts?.map(
                (post) => post.id,
            ) ?? []
        );
    }, [selectedCategory]);

    const isDirty = useMemo(() => {
        return !areCategoriesEqual(
            categories,
            draftCategories,
        );
    }, [categories, draftCategories]);

    const selectCategory = (categoryId: string | null) => {
        setSelectedCategoryId(categoryId);
    };

    const addPostToCategory = (
        categoryId: string,
        post: ProductPostCategoryItem,
    ) => {
        setDraftCategories((current) =>
            current.map((category) => {
                if (category.id !== categoryId) {
                    return category;
                }

                const currentPosts = category.productPosts ?? [];

                if (
                    currentPosts.some(
                        (currentPost) =>
                            currentPost.id === post.id,
                    )
                ) {
                    return category;
                }

                return {
                    ...category,
                    productPosts: [
                        ...currentPosts,
                        post,
                    ],
                };
            }),
        );
    };

    const removePostFromCategory = (
        categoryId: string,
        postId: string,
    ) => {
        setDraftCategories((current) =>
            current.map((category) => {
                if (category.id !== categoryId) {
                    return category;
                }

                return {
                    ...category,
                    productPosts: (
                        category.productPosts ?? []
                    ).filter(
                        (post) => post.id !== postId,
                    ),
                };
            }),
        );
    };

    const togglePostInCategory = (
        categoryId: string,
        post: ProductPostCategoryItem,
    ) => {
        const category = draftCategories.find(
            (item) => item.id === categoryId,
        );

        if (!category) {
            return;
        }

        const exists = (
            category.productPosts ?? []
        ).some(
            (currentPost) =>
                currentPost.id === post.id,
        );

        if (exists) {
            removePostFromCategory(
                categoryId,
                post.id,
            );
            return;
        }

        addPostToCategory(categoryId, post);
    };

    const reset = () => {
        setDraftCategories(
            cloneCategories(categories),
        );
    };

    return {
        draftCategories,

        selectedCategoryId,
        selectedCategory,
        selectedPostIds,

        isDirty,

        selectCategory,

        addPostToCategory,
        removePostFromCategory,
        togglePostInCategory,

        reset,
    };
}