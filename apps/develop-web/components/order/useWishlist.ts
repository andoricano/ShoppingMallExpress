"use client";

import type { WishlistItem } from "@mall/types";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useWishlist(userId?: string) {
    // 위시리스트 서버 데이터를 담을 상태
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 관심상품 목록 서버 조회 (GET /api/orders/wishlist)
    const fetchWishlist = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (userId) queryParams.append("userId", userId);

            // [보완] fetch 호출 자체에서 네트워크 오류 발생 시 catch로 안전하게 이동
            const response = await fetch(`${API_BASE_URL}/api/orders/wishlist?${queryParams.toString()}`).catch(() => {
                // 서버 연결 실패 시 null 반환하여 TypeError 방지
                return null;
            });

            // response가 null이거나 ok가 아닌 경우 안전한 예외 처리
            if (!response) {
                setError("서버와 연결할 수 없습니다. (백엔드 실행 상태 확인 필요)");
                setWishlist([]);
                return;
            }

            if (!response.ok) {
                setError(`관심상품 목록 조회 실패 (${response.status})`);
                setWishlist([]);
                return;
            }

            const responseData = await response.json();

            if (responseData.success && Array.isArray(responseData.data)) {
                setWishlist(responseData.data);
            } else if (Array.isArray(responseData)) {
                setWishlist(responseData);
            } else {
                setWishlist([]);
            }
        } catch (err: any) {
            // [보완] console.error 대신 console.warn을 사용하여 무분별한 Red Error Log 방지
            console.warn("[useWishlist] fetchWishlist 예외 흡수:", err?.message || err);
            setError("관심상품을 불러오는 중 오류가 발생했습니다.");
            setWishlist([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // [2] 관심상품 토글 (등록 / 삭제) (POST /api/orders/wishlist/toggle)
    const toggleWishlist = async (productId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/wishlist/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, productId }),
            });

            if (!response.ok) throw new Error("관심상품 처리에 실패했습니다.");

            const responseData = await response.json();
            
            await fetchWishlist(); // 성공 시 최신 목록 재조회
            return responseData.isWished as boolean; // 등록: true, 삭제: false 반환
        } catch (err: any) {
            console.error("[useWishlist] toggleWishlist 오류:", err);
            alert(err.message || "관심상품 처리 중 오류가 발생했습니다.");
            return null;
        }
    };

    // [3] 클라이언트 유틸: 특정 상품의 위시리스트 포함 여부 확인
    const isWished = useCallback(
        (productId: string) => wishlist.some((item) => item.productId === productId),
        [wishlist]
    );

    // 마운트 시 초기 관심상품 목록 로드
    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    return {
        wishlist,
        loading,
        error,
        fetchWishlist,
        toggleWishlist,
        isWished,
    };
}