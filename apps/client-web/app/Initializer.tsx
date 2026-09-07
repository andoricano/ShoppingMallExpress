// app/Initializer.tsx

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

    useEffect(() => {
        // ==========================================
        // Client Auth 초기화
        // ==========================================

        const initializeAuth =
            async () => {
                console.log(
                    "[Initializer] Client Auth 초기화",
                );

                await getSession();
                await getProfile();
            };

        initializeAuth();
    }, [
        getSession,
        getProfile,
    ]);

    useEffect(() => {
        // ==========================================
        // Cart 초기화
        // ==========================================

        // TODO: 추후 Cart API 연결
        // User의 원격 장바구니를 조회한 뒤
        // Zustand Cart와 동기화
        console.log(
            "[Initializer] Cart initialized:",
            items,
        );
    }, [items]);

    return null;
}