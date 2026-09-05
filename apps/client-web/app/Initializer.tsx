// app/Initializer.tsx

"use client";

import { useEffect } from "react";

import { useCartStore } from "@/store/cartStore";

export function Initializer() {
    const items = useCartStore(
        (state) => state.items,
    );

    useEffect(() => {
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