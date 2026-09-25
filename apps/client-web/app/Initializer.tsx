"use client";

import { useEffect } from "react";

import { useClientAuthStore } from "@/store/useClientAuthStore";
import { useWishlist } from "@/hooks/user/useWishlist";
import { useProductPostCategoryStore } from "@/store/useProductPostCategoryStore";


export function Initializer() {
    const getSession =
        useClientAuthStore(
            (state) => state.getSession,
        );

    const getProfile =
        useClientAuthStore(
            (state) => state.getProfile,
        );

    const authUserId =
        useClientAuthStore(
            (state) => state.authUserId,
        );

    const {
        fetchWishlist,
    } = useWishlist();

    useEffect(() => {
        const initializeAuth =
            async () => {
                console.log(
                    "[Initializer] Client Auth 초기화",
                );

                await getSession();
            };

        initializeAuth();
    }, [getSession]);


    const fetchCategories =
        useProductPostCategoryStore(
            (state) => state.fetchCategories,
        );

    useEffect(() => {
        const initializeCategories =
            async () => {
                console.log(
                    "[Initializer] Product Post Category 초기화",
                );

                try {
                    await fetchCategories();
                } catch (error) {
                    console.error(
                        "[Initializer] Category 초기화 실패:",
                        error,
                    );
                }
            };

        initializeCategories();
    }, [fetchCategories]);


    useEffect(() => {
        if (!authUserId) {
            return;
        }

        const initializeClient =
            async () => {
                await getProfile();
                await fetchWishlist();
            };

        initializeClient();
    }, [
        authUserId,
        getProfile,
        fetchWishlist,
    ]);

    return null;
}