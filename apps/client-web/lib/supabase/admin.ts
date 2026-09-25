import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient as createSessionClient } from "./server";

export class AuthenticationError extends Error {}

/**
 * Server-only service-role client. Never import this from browser code; the
 * key is read from the server-only SUPABASE_SECRET_KEY.
 */
export function createServiceRoleClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
        throw new Error("Server access is not configured.");
    }

    return createSupabaseClient(url, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Resolves the authenticated user of a Route Handler request from the
 * Supabase session cookie, or from an `Authorization: Bearer <access token>`
 * header. Both are verified by Supabase Auth (getUser), not decoded locally.
 */
export async function requireAuthenticatedUser(request: Request) {
    const authorization = request.headers.get("authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    const { data, error } = token
        ? await createServiceRoleClient().auth.getUser(token)
        : await (await createSessionClient()).auth.getUser();

    if (error || !data.user) {
        throw new AuthenticationError("Authentication is required.");
    }

    return data.user;
}
