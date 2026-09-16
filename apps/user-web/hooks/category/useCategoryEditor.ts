// hooks/category/useCategoryEditor.ts

"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import type {
    ProductPostCategory,
} from "@mall/types";

const CATEGORY_NAMES = [
    "신상품",
    "베스트",
    "추천",
    "의류",
    "신발",
    "팬츠",
    "셔츠",
    "아우터",
    "액세서리",
    "세일",
];

export function useCategoryEditor(
    initialCategories: ProductPostCategory[] = [],
) {
    // ==========================================
    // 원본 Category
    // ==========================================

    const [
        originalCategories,
        setOriginalCategories,
    ] = useState<ProductPostCategory[]>(
        initialCategories,
    );

    // ==========================================
    // 수정된 Category
    // ==========================================

    const [
        editedCategories,
        setEditedCategories,
    ] = useState<ProductPostCategory[]>(
        initialCategories,
    );

    // ==========================================
    // 외부 데이터 동기화
    // ==========================================

    useEffect(() => {
        setOriginalCategories(
            initialCategories,
        );

        setEditedCategories(
            initialCategories,
        );
    }, [initialCategories]);

    // ==========================================
    // 랜덤 Category 이름
    // ==========================================

    const getRandomCategoryName =
        useCallback(() => {
            const index =
                Math.floor(
                    Math.random() *
                        CATEGORY_NAMES.length,
                );

            return (
                CATEGORY_NAMES[index] ??
                "카테고리"
            );
        }, []);

    // ==========================================
    // Category 이름 수정
    // ==========================================

    const updateCategoryName =
        useCallback(
            (
                categoryId: string,
            ) => {
                setEditedCategories(
                    (current) =>
                        current.map(
                            (category) =>
                                category.id ===
                                categoryId
                                    ? {
                                          ...category,
                                          name: getRandomCategoryName(),
                                      }
                                    : category,
                        ),
                );
            },
            [getRandomCategoryName],
        );

    // ==========================================
    // 특정 Category 조회
    // ==========================================

    const getEditedCategory =
        useCallback(
            (
                categoryId: string,
            ) =>
                editedCategories.find(
                    (category) =>
                        category.id ===
                        categoryId,
                ),
            [editedCategories],
        );

    // ==========================================
    // 변경 여부
    // ==========================================

    const hasChanges =
        originalCategories.some(
            (original) => {
                const edited =
                    editedCategories.find(
                        (category) =>
                            category.id ===
                            original.id,
                    );

                return (
                    edited?.name !==
                    original.name
                );
            },
        );

    // ==========================================
    // 원본으로 되돌리기
    // ==========================================

    const reset = useCallback(() => {
        setEditedCategories(
            originalCategories,
        );
    }, [originalCategories]);

    return {
        originalCategories,
        editedCategories,

        updateCategoryName,
        getEditedCategory,

        hasChanges,
        reset,
    };
}