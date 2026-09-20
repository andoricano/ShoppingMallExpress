"use client";

import {
    useCallback,
    useState,
} from "react";

import {
    API_ENDPOINTS,
} from "@mall/constants";

import type {
    Point,
    PointTransaction,
} from "@mall/types";

import { API_BASE_URL } from "@/lib/api";
import { authProfile } from "@/lib/authClient";
import { useClientAuthStore } from "@/store/useClientAuthStore";

export function usePoint() {
    const updatePoint =
        useClientAuthStore(
            (state) => state.updatePoint,
        );

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );


    const [
        transactions,
        setTransactions,
    ] = useState<PointTransaction[]>([]);

    // ==========================================
    // 1. Client Point 조회
    // ==========================================

    const fetchPoint =
        useCallback(
            async () => {
                setLoading(true);
                setError(null);

                try {
                    const session =
                        await authProfile.getSession();

                    if (
                        !session?.access_token
                    ) {
                        throw new Error(
                            "로그인이 필요합니다.",
                        );
                    }

                    const url =
                        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_POINTS.BASE}`;

                    const response =
                        await fetch(url, {
                            headers: {
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                        });

                    const result =
                        await response
                            .json()
                            .catch(
                                () => null,
                            );

                    console.log(
                        "[usePoint] Point 조회 API result:",
                        result,
                    );

                    if (!response.ok) {
                        throw new Error(
                            result?.message ||
                            "포인트를 불러오지 못했습니다.",
                        );
                    }

                    const data =
                        result?.data
                            ? (result.data as Point)
                            : null;

                    if (data) {
                        updatePoint(
                            data,
                        );
                    }

                    return data;
                } catch (err) {
                    console.error(
                        "[usePoint] Point 조회 실패:",
                        err,
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "포인트 조회에 실패했습니다.",
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            [updatePoint],
        );
    // ==========================================
    // 2. Client Point Transaction 조회
    // ==========================================

    const fetchPointTransactions =
        useCallback(
            async () => {
                setLoading(true);
                setError(null);

                try {
                    const session =
                        await authProfile.getSession();

                    if (
                        !session?.access_token
                    ) {
                        throw new Error(
                            "로그인이 필요합니다.",
                        );
                    }

                    const url =
                        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_POINTS.TRANSACTIONS}`;

                    const response =
                        await fetch(url, {
                            headers: {
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                        });

                    const result =
                        await response
                            .json()
                            .catch(
                                () => null,
                            );

                    console.log(
                        "[usePoint] Point Transaction 조회 API result:",
                        result,
                    );

                    if (!response.ok) {
                        throw new Error(
                            result?.message ||
                            "포인트 이용 내역을 불러오지 못했습니다.",
                        );
                    }

                    const data =
                        Array.isArray(
                            result?.data,
                        )
                            ? (result.data as PointTransaction[])
                            : [];

                    setTransactions(data);
                } catch (err) {
                    console.error(
                        "[usePoint] Point Transaction 조회 실패:",
                        err,
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "포인트 이용 내역 조회에 실패했습니다.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [],
        );


    // ==========================================
    // 2. Client Point 충전
    // ==========================================

    const chargePoint =
        useCallback(
            async (
                amount: number,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const session =
                        await authProfile.getSession();

                    if (
                        !session?.access_token
                    ) {
                        throw new Error(
                            "로그인이 필요합니다.",
                        );
                    }

                    const url =
                        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_POINTS.CHARGE}`;

                    const response =
                        await fetch(url, {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                            body:
                                JSON.stringify({
                                    amount,
                                }),
                        });

                    const result =
                        await response
                            .json()
                            .catch(
                                () => null,
                            );

                    console.log(
                        "[usePoint] Point 충전 API result:",
                        result,
                    );

                    if (!response.ok) {
                        throw new Error(
                            result?.message ||
                            "포인트 충전에 실패했습니다.",
                        );
                    }

                    const data =
                        result?.data
                            ? (result.data as Point)
                            : null;

                    if (data) {
                        updatePoint(
                            data,
                        );
                    }

                    return data;
                } catch (err) {
                    console.error(
                        "[usePoint] Point 충전 실패:",
                        err,
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "포인트 충전에 실패했습니다.",
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            [updatePoint],
        );

    return {
        loading,
        error,

        transactions,

        fetchPoint,
        fetchPointTransactions,
        chargePoint,
    };
}
