"use client";

import { useCallback, useState } from "react";

import type { UserProfile } from "@mall/types";

export function useUserAdmin() {
    const [users, setUsers] =
        useState<UserProfile[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // ==========================================
    // 회원 목록 조회
    // ==========================================

    const fetchUsers = useCallback(
        async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch("/api/admin/users");

                const result =
                    await res
                        .json()
                        .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "회원 목록 조회에 실패했습니다.",
                    );
                }

                const nextUsers =
                    Array.isArray(
                        result?.data,
                    )
                        ? (result.data as UserProfile[])
                        : [];

                setUsers(nextUsers);

                return nextUsers;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "회원 목록 조회에 실패했습니다.";

                setError(message);
                setUsers([]);

                return [];
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const replaceUsers = useCallback(
        (nextUsers: UserProfile[]) => {
            setUsers(nextUsers);
        },
        [],
    );

    return {
        users,
        loading,
        error,

        fetchUsers,
        replaceUsers,
    };
}
