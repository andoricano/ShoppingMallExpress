// hooks/history/useHistory.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type { ClientHistoryItem } from "@mall/types";

import { createClient } from "@/lib/supabase/client";

/**
 * Consumer order history through the authenticated get_order_history() RPC:
 * the caller's own Orders with immutable OrderItem snapshots only.
 */
export function useHistory() {
    const [historyList, setHistoryList] =
        useState<ClientHistoryItem[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const fetchHistory = useCallback(
        async (limit = 100, offset = 0) => {
            setLoading(true);
            setError(null);

            try {
                const supabase = createClient();
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session) {
                    throw new Error("로그인이 필요합니다.");
                }

                const { data, error: rpcError } = await supabase.rpc(
                    "get_order_history",
                    { p_limit: limit, p_offset: offset },
                );

                if (rpcError) {
                    throw new Error("주문 내역을 불러오지 못했습니다.");
                }

                const history = (
                    Array.isArray(data) ? data : []
                ) as ClientHistoryItem[];

                setHistoryList(history);

                return history;
            } catch (cause) {
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "주문 내역을 불러오지 못했습니다.",
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
