import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient as createSessionClient } from "./server";

export class AdminAuthorizationError extends Error {
    constructor(message: string, public readonly status: 401 | 403) {
        super(message);
    }
}

function createServiceRoleClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Server-only Supabase secret key (`sb_secret_...`, or a legacy
    // service_role JWT). Never expose it through a NEXT_PUBLIC_* variable.
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
        throw new Error(
            "Admin server access is not configured.",
        );
    }

    return createSupabaseClient(url, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Establishes the only browser-to-service-role boundary used by Admin routes.
 * The service-role client is created only after the request's authenticated
 * user has been confirmed as an ADMIN through the user_profiles RLS contract.
 */
export async function requireAdminServiceClient() {
    return (await requireAdminServiceContext()).supabase;
}

/**
 * Same boundary as requireAdminServiceClient(), and also returns the verified
 * Admin's user id (for recording who performed an action).
 */
export async function requireAdminServiceContext() {
    const sessionClient = await createSessionClient();
    const {
        data: { user },
        error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
        throw new AdminAuthorizationError(
            "Administrator authentication is required.",
            401,
        );
    }

    const { data: profile, error: profileError } = await sessionClient
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || profile?.role !== "ADMIN") {
        throw new AdminAuthorizationError(
            "Administrator authorization is required.",
            403,
        );
    }

    return { supabase: createServiceRoleClient(), adminId: user.id };
}
