// hooks/order-history/useOrderClient.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

export function useOrderClient() {
    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    // ==========================================
    // 1. 별점 등록
    // ==========================================

    const createRating = useCallback(
        async (
            orderId: string,
            rating: number,
        ) => {
            setLoading(true);
            setError(null);

            console.log(
                "[useOrderClient] 별점 등록:",
                {
                    orderId,
                    rating,
                },
            );

            try {
                // TODO:
                // 기존 별점 API 연결

                return true;
            } catch (err) {
                console.error(
                    "[useOrderClient] 별점 등록 실패:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "별점 등록에 실패했습니다.",
                );

                return false;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // 2. 리뷰 등록
    // ==========================================

    const createReview = useCallback(
        async (
            orderId: string,
            content: string,
        ) => {
            setLoading(true);
            setError(null);

            console.log(
                "[useOrderClient] 리뷰 등록:",
                {
                    orderId,
                    content,
                },
            );

            try {
                // TODO:
                // 기존 리뷰 API 연결

                return true;
            } catch (err) {
                console.error(
                    "[useOrderClient] 리뷰 등록 실패:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "리뷰 등록에 실패했습니다.",
                );

                return false;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // 3. 문의 등록
    // ==========================================

    const createInquiry = useCallback(
        async (
            orderId: string,
            content: string,
        ) => {
            setLoading(true);
            setError(null);

            console.log(
                "[useOrderClient] 문의 등록:",
                {
                    orderId,
                    content,
                },
            );

            try {
                // TODO:
                // 기존 문의 API 연결

                return true;
            } catch (err) {
                console.error(
                    "[useOrderClient] 문의 등록 실패:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "문의 등록에 실패했습니다.",
                );

                return false;
            } finally {
                setLoading(false);
            }
        },
        [],
    );
    // ==========================================
    // 5. Error 초기화
    // ==========================================

    const clearError =
        useCallback(() => {
            setError(null);
        }, []);

    return {
        loading,
        error,

        createRating,
        createReview,
        createInquiry,

        clearError,
    };
}