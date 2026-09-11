"use client";

import { useEffect } from "react";

import { useCartStore } from "@/store/cartStore";
import { useClientAuthStore } from "@/store/useClientAuthStore";

export function Initializer() {
    const items = useCartStore(
        (state) => state.items,
    );

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

        getProfile();
    }, [
        authUserId,
        getProfile,
    ]);

    useEffect(() => {
        console.log(
            "[Initializer] Cart initialized:",
            items,
        );
    }, [items]);

    return null;
}