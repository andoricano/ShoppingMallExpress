import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { runPaymentReversal } from "@/lib/payment/checkout";

/** A PENDING reversal that keeps having no definitive PG answer needs an Admin (see /api/admin/reversals). */
const MAX_AUTOMATIC_ATTEMPTS = 5;
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
 * Mall v3 reversal sweeper (docs/mall1/v3/CUTOVER.md 3.3), called by Supabase
 * Cron through pg_net (public.call_reconcile_sweeper, secret from Vault):
 * PENDING reversals are executed (the reversal lease keeps concurrent runs and
 * request-time executions from calling the PG twice); a reversal with
 * MAX_AUTOMATIC_ATTEMPTS attempts is left for an Admin. The PG adapter and the
 * reversal execution stay here, in the Next server.
 * Orphan Payments are NOT handled here: their reversals are created inside the
 * database (public.reconcile_orphan_payments, also Supabase Cron) and executed by
 * the next run of this sweeper.
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
            reversalsScanned: pending?.length ?? 0,
            executed,
        },
    });
}
