// lib/authClient.ts

import type {
    Session,
} from "@supabase/supabase-js";

import type {
    ClientProfile,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";

type UserProfileRow = {
    id: string;
    name: string | null;
    role: string;
    recipient_name: string | null;
    phone: string | null;
    is_onboarded: boolean;
    created_at: string;
    updated_at: string;
};

const PROFILE_SELECT =
    "id, name, role, recipient_name, phone, is_onboarded, created_at, updated_at";

function toClientProfile(row: UserProfileRow): ClientProfile {
    return {
        id: row.id,
        name: row.name ?? undefined,
        role: row.role as ClientProfile["role"],
        recipientName: row.recipient_name ?? undefined,
        phone: row.phone ?? undefined,
        isOnboarded: row.is_onboarded,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// user_profiles CHECK constraints reject blank strings.
const toNullable = (value: string) =>
    value.trim() || null;

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

    // Owner row through the user_profiles_owner_select RLS policy.
    async getProfile(): Promise<ClientProfile | null> {
        const supabase =
            createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return null;
        }

        const {
            data,
            error,
        } = await supabase
            .from("user_profiles")
            .select(PROFILE_SELECT)
            .eq("id", session.user.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data
            ? toClientProfile(data as UserProfileRow)
            : null;
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
    // Update DB Profile
    // ==========================================
    // user_profiles_owner_update RLS; authenticated may update name/phone only.
    async updateProfile(
        name: string,
        phone: string,
    ) {
        const supabase = createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            throw new Error("로그인이 필요합니다.");
        }

        const { data, error } =
            await supabase
                .from("user_profiles")
                .update({
                    name: toNullable(name),
                    phone: toNullable(phone),
                })
                .eq("id", session.user.id)
                .select(PROFILE_SELECT)
                .single();

        if (error) {
            throw error;
        }

        return toClientProfile(data as UserProfileRow);
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