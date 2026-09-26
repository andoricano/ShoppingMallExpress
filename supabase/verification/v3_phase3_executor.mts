// ============================================================
// Local verification: payment reversal executor with the simulated PG adapter
// (apps/client-web/lib/payment/reversal.ts)
//
// Do not run directly: use  bash supabase/verification/v3_phase3_executor.sh
// which prepares fixtures and passes the LOCAL API URL / service key in the
// environment (never printed).
//
// Forces a PG refusal, a PG delay beyond the timeout, a network error, and the
// unconfigured production placeholder, and checks what the reversal and the
// Payment look like afterwards.
// ============================================================
import {
    createSimulatedPgTestReversalAdapter,
    executePaymentReversal,
    productionPgReversalAdapter,
    type PaymentReversalAdapter,
    type PgReversalRequest,
    type RpcCaller,
} from "../../apps/client-web/lib/payment/reversal.ts";

const API_URL = process.env.LOCAL_API_URL!;
const KEY = process.env.LOCAL_SERVICE_KEY!;
const PAYMENT = process.env.FX_PAYMENT!;
const REVERSALS = JSON.parse(process.env.FX_REVERSALS!) as Record<string, string>;

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const rpc: RpcCaller = async (fn, args) => {
    const response = await fetch(`${API_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers,
        body: JSON.stringify(args),
    });
    const body = await response.json().catch(() => null);

    return response.ok
        ? { data: body, error: null }
        : { data: null, error: { message: body?.message ?? `HTTP ${response.status}` } };
};

async function rows<T>(path: string): Promise<T[]> {
    const response = await fetch(`${API_URL}/rest/v1/${path}`, { headers });
    return (await response.json()) as T[];
}

const reversal = async (id: string) =>
    (await rows<Record<string, any>>(`payment_reversals?id=eq.${id}`))[0];
const paymentStatus = async () =>
    (await rows<Record<string, any>>(`payments?id=eq.${PAYMENT}`))[0].status;

function counting(adapter: PaymentReversalAdapter) {
    const seen: PgReversalRequest[] = [];
    return {
        seen,
        adapter: {
            reverse: (request: PgReversalRequest) => {
                seen.push(request);
                return adapter.reverse(request);
            },
        } as PaymentReversalAdapter,
    };
}

let failed = 0;
function check(name: string, ok: boolean, detail: unknown) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name} (got ${JSON.stringify(detail)})`);
    if (!ok) failed = 1;
}

// 1. simulated success
{
    const c = counting(createSimulatedPgTestReversalAdapter());
    const result = await executePaymentReversal(rpc, REVERSALS.ok, c.adapter);
    const r = await reversal(REVERSALS.ok);
    check("success: SUCCEEDED with the PG reference", result === "SUCCEEDED" && r.status === "SUCCEEDED"
        && r.pg_reference === `sim-cancel-${r.idempotency_key}` && r.completed_at !== null, [result, r.status, r.pg_reference]);
    check("success: the PG request carried the idempotency key and amount",
        c.seen.length === 1 && c.seen[0].idempotencyKey === r.idempotency_key && c.seen[0].amount === 1000, c.seen.length);
    check("success: payments.status is still SUCCEEDED (BR-29)", (await paymentStatus()) === "SUCCEEDED", await paymentStatus());

    const again = counting(createSimulatedPgTestReversalAdapter());
    const second = await executePaymentReversal(rpc, REVERSALS.ok, again.adapter);
    check("repeat: a SUCCEEDED reversal is not sent to the PG again", second === "NOT_PENDING" && again.seen.length === 0, [second, again.seen.length]);
}

