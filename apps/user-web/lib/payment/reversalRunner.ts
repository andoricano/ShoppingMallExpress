import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
    executePaymentReversal,
    selectReversalAdapter,
    type RpcCaller,
} from "./reversal";

/**
 * Executes a payment reversal after its database transaction committed. The
 * adapter comes from `PG_REVERSAL_ADAPTER` (see selectReversalAdapter): only
 * `simulated` (PG test mode) settles a reversal; otherwise the outcome is
 * unknown and the reversal stays PENDING for the reconcile job. An unknown
 * outcome leaves the reversal PENDING (see ./reversal.ts); this never throws
 * into the request.
 *
 * ./reversal.ts is kept identical to apps/client-web/lib/payment/reversal.ts
 * (verified by supabase/verification/v3_phase5_routes.sh).
 */
export async function runPaymentReversal(supabase: SupabaseClient, reversalId: string) {
    const rpc: RpcCaller = (fn, args) => supabase.rpc(fn, args);

    try {
        return await executePaymentReversal(
            rpc,
            reversalId,
            selectReversalAdapter(process.env.PG_REVERSAL_ADAPTER),
        );
    } catch {
        return "UNKNOWN_OUTCOME" as const;
    }
}
