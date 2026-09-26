import { NextResponse } from "next/server";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

/**
 * Admin-only list of payment reversals that need attention: every FAILED
 * reversal (retried by an Admin, never automatically) and every PENDING one
 * that has been attempted five times without a definitive PG answer. Internal:
 * never exposed to Consumers.
 */
export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const columns =
            "id, payment_id, order_id, refund_request_id, amount, reason_type, status, attempt_count, last_attempted_at, failure_reason, created_at";

        const [failed, stuck] = await Promise.all([
            supabase.from("payment_reversals").select(columns).eq("status", "FAILED")
                .order("created_at", { ascending: true }).limit(200),
            supabase.from("payment_reversals").select(columns).eq("status", "PENDING").gte("attempt_count", 5)
                .order("created_at", { ascending: true }).limit(200),
        ]);

        if (failed.error) throw failed.error;
        if (stuck.error) throw stuck.error;

        const rows = [...(failed.data ?? []), ...(stuck.data ?? [])];

        return NextResponse.json({
            data: rows.map((row) => ({
                id: row.id,
                paymentId: row.payment_id,
                orderId: row.order_id,
                refundRequestId: row.refund_request_id,
                amount: Number(row.amount),
                reasonType: row.reason_type,
                status: row.status,
                attemptCount: row.attempt_count,
                lastAttemptedAt: row.last_attempted_at,
                failureReason: row.failure_reason,
                createdAt: row.created_at,
            })),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
