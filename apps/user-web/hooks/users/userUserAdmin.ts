"use client";

import { useCallback, useState } from "react";

import type { UserProfile } from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";

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
                const res = await fetch(
                    API_ENDPOINTS.USERS.BASE,
                );

                const result =
                    await res
                        .json()
                        .catch(() => null);

                console.log("[UserAdmin] API Response:", result);
                console.log("[UserAdmin] result.data:", result?.data);
                console.log(
                    "[UserAdmin] Array:",
                    Array.isArray(result?.data),
                );
                console.log(
                    "[UserAdmin] Count:",
                    Array.isArray(result?.data)
                        ? result.data.length
                        : 0,
                );


                console.log(
                    "[UserAdmin] API Response:",
                    result,
                );

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

                console.log(
                    "[UserAdmin] Users:",
                    nextUsers,
                );

                return nextUsers;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "회원 목록 조회에 실패했습니다.";

                console.error(
                    "[UserAdmin] 조회 실패:",
                    err,
                );

                setError(message);
                setUsers([]);

                return [];
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    return {
        users,
        loading,
        error,

        fetchUsers,
    };
}