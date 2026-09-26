import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { runPaymentReversal } from "@/lib/payment/checkout";

/** A PENDING reversal that keeps having no definitive PG answer needs an Admin (see /api/admin/reversals). */
const MAX_AUTOMATIC_ATTEMPTS = 5;
const ORPHAN_LIMIT = 100;
const REVERSAL_BATCH = 50;

function authorized(request: Request) {
    const secret = process.env.RECONCILE_JOB_SECRET;
    const given = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";

    if (!secret || secret.length < 24) {
        return null;
    }

    const a = Buffer.from(given);
    const b = Buffer.from(secret);

    return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Mall v3 reconcile job (docs/mall1/v3/CUTOVER.md), called by a scheduler:
 *   1. an Order-less SUCCEEDED Payment older than the window (default 30
 *      minutes, ORPHAN_MIN_AGE_MINUTES) gets its ORPHAN_PAYMENT reversal;
 *   2. PENDING reversals are executed (the reversal lease keeps concurrent runs
 *      and request-time executions from calling the PG twice); a reversal with
 *      MAX_AUTOMATIC_ATTEMPTS attempts is left for an Admin.
 * FAILED reversals are never retried here: an Admin retries them (actor
 * recorded). Protected by the server-only RECONCILE_JOB_SECRET; without it the
 * job is disabled (503). The response carries counts only.
 */
export async function POST(request: Request) {
    const ok = authorized(request);

    if (ok === null) {
        return NextResponse.json({ message: "Reconcile job is not configured." }, { status: 503 });
    }

    if (!ok) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const minutes = Math.max(0, Number(process.env.ORPHAN_MIN_AGE_MINUTES ?? 30) || 30);

    const { data: orphans, error: orphanError } = await supabase.rpc("reverse_orphan_payments", {
        p_min_age: `${minutes} minutes`,
        p_limit: ORPHAN_LIMIT,
    });

    if (orphanError) {
        return NextResponse.json({ message: "Orphan scan failed." }, { status: 500 });
    }

    const { data: pending, error: pendingError } = await supabase
        .from("payment_reversals")
        .select("id")
        .eq("status", "PENDING")
        .lt("attempt_count", MAX_AUTOMATIC_ATTEMPTS)
        .order("created_at", { ascending: true })
        .limit(REVERSAL_BATCH);

    if (pendingError) {
        return NextResponse.json({ message: "Reversal scan failed." }, { status: 500 });
    }

    const executed: Record<string, number> = {};

    for (const row of pending ?? []) {
        const result = await runPaymentReversal(row.id as string);
        executed[result] = (executed[result] ?? 0) + 1;
    }

    return NextResponse.json({
        data: {
            orphansReversed: Array.isArray(orphans) ? orphans.length : 0,
            reversalsScanned: pending?.length ?? 0,
            executed,
        },
    });
}
