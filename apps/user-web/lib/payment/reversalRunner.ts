import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
    createSimulatedPgTestReversalAdapter,
    executePaymentReversal,
    type RpcCaller,
} from "./reversal";

/**
 * Executes a payment reversal after its database transaction committed. The PG
 * Test service has no cancel API, so the development adapter simulates the PG;
 * replace it with the production adapter when production PG integration exists.
 * An unknown outcome leaves the reversal PENDING (see ./reversal.ts); this
 * never throws into the request.
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
            createSimulatedPgTestReversalAdapter(),
        );
    } catch {
        return "UNKNOWN_OUTCOME" as const;
    }
}