// 2. simulated PG refusal
{
    const c = counting(createSimulatedPgTestReversalAdapter({ outcome: "FAILURE" }));
    const result = await executePaymentReversal(rpc, REVERSALS.refused, c.adapter);
    const r = await reversal(REVERSALS.refused);
    check("refusal: FAILED with the reason, no completion", result === "FAILED" && r.status === "FAILED"
        && r.failure_reason === "Simulated PG refusal" && r.completed_at === null, [result, r.status, r.failure_reason]);
    check("refusal: payments.status is still SUCCEEDED", (await paymentStatus()) === "SUCCEEDED", await paymentStatus());
    const summary = (await rpc("get_payment_reversal_summary", { p_payment_id: PAYMENT })).data as any[];
    // 1,000 succeeded (ok); 3,000 still pending (slow, error, prod); the refused 1,000 no longer occupies amount.
    check("refusal: the failed amount is reversible again (only the 3 other PENDING reversals occupy amount)",
        Number(summary[0].pending_amount) === 3000 && Number(summary[0].reversible_amount) === 96000, summary[0]);

    // retry on the same row, then succeed
    await rpc("retry_payment_reversal", { p_reversal_id: REVERSALS.refused });
    const retried = await executePaymentReversal(rpc, REVERSALS.refused, counting(createSimulatedPgTestReversalAdapter()).adapter);
    const r2 = await reversal(REVERSALS.refused);
    check("retry: the same reversal succeeds on the second attempt", retried === "SUCCEEDED" && r2.status === "SUCCEEDED"
        && r2.attempt_count === 2, [retried, r2.status, r2.attempt_count]);
}

// 3. PG delay beyond the timeout, then recovery after the lease
{
    const slow = counting(createSimulatedPgTestReversalAdapter({ delayMs: 600 }));
    const result = await executePaymentReversal(rpc, REVERSALS.slow, slow.adapter, { timeoutMs: 100, leaseSeconds: 1 });
    const r = await reversal(REVERSALS.slow);
    check("delay: an answer after the timeout is an unknown outcome; the reversal stays PENDING",
        result === "UNKNOWN_OUTCOME" && r.status === "PENDING" && r.attempt_count === 1, [result, r.status, r.attempt_count]);
    check("delay: payments.status untouched", (await paymentStatus()) === "SUCCEEDED", await paymentStatus());

    const blocked = counting(createSimulatedPgTestReversalAdapter());
    const immediate = await executePaymentReversal(rpc, REVERSALS.slow, blocked.adapter, { leaseSeconds: 1 });
    check("delay: a run inside the lease does not call the PG again", immediate === "NOT_CLAIMED" && blocked.seen.length === 0, [immediate, blocked.seen.length]);

    await new Promise((resolve) => setTimeout(resolve, 1300));
    const recovered = counting(createSimulatedPgTestReversalAdapter());
    const later = await executePaymentReversal(rpc, REVERSALS.slow, recovered.adapter, { leaseSeconds: 1 });
    const r2 = await reversal(REVERSALS.slow);
    check("delay: after the lease the reversal is retried with the same idempotency key and succeeds",
        later === "SUCCEEDED" && r2.attempt_count === 2 && recovered.seen[0].idempotencyKey === r2.idempotency_key, [later, r2.attempt_count]);
}

// 4. network error
{
    const result = await executePaymentReversal(rpc, REVERSALS.error, createSimulatedPgTestReversalAdapter({ outcome: "ERROR" }));
    const r = await reversal(REVERSALS.error);
    check("error: a thrown error is an unknown outcome; PENDING, no failure recorded",
        result === "UNKNOWN_OUTCOME" && r.status === "PENDING" && r.failure_reason === null, [result, r.status]);
}

// 5. production placeholder
{
    const result = await executePaymentReversal(rpc, REVERSALS.prod, productionPgReversalAdapter);
    const r = await reversal(REVERSALS.prod);
    check("production placeholder: not configured -> unknown outcome, PENDING, nothing recorded",
        result === "UNKNOWN_OUTCOME" && r.status === "PENDING" && r.pg_reference === null, [result, r.status]);
}

check("payments.status is SUCCEEDED after every scenario", (await paymentStatus()) === "SUCCEEDED", await paymentStatus());

if (failed) {
    console.log("v3 phase 3 executor check FAILED");
    process.exit(1);
}
console.log("v3 phase 3 executor check PASSED");
