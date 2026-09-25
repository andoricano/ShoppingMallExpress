"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
    ProductPostCategory,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";

type ProductPostCategoryRow = {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

function toProductPostCategory(
    row: ProductPostCategoryRow,
): ProductPostCategory {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// 10분
const CATEGORY_CACHE_TTL =
    10 * 60 * 1000;

interface ProductPostCategoryState {
    categories: ProductPostCategory[];

    loading: boolean;
    error: string | null;

    fetchedAt: number | null;

    fetchCategories: (
        force?: boolean,
    ) => Promise<
        ProductPostCategory[]
    >;

    clearCategories: () => void;
}

export const useProductPostCategoryStore =
    create<ProductPostCategoryState>()(
        persist(
            (set, get) => ({
                // ==========================================
                // State
                // ==========================================

                categories: [],

                loading: false,
                error: null,

                fetchedAt: null,

                // ==========================================
                // Category 조회
                // ==========================================

                fetchCategories: async (
                    force = false,
                ) => {
                    const {
                        categories,
                        fetchedAt,
                    } = get();

                    const now = Date.now();

                    const isFresh =
                        categories.length > 0 &&
                        fetchedAt !== null &&
                        now - fetchedAt <
                        CATEGORY_CACHE_TTL;

                    if (
                        !force &&
                        isFresh
                    ) {
                        return categories;
                    }

                    set({
                        loading: true,
                        error: null,
                    });

                    try {
                        // Flat Mall v2 categories through direct
                        // Supabase + RLS: product_post_categories_public_select
                        // exposes active categories to anon/authenticated.
                        const {
                            data: rows,
                            error: selectError,
                        } = await createClient()
                            .from("product_post_categories")
                            .select(
                                "id, name, slug, description, display_order, is_active, created_at, updated_at",
                            )
                            .eq("is_active", true)
                            .order("display_order", { ascending: true })
                            .order("created_at", { ascending: true });

                        if (selectError) {
                            throw new Error(
                                "카테고리를 불러오지 못했습니다.",
                            );
                        }

                        const data = (
                            (rows ?? []) as ProductPostCategoryRow[]
                        ).map(toProductPostCategory);

                        set({
                            categories: data,
                            fetchedAt:
                                Date.now(),
                            error: null,
                        });

                        return data;
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : "카테고리를 불러오지 못했습니다.";

                        console.error(
                            "[ProductPostCategory] 카테고리 조회 실패:",
                            error,
                        );

                        set({
                            error: message,
                        });

                        throw error;
                    } finally {
                        set({
                            loading: false,
                        });
                    }
                },

                // ==========================================
                // Store 초기화
                // ==========================================

                clearCategories: () => {
                    set({
                        categories: [],
                        fetchedAt: null,
                        error: null,
                    });
                },
            }),
            {
                name: "product-post-category-store",

                // v1: flat Mall v2 categories. Cached legacy
                // (Express) category shapes are discarded.
                version: 1,
                migrate: () => ({
                    categories: [],
                    fetchedAt: null,
                }),

                partialize: (
                    state,
                ) => ({
                    categories:
                        state.categories,
                    fetchedAt:
                        state.fetchedAt,
                }),
            },
        ),
    );
