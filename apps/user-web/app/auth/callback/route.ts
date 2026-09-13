import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
) {
    const requestUrl = new URL(
        request.url,
    );

    const code =
        requestUrl.searchParams.get(
            "code",
        );

    const next =
        requestUrl.searchParams.get(
            "next",
        ) || "/";

    if (!code) {
        return NextResponse.redirect(
            new URL(
                `/admin-login?error=oauth`,
                requestUrl.origin,
            ),
        );
    }

    const supabase =
        await createClient();

    const { error } =
        await supabase.auth.exchangeCodeForSession(
            code,
        );

    if (error) {
        console.error(
            "[AdminAuth] OAuth callback 실패:",
            error.message,
        );

        return NextResponse.redirect(
            new URL(
                `/admin-login?error=oauth`,
                requestUrl.origin,
            ),
        );
    }

    return NextResponse.redirect(
        new URL(
            next,
            requestUrl.origin,
        ),
    );
}