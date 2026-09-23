import { NextResponse } from "next/server";

import { AdminAuthorizationError } from "@/lib/supabase/admin";

export function adminErrorResponse(error: unknown) {
    if (error instanceof AdminAuthorizationError) {
        return NextResponse.json(
            { message: error.message },
            { status: error.status },
        );
    }

    return NextResponse.json(
        {
            message: error instanceof Error
                ? error.message
                : "Admin request failed.",
        },
        { status: 500 },
    );
}
