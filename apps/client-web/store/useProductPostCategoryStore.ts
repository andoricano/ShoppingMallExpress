"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
    ProductPostCategory,
} from "@mall/types";

import { API_ENDPOINTS } from "@mall/constants";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

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
                        const response =
                            await fetch(
                                `${API_BASE_URL}${API_ENDPOINTS.CLIENT_CATEGORY.BASE}`,
                                {
                                    method: "GET",
                                    cache: "no-store",
                                },
                            );

                        const result =
                            await response
                                .json()
                                .catch(
                                    () => null,
                                );

                        if (!response.ok) {
                            throw new Error(
                                result?.message ||
                                "카테고리를 불러오지 못했습니다.",
                            );
                        }

                        const data =
                            Array.isArray(
                                result?.data,
                            )
                                ? (result.data as ProductPostCategory[])
                                : [];

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