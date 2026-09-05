// hooks/useClientAuth.ts

"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export function useClientAuth() {
    const [user, setUser] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    // ==========================================
    // 현재 로그인 User 조회
    // ==========================================

    const getUser = useCallback(
        async () => {
            setLoading(true);
            setError(null);

            try {
                const supabase =
                    createClient();

                const {
                    data,
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    throw error;
                }

                setUser(data.user);

                return data.user;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "사용자 정보를 불러오지 못했습니다.";

                setError(message);
                setUser(null);

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // Google 로그인
    // ==========================================

    const signInWithGoogle =
        useCallback(async () => {
            setError(null);

            try {
                const supabase =
                    createClient();

                const {
                    error,
                } =
                    await supabase.auth.signInWithOAuth(
                        {
                            provider: "google",
                            options: {
                                redirectTo:
                                    `${window.location.origin}/auth/callback`,
                            },
                        },
                    );

                if (error) {
                    throw error;
                }
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Google 로그인에 실패했습니다.";

                setError(message);

                return false;
            }

            return true;
        }, []);

    // ==========================================
    // 로그아웃
    // ==========================================

    const signOut =
        useCallback(async () => {
            setError(null);

            try {
                const supabase =
                    createClient();

                const {
                    error,
                } =
                    await supabase.auth.signOut();

                if (error) {
                    throw error;
                }

                setUser(null);

                return true;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "로그아웃에 실패했습니다.";

                setError(message);

                return false;
            }
        }, []);

    // ==========================================
    // Auth Session 변경 감지
    // ==========================================

    useEffect(() => {
        const supabase =
            createClient();

        const {
            data: {
                subscription,
            },
        } =
            supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setUser(
                        session?.user ?? null,
                    );
                },
            );

        getUser();

        return () => {
            subscription.unsubscribe();
        };
    }, [getUser]);

    return {
        user,
        loading,
        error,

        isAuthenticated:
            user !== null,

        getUser,
        signInWithGoogle,
        signOut,
    };
}