// stores/useClientAuthStore.ts

"use client";

import { create } from "zustand";

import type { ClientProfile } from "@mall/types";
import { authProfile } from "@/lib/authClient";


interface ClientAuthState {
    user: ClientProfile | null;
    authUserId: string | null;

    loading: boolean;
    error: string | null;

    signInWithGoogle: () => Promise<void>;
    getSession: () => Promise<void>;
    getProfile: () => Promise<void>;
    updateProfile: (
        name: string,
        phone: string,
    ) => Promise<void>;

    signOut: () => Promise<void>;
    clearAuth: () => void;
}

export const useClientAuthStore =
    create<ClientAuthState>((set) => ({
        // ==========================================
        // State
        // ==========================================

        user: null,
        authUserId: null,

        loading: false,
        error: null,

        // ==========================================
        // Google Login
        // ==========================================

        signInWithGoogle: async () => {
            set({
                loading: true,
                error: null,
            });

            try {
                await authProfile.signInWithGoogle();
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Google 로그인에 실패했습니다.";

                console.error(
                    "[ClientAuth] Google 로그인 실패:",
                    error,
                );

                set({
                    error: message,
                });
            } finally {
                set({
                    loading: false,
                });
            }
        },

        // ==========================================
        // Auth Session
        // ==========================================
        getSession: async () => {
            set({
                loading: true,
                error: null,
            });

            try {
                const session =
                    await authProfile.getSession();

                if (!session) {
                    console.log(
                        "[ClientAuth] Session 없음",
                    );

                    set({
                        authUserId: null,
                        user: null,
                    });

                    return;
                }

                set({
                    authUserId:
                        session.user.id,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Auth Session을 불러오지 못했습니다.";

                console.error(
                    "[ClientAuth] Session 조회 실패:",
                    error,
                );

                set({
                    authUserId: null,
                    user: null,
                    error: message,
                });
            } finally {
                set({
                    loading: false,
                });
            }
        },

        // ==========================================
        // Client Profile
        // ==========================================

        getProfile: async () => {
            set({
                loading: true,
                error: null,
            });

            try {
                const profile =
                    await authProfile.getProfile();

                set({
                    user: profile,
                    authUserId:
                        profile?.id ?? null,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Client 프로필을 불러오지 못했습니다.";

                console.error(
                    "[ClientAuth] Profile 조회 실패:",
                    error,
                );

                set({
                    user: null,
                    error: message,
                });
            } finally {
                set({
                    loading: false,
                });
            }
        },
        // ==========================================
        // Client Profile 수정
        // ==========================================

        updateProfile: async (
            name,
            phone,
        ) => {
            set({
                loading: true,
                error: null,
            });

            try {
                const profile =
                    await authProfile.updateProfile(
                        name,
                        phone,
                    );

                set({
                    user: profile,
                    authUserId:
                        profile?.id ?? null,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Client 프로필 수정에 실패했습니다.";

                console.error(
                    "[ClientAuth] Profile 수정 실패:",
                    error,
                );

                set({
                    error: message,
                });

                throw error;
            } finally {
                set({
                    loading: false,
                });
            }
        },

        // ==========================================
        // Logout
        // ==========================================

        signOut: async () => {
            set({
                loading: true,
                error: null,
            });

            try {
                await authProfile.signOut();

                set({
                    user: null,
                    authUserId: null,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "로그아웃에 실패했습니다.";

                console.error(
                    "[ClientAuth] 로그아웃 실패:",
                    error,
                );

                set({
                    error: message,
                });
            } finally {
                set({
                    loading: false,
                });
            }
        },

        // ==========================================
        // Clear Auth
        // ==========================================

        clearAuth: () => {
            set({
                user: null,
                authUserId: null,
                error: null,
            });
        },
    }));
