// lib/authClient.ts

import type {
    Session,
} from "@supabase/supabase-js";

import type {
    ClientProfile,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";

export const authProfile = {
    // ==========================================
    // Auth Session
    // ==========================================

    async getSession(): Promise<Session | null> {
        const supabase =
            createClient();

        const {
            data,
            error,
        } =
            await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        return data.session;
    },

    // ==========================================
    // Client Profile
    // ==========================================
    async getProfile(): Promise<ClientProfile | null> {
        const supabase =
            createClient();

        const {
            data: {
                session,
            },
            error: sessionError,
        } =
            await supabase.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!session?.user) {
            return null;
        }

        const {
            data: profile,
            error: profileError,
        } =
            await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

        if (profileError) {
            throw profileError;
        }

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: "CLIENT",

            recipientName:
                profile.recipient_name,

            phone:
                profile.phone,

            address:
                profile.zonecode &&
                    profile.address
                    ? {
                        zonecode:
                            profile.zonecode,
                        address:
                            profile.address,
                        detail:
                            profile.address_detail ??
                            "",
                    }
                    : undefined,

            isOnboarded:
                profile.is_onboarded ??
                false,

            createdAt:
                profile.created_at,

            updatedAt:
                profile.updated_at,
        };
    },

    // ==========================================
    // Google Login
    // ==========================================

    async signInWithGoogle() {
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
    },

    // ==========================================
    // Logout
    // ==========================================

    async signOut() {
        const supabase =
            createClient();

        const {
            error,
        } =
            await supabase.auth.signOut();

        if (error) {
            throw error;
        }
    },
};