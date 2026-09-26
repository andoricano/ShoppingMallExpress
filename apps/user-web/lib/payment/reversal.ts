/**
 * Mall v3 payment reversal executor (docs/mall1/v3 PHASES.md, Phase 3).
 *
 * The external PG call and the database transaction are separate:
 *
 *   1. claim_payment_reversal   short DB transaction (lease + attempt count)
 *   2. adapter.reverse(...)     PG call, outside any DB transaction
 *   3. complete_payment_reversal short DB transaction (records the outcome)
 *
 * Only a definitive answer from the PG changes the reversal:
 *   - success  -> SUCCEEDED (needs the PG reference)
 *   - refusal  -> FAILED (frees the amount, can be retried)
 * A timeout, a network error, or any thrown error is an UNKNOWN outcome: the
 * reversal stays PENDING (the PG may have refunded), and the lease lets a
 * later run retry it. The PG request carries the reversal's idempotency key so
 * a repeated call cannot refund twice.
 *
 * `payments.status` is never touched; the original success is preserved.
 *
 * This module has no secrets and no framework imports: the RPC caller and the
 * adapter are passed in (the caller is a service-role Supabase client bound to
 * `rpc`). Production PG integration is not implemented yet.
 */

export interface PgReversalRequest {
    reversalId: string;
    paymentId: string;
    /** PG reference of the original payment (payments.pg_callback_id). */
    pgCallbackId: string | null;
    amount: number;
    /** Must be sent to the PG as the request id so a repeat cannot refund twice. */
    idempotencyKey: string;
}

export type PgReversalOutcome =
    | { kind: "SUCCEEDED"; pgReference: string }
    /** The PG definitively refused the reversal. */
    | { kind: "FAILED"; reason: string };

export interface PaymentReversalAdapter {
    /**
     * Resolves with a definitive outcome. Throwing (or never resolving) means
     * the outcome is unknown.
     */
    reverse(request: PgReversalRequest): Promise<PgReversalOutcome>;
}

export type RpcCaller = (
    fn: string,
    args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

export type ReversalExecutionResult =
    | "SUCCEEDED"
    | "FAILED"
    /** The PG answer is unknown; the reversal stays PENDING. */
    | "UNKNOWN_OUTCOME"
    /** Already SUCCEEDED/FAILED, so nothing to send. */
    | "NOT_PENDING"
    /** Another run holds the lease; nothing was sent. */
    | "NOT_CLAIMED";

export interface ExecuteOptions {
    /** How long an attempt holds the reversal (default 300 s). */
    leaseSeconds?: number;
    /** Upper bound for the PG call (default 15 s); beyond it the outcome is unknown. */
    timeoutMs?: number;
}

interface ClaimedReversal {
    id: string;
    payment_id: string;
    amount: number | string;
    status: string;
    idempotency_key: string;
    claimed: boolean;
    payment_pg_callback_id: string | null;
}

async function call<T>(rpc: RpcCaller, fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await rpc(fn, args);

    if (error) {
        throw new Error(`${fn} failed: ${error.message}`);
    }

    return data as T;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("PG reversal timed out")), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function executePaymentReversal(
    rpc: RpcCaller,
    reversalId: string,
    adapter: PaymentReversalAdapter,
    options: ExecuteOptions = {},
): Promise<ReversalExecutionResult> {
    const claim = await call<ClaimedReversal>(rpc, "claim_payment_reversal", {
        p_reversal_id: reversalId,
        p_lease_seconds: options.leaseSeconds ?? 300,
    });

    if (!claim.claimed) {
        return claim.status === "PENDING" ? "NOT_CLAIMED" : "NOT_PENDING";
    }

    let outcome: PgReversalOutcome;

    try {
        outcome = await withTimeout(
            adapter.reverse({
                reversalId: claim.id,
                paymentId: claim.payment_id,
                pgCallbackId: claim.payment_pg_callback_id,
                amount: Number(claim.amount),
                idempotencyKey: claim.idempotency_key,
            }),
            options.timeoutMs ?? 15_000,
        );
    } catch {
        // Unknown outcome: never record a failure the PG did not report.
        return "UNKNOWN_OUTCOME";
    }

    if (outcome.kind === "SUCCEEDED") {
        await call(rpc, "complete_payment_reversal", {
            p_reversal_id: claim.id,
            p_succeeded: true,
            p_pg_reference: outcome.pgReference,
        });

        return "SUCCEEDED";
    }

    await call(rpc, "complete_payment_reversal", {
        p_reversal_id: claim.id,
        p_succeeded: false,
        p_failure_reason: outcome.reason,
    });

    return "FAILED";
}

/**
 * Development adapter. The PG Test service has no cancel/refund API, so the
 * outcome is simulated locally and forced by the caller. Never used for real
 * money.
 */
export function createSimulatedPgTestReversalAdapter(
    behavior: {
        outcome?: "SUCCESS" | "FAILURE" | "ERROR";
        delayMs?: number;
    } = {},
): PaymentReversalAdapter {
    return {
        async reverse(request) {
            if (behavior.delayMs) {
                await new Promise((resolve) => setTimeout(resolve, behavior.delayMs));
            }

            if (behavior.outcome === "ERROR") {
                throw new Error("Simulated PG network error");
            }

            if (behavior.outcome === "FAILURE") {
                return { kind: "FAILED", reason: "Simulated PG refusal" };
            }

            return {
                kind: "SUCCEEDED",
                pgReference: `sim-cancel-${request.idempotencyKey}`,
            };
        },
    };
}

/**
 * Placeholder for the production PG. Production PG integration is not part of
 * this phase: it throws, which is an unknown outcome, so the reversal stays
 * PENDING and nothing is ever marked FAILED or SUCCEEDED by mistake.
 */
export const productionPgReversalAdapter: PaymentReversalAdapter = {
    async reverse() {
        throw new Error("Production PG reversal is not configured.");
    },
};
