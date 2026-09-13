import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
    process.env["SUPABASE_URL"];

const supabaseSecretKey =
    process.env["SUPABASE_SECRET_KEY"];

const supabaseSecretSuperKey =
    process.env["SUPABASE_SECRET_SUPER_KEY"];

if (
    !supabaseUrl ||
    !supabaseSecretKey
) {
    throw new Error(
        "Supabase environment variables are missing",
    );
}

if (!supabaseSecretSuperKey) {
    throw new Error(
        "SUPABASE_SECRET_SUPER_KEY environment variable is missing",
    );
}

// 일반 서버용 클라이언트
export const supabase =
    createClient(
        supabaseUrl,
        supabaseSecretKey,
    );

// Admin 전용 클라이언트
export const supabaseAdmin =
    createClient(
        supabaseUrl,
        supabaseSecretSuperKey,
    );