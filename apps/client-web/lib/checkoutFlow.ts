/**
 * Mall v3 Consumer checkout flow (docs/mall1/v3 BR-01, BR-44, BR-45; Phase 8).
 *
 * Stage 1 data (items, address, display lines) is held by the Client, here in
 * a session store. The server records only the Payment. The steps are:
 *
 *   start     POST /api/checkout/payments            -> a PENDING Payment
 *   pay       POST /api/checkout/payments/:id/confirm  (PG test mode)
 *   finalize  POST /api/checkout/payments/:id/finalize -> the Order, or a
 *             rejection (no Order; the whole Payment is reversed)
 *
 * Every step is safe to repeat (a completed Payment is returned as is; a repeat
 * finalize returns the same Order), so a reload or a double click never creates
 * a second Order. A PG failure is terminal for that Payment: `restart` begins a
 * new attempt from the held data (DN-20). The Consumer only ever sees coarse
 * outcomes: no stock, allocation, shortage, or reversal detail (BR-20, DN-19).
 *
 * No React and no framework imports: the transport and the store are injected,
 * so the flow can be exercised without a browser.
 */
import type { CheckoutItemInput, PaymentTestResult } from "@mall/types";

export interface CheckoutLine {
    name: string;
    label: string | null;
    quantity: number;
}

export interface CheckoutState {
    items: CheckoutItemInput[];
    shippingAddress: Record<string, unknown>;
    /** Display only (names); never sent to the server. */
    lines: CheckoutLine[];
    paymentId: string | null;
    amount: number | null;
}

export interface CheckoutStore {
    get(): string | null;
    set(value: string): void;
    remove(): void;
}

/** The `{ data, message }` envelope of the checkout Route Handlers. */
export interface CheckoutEnvelope {
    data?: {
        id?: string;
        amount?: number | string;
        status?: string;
        orderId?: string;
        orderNumber?: string | null;
        outcome?: string;
    };
    message?: string;
}

export type CheckoutTransport = (
    path: string,
    body: unknown,
) => Promise<{ status: number; body: CheckoutEnvelope | null }>;

export type StartResult =
    | { kind: "STARTED"; amount: number }
    /** A sold-out / sale-disabled / unpublished item: refused before the PG. */
    | { kind: "NOT_SELLABLE" }
    | { kind: "ERROR" };

export type PayResult =
    | { kind: "SUCCEEDED" }
    /** The PG reported a failure; this Payment is over, `restart` starts another. */
    | { kind: "PG_FAILED" }
    | { kind: "ERROR" };

export type FinalizeResult =
    | { kind: "ORDER"; orderId: string; orderNumber: string | null; existing: boolean }
    /** No Order was created and the whole Payment is being cancelled. */
    | { kind: "REJECTED" }
    /** The Payment has not succeeded (yet). */
    | { kind: "NOT_PAID" }
    | { kind: "ERROR" };

export function createCheckoutFlow(transport: CheckoutTransport, store: CheckoutStore) {
    const read = (): CheckoutState | null => {
        try {
            const raw = store.get();
            return raw ? JSON.parse(raw) as CheckoutState : null;
        } catch {
            return null;
        }
    };

    const write = (state: CheckoutState) => store.set(JSON.stringify(state));

    const start = async (
        items: CheckoutItemInput[],
        shippingAddress: Record<string, unknown>,
        lines: CheckoutLine[],
    ): Promise<StartResult> => {
        try {
            const response = await transport("/api/checkout/payments", { items });

            const created = response.body?.data;

            if (response.status === 201 && created?.id) {
                write({
                    items,
                    shippingAddress,
                    lines,
                    paymentId: created.id,
                    amount: Number(created.amount),
                });

                return { kind: "STARTED", amount: Number(created.amount) };
            }

            return response.status === 409 ? { kind: "NOT_SELLABLE" } : { kind: "ERROR" };
        } catch {
            return { kind: "ERROR" };
        }
    };

    const pay = async (testResult: PaymentTestResult): Promise<PayResult> => {
        const state = read();

        if (!state?.paymentId) {
            return { kind: "ERROR" };
        }

        try {
            const response = await transport(
                `/api/checkout/payments/${state.paymentId}/confirm`,
                { testResult },
            );
            const status = response.body?.data?.status;

            if (response.status === 200 && status === "SUCCEEDED") return { kind: "SUCCEEDED" };
            if (response.status === 200 && status === "FAILED") return { kind: "PG_FAILED" };

            return { kind: "ERROR" };
        } catch {
            return { kind: "ERROR" };
        }
    };

    const finalize = async (): Promise<FinalizeResult> => {
        const state = read();

        if (!state?.paymentId) {
            return { kind: "ERROR" };
        }

        try {
            const response = await transport(
                `/api/checkout/payments/${state.paymentId}/finalize`,
                { items: state.items, shippingAddress: state.shippingAddress },
            );
            const data = response.body?.data;

            if ((response.status === 201 || response.status === 200) && data?.orderId) {
                return {
                    kind: "ORDER",
                    orderId: data.orderId,
                    orderNumber: data.orderNumber ?? null,
                    existing: response.status === 200,
                };
            }

            if (response.status === 409 && data?.outcome === "REJECTED") {
                store.remove();
                return { kind: "REJECTED" };
            }

            return response.status === 409 ? { kind: "NOT_PAID" } : { kind: "ERROR" };
        } catch {
            return { kind: "ERROR" };
        }
    };

    /** A new attempt from the held data after a PG failure (DN-20). */
    const restart = async (): Promise<StartResult> => {
        const state = read();

        return state ? start(state.items, state.shippingAddress, state.lines) : { kind: "ERROR" };
    };

    return {
        state: read,
        start,
        pay,
        finalize,
        restart,
        clear: () => store.remove(),
    };
}
