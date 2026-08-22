"use client";

import type {
    AddCartItemPayload,
    CartItem,
    UpdateCartItemPayload,
} from "@mall/types";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useCart(userId?: string) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 장바구니 목록 서버 조회
    const fetchCartItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (userId) queryParams.append("userId", userId);

            const response = await fetch(`${API_BASE_URL}/api/orders/cart?${queryParams.toString()}`).catch(() => {
                return null;
            });

            if (!response) {
                setError("서버와 연결할 수 없습니다. (백엔드 실행 상태 확인 필요)");
                setCartItems([]);
                return;
            }

            if (!response.ok) {
                setError(`장바구니 목록 조회 실패 (${response.status})`);
                setCartItems([]);
                return;
            }

            const responseData = await response.json();

            if (responseData.success && Array.isArray(responseData.data)) {
                setCartItems(responseData.data);
            } else if (Array.isArray(responseData)) {
                setCartItems(responseData);
            } else {
                setCartItems([]);
            }
        } catch (err: any) {
            console.warn("[useCart] fetchCartItems 예외 흡수:", err?.message || err);
            setError("장바구니 목록을 불러오는 중 오류가 발생했습니다.");
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // [2] 장바구니 담기
    const addToCart = async (payload: AddCartItemPayload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, userId }),
            }).catch(() => null);

            if (!response || !response.ok) {
                alert("서버 연결 실패 또는 장바구니 담기에 실패했습니다.");
                return false;
            }

            await fetchCartItems();
            return true;
        } catch (err: any) {
            console.warn("[useCart] addToCart 오류:", err?.message || err);
            return false;
        }
    };

    // [3] 장바구니 수량/옵션/선택 상태 수정
    const updateCartItem = async (cartId: string, payload: UpdateCartItemPayload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/cart/${cartId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }).catch(() => null);

            if (!response || !response.ok) {
                alert("장바구니 수정 처리에 실패했습니다.");
                return false;
            }

            await fetchCartItems();
            return true;
        } catch (err: any) {
            console.warn("[useCart] updateCartItem 오류:", err?.message || err);
            return false;
        }
    };

    // [4] 장바구니 선택/일괄 삭제
    const deleteCartItems = async (cartIds: string[]) => {
        if (cartIds.length === 0) {
            alert("삭제할 항목이 선택되지 않았습니다.");
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/cart`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cartIds }),
            }).catch(() => null);

            if (!response || !response.ok) {
                alert("장바구니 삭제 처리에 실패했습니다.");
                return false;
            }

            await fetchCartItems();
            return true;
        } catch (err: any) {
            console.warn("[useCart] deleteCartItems 오류:", err?.message || err);
            return false;
        }
    };

    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    return {
        cartItems,
        loading,
        error,
        fetchCartItems,
        addToCart,
        updateCartItem,
        deleteCartItems,
    };
}