"use client";

import { useEffect } from "react";

import { useClientAuthStore } from "@/store/useClientAuthStore";
import { useCart } from "@/hooks/user/useCart";
import { useWishlist } from "@/hooks/user/useWishlist";

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
        fetchCart,
    } = useCart();

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

    useEffect(() => {
        if (!authUserId) {
            return;
        }

        const initializeClient =
            async () => {
                await getProfile();
                await fetchCart();
                await fetchWishlist();
            };

        initializeClient();
    }, [
        authUserId,
        getProfile,
        fetchCart,
        fetchWishlist,
    ]);

    return null;
}