// hooks/useHistory.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import { API_ENDPOINTS } from "@mall/constants";
import type { ClientHistoryItem } from "@mall/types";
import { authProfile } from "@/lib/authClient";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

export function useHistory() {
    const [
        historyList,
        setHistoryList,
    ] = useState<ClientHistoryItem[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // ==========================================
    // 1. Client History 조회
    // ==========================================

    const fetchHistory = useCallback(
        async () => {
            setLoading(true);
            setError(null);

            try {
                const session =
                    await authProfile.getSession();

                if (!session?.access_token) {
                    throw new Error(
                        "로그인이 필요합니다.",
                    );
                }

                const url =
                    `${API_BASE_URL}${API_ENDPOINTS.CLIENT_HISTORY.BASE}`;

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
                        .catch(() => null);

                console.log(
                    "[useHistory] API result:",
                    result,
                );

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                            "History를 불러오지 못했습니다.",
                    );
                }

                const history =
                    Array.isArray(
                        result?.data,
                    )
                        ? (result.data as ClientHistoryItem[])
                        : [];

                setHistoryList(history);

                return history;
            } catch (err) {
                console.error(
                    "[useHistory] History 조회 실패:",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "History 조회에 실패했습니다.",
                );

                setHistoryList([]);

                return [];
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    return {
        historyList,
        loading,
        error,

        fetchHistory,
    };
}