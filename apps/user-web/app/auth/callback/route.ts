import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(
    next: string | null,
    origin: string,
) {
    if (!next) {
        return "/";
    }

    try {
        const nextUrl = new URL(next, origin);

        return nextUrl.origin === origin &&
            nextUrl.pathname.startsWith("/")
            ? `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
            : "/";
    } catch {
        return "/";
    }
}

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
        );

    const safeNext = getSafeNextPath(
        next,
        requestUrl.origin,
    );

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
            safeNext,
            requestUrl.origin,
        ),
    );
}
