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
            data,
            error,
        } = await supabase.rpc(
            "get_my_profile",
        );

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return data as ClientProfile;
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