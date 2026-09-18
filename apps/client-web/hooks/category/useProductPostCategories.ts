"use client";

import { useEffect } from "react";

import { useProductPostCategoryStore } from "@/store/useProductPostCategoryStore";

export function useProductPostCategories() {
    const categories =
        useProductPostCategoryStore(
            (state) => state.categories,
        );

    const loading =
        useProductPostCategoryStore(
            (state) => state.loading,
        );

    const error =
        useProductPostCategoryStore(
            (state) => state.error,
        );

    const fetchCategories =
        useProductPostCategoryStore(
            (state) => state.fetchCategories,
        );

    useEffect(() => {
        fetchCategories().catch(() => {
        });
    }, [fetchCategories]);

    return {
        categories,
        loading,
        error,
        fetchCategories,
    };
}