import { NextResponse } from "next/server";

import { AdminAuthorizationError } from "@/lib/supabase/admin";

/** Request validation failure raised inside an Admin Route Handler. */
export class AdminBadRequestError extends Error {}

/** Resource lookup failure raised inside an Admin Route Handler. */
export class AdminNotFoundError extends Error {}

function getDatabaseErrorCode(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : null;
}

export function adminErrorResponse(error: unknown) {
    if (error instanceof AdminAuthorizationError) {
        return NextResponse.json(
            { message: error.message },
            { status: error.status },
        );
    }

    if (error instanceof AdminBadRequestError) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof AdminNotFoundError) {
        return NextResponse.json({ message: error.message }, { status: 404 });
    }

    // RPC RAISE EXCEPTION / check constraint: invalid admin input.
    const code = getDatabaseErrorCode(error);

    // RPC RAISE ... USING ERRCODE = 'P0002': target record not found.
    if (code === "P0002") {
        return NextResponse.json(
            {
                message: typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message: unknown }).message)
                    : "Not found.",
            },
            { status: 404 },
        );
    }

    if (code === "P0001" || code === "23514") {
        return NextResponse.json(
            {
                message: typeof error === "object" && error !== null && "message" in error
                    ? String((error as { message: unknown }).message)
                    : "Invalid request.",
            },
            { status: 400 },
        );
    }

    // Postgres unique violation, e.g. duplicated ProductPost/Category slug.
    if (getDatabaseErrorCode(error) === "23505") {
        return NextResponse.json(
            { message: "A record with the same unique value already exists." },
            { status: 409 },
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
