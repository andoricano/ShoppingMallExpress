import "server-only";

/**
 * Server-to-server adapter for the PG Test recorder
 * (docs/mall1/v2/payment-contract.md). The recorder only stores the result
 * reported by the Mall; it never decides Mall state. PG_TEST_API_KEY and
 * PG_TEST_ENDPOINT_URL are server-only environment variables.
 */

const SAAS_NAME = "mall-v2";
const TIMEOUT_MS = 10_000;

export class PgTestError extends Error {}

export interface PgTestRecord {
    id: string;
    isSuccess: boolean;
    amount: number;
    callbackId: string;
}

export async function recordPgTestPayment(input: {
    /** Mall payment id (payments.id). */
    id: string;
    isSuccess: boolean;
    /** Server-determined payment amount. */
    amount: number;
}): Promise<PgTestRecord> {
    const endpoint = process.env.PG_TEST_ENDPOINT_URL;
    const apiKey = process.env.PG_TEST_API_KEY;

    if (!endpoint || !apiKey) {
        throw new PgTestError("PG test integration is not configured.");
    }

    let response: Response;

    try {
        response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-PG-Test-Key": apiKey,
            },
            body: JSON.stringify({
                saasName: SAAS_NAME,
                id: input.id,
                isSuccess: input.isSuccess,
                amount: input.amount,
                date: new Date().toISOString(),
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch {
        throw new PgTestError("PG test service is unreachable.");
    }

    if (response.status !== 201) {
        throw new PgTestError(`PG test service rejected the request (${response.status}).`);
    }

    const body = await response.json().catch(() => null) as Partial<PgTestRecord> | null;

    // The record must describe exactly the payment the Mall reported.
    if (
        !body
        || body.id !== input.id
        || body.isSuccess !== input.isSuccess
        || body.amount !== input.amount
        || typeof body.callbackId !== "string"
        || body.callbackId.length === 0
    ) {
        throw new PgTestError("PG test service returned an unexpected record.");
    }

    return {
        id: body.id,
        isSuccess: body.isSuccess,
        amount: body.amount,
        callbackId: body.callbackId,
    };
}
