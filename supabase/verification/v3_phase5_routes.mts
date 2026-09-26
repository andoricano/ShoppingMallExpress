// ============================================================
// Local verification: Mall v3 Cancel Route Handler (client-web) and the reversal failure path
//
// Do not run directly: use  bash supabase/verification/v3_phase5_routes.sh
//
// Starts a mock PG Test recorder and `next dev` for client-web against the
// LOCAL Supabase stack, signs in a local test user, and drives the real HTTP
// routes: POST /api/checkout/payments (+confirm, finalize) to create Orders, then POST /api/orders/[orderId]/cancel.
// The local API URL and keys arrive in the environment and are never printed.
// ============================================================
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const API = process.env.LOCAL_API_URL!;
const ANON = process.env.LOCAL_ANON_KEY!;
const SERVICE = process.env.LOCAL_SERVICE_KEY!;
const FX = JSON.parse(process.env.FX!) as Record<string, string>;
const APP_PORT = 3999;
const PG_PORT = 4999;
import {
    createSimulatedPgTestReversalAdapter,
    executePaymentReversal,
    type RpcCaller,
} from "../../apps/client-web/lib/payment/reversal.ts";
const APP = `http://127.0.0.1:${APP_PORT}`;

let failed = 0;
function check(name: string, ok: boolean, detail: unknown) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name} (got ${JSON.stringify(detail)})`);
    if (!ok) failed = 1;
}

// ---- mock PG Test recorder (the real one only records) ----
const pgRecords: any[] = [];
const pg = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
        const body = JSON.parse(raw || "{}");
        const record = { id: body.id, isSuccess: body.isSuccess, amount: body.amount, callbackId: `mock-${randomUUID()}` };
        pgRecords.push(record);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(record));
    });
});
await new Promise<void>((resolve) => pg.listen(PG_PORT, "127.0.0.1", resolve));

// ---- Next dev server ----
const next = spawn("npx", ["--no-install", "next", "dev", "-p", String(APP_PORT)], {
    cwd: "apps/client-web",
    env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: API,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
        SUPABASE_SECRET_KEY: SERVICE,
        PG_TEST_ENDPOINT_URL: `http://127.0.0.1:${PG_PORT}/record`,
        PG_TEST_API_KEY: "local-mock",
        PG_REVERSAL_ADAPTER: "simulated",
        NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
});
let nextLog = "";
next.stdout.on("data", (d) => (nextLog += d));
next.stderr.on("data", (d) => (nextLog += d));

async function shutdown() {
    next.kill("SIGTERM");
    pg.close();
}

async function waitForApp() {
    for (let i = 0; i < 90; i++) {
        try {
            const r = await fetch(`${APP}/api/checkout/payments`, { method: "POST" });
            if (r.status === 401) return true;
        } catch { /* not up yet */ }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return false;
}

// ---- helpers ----
const svc = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" };
async function rest(path: string, init: RequestInit = {}) {
    const r = await fetch(`${API}/rest/v1/${path}`, { ...init, headers: { ...svc, ...(init.headers as object) } });
    return r.json().catch(() => null) as Promise<any>;
}
async function rpc(fn: string, args: object) {
    const r = await fetch(`${API}/rest/v1/rpc/${fn}`, { method: "POST", headers: svc, body: JSON.stringify(args) });
    return r.json().catch(() => null) as Promise<any>;
}
async function createUser(label: string) {
    const email = `v3p5-${label}-${randomUUID().slice(0, 8)}@example.test`;
    const password = `pw-${randomUUID()}`;
    const created = await fetch(`${API}/auth/v1/admin/users`, {
        method: "POST", headers: svc, body: JSON.stringify({ email, password, email_confirm: true }),
    }).then((r) => r.json());
    const session = await fetch(`${API}/auth/v1/token?grant_type=password`, {
        method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    }).then((r) => r.json());
    return { id: created.id as string, token: session.access_token as string };
}
async function api(token: string | null, path: string, body?: unknown) {
    const r = await fetch(`${APP}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, body: (await r.json().catch(() => null)) as any };
}

const address = { recipient: "__v3p5routes", address: "Seoul" };
const item = (variant: string, quantity: number) => ({ productId: FX.product, productVariantId: variant, quantity });
const wareOf = async (id: string) => (await rest(`wares?id=eq.${id}`))[0];
const stockOf = async (id: string) => { const w = await wareOf(id); return `${w.current_stock}/${w.reserved_stock}`; };
const orderRow = async (id: string) => (await rest(`orders?id=eq.${id}`))[0];
const reversalsOfOrder = async (id: string) => rest(`payment_reversals?order_id=eq.${id}`);
const allocRows = async (orderId: string) => (await rest(`order_items?order_id=eq.${orderId}&select=id,order_item_ware_allocations(id)`))
    .flatMap((i: any) => i.order_item_ware_allocations).length;
const localRpc: RpcCaller = async (fn, args) => {
    const r = await fetch(`${API}/rest/v1/rpc/${fn}`, { method: "POST", headers: svc, body: JSON.stringify(args) });
    const b = await r.json().catch(() => null);
    return r.ok ? { data: b, error: null } : { data: null, error: { message: b?.message ?? `HTTP ${r.status}` } };
};

async function newOrder(token: string, variant: string, quantity: number) {
    const items = [item(variant, quantity)];
    const created = await api(token, "/api/checkout/payments", { items });
    await api(token, `/api/checkout/payments/${created.body.data.id}/confirm`, { testResult: "SUCCESS" });
    const fin = await api(token, `/api/checkout/payments/${created.body.data.id}/finalize`, { items, shippingAddress: address });
    return { paymentId: created.body.data.id as string, orderId: fin.body.data.orderId as string };
}

try {
    if (!(await waitForApp())) {
        console.log("FAIL  client-web dev server did not start");
        console.log(nextLog.split("\n").slice(-15).join("\n"));
        process.exit(1);
    }

    const alice = await createUser("alice");
    const bob = await createUser("bob");

    // --- S-12 Client cancel over HTTP ---
    const o1 = await newOrder(alice.token, FX.v1, 4);
    check("setup: the Order is PENDING with 4 reserved (10/4)", (await orderRow(o1.orderId)).status === "PENDING" && (await stockOf(FX.w1)) === "10/4", await stockOf(FX.w1));
    const c1 = await api(alice.token, `/api/orders/${o1.orderId}/cancel`, { reason: "changed my mind" });
    const rev1 = await reversalsOfOrder(o1.orderId);
    check("S-12 cancel: 200 CANCELLED, the Order is CANCELLED, allocation released once (10/0), rows removed",
        c1.status === 200 && c1.body.data.outcome === "CANCELLED" && (await orderRow(o1.orderId)).status === "CANCELLED"
        && (await stockOf(FX.w1)) === "10/0" && (await allocRows(o1.orderId)) === 0, [c1.status, c1.body?.data?.outcome, await stockOf(FX.w1)]);
    check("S-12 cancel: one full ORDER_CANCEL reversal, executed after the commit to SUCCEEDED (simulated PG)",
        rev1.length === 1 && rev1[0].reason_type === "ORDER_CANCEL" && Number(rev1[0].amount) === 4000 && rev1[0].status === "SUCCEEDED",
        rev1.map((r: any) => [r.reason_type, r.amount, r.status]));
    check("S-12 cancel: payments.status stays SUCCEEDED (BR-29)", (await rest(`payments?id=eq.${o1.paymentId}`))[0].status === "SUCCEEDED", "checked");
    check("S-12 cancel: the response carries only the outcome and the order id",
        JSON.stringify(Object.keys(c1.body.data).sort()) === JSON.stringify(["orderId", "outcome"]), Object.keys(c1.body.data));

    // --- S-15 repeat ---
    const c1b = await api(alice.token, `/api/orders/${o1.orderId}/cancel`, {});
    check("S-15 repeat: 200 ALREADY_CANCELLED, no second release, no second reversal",
        c1b.status === 200 && c1b.body.data.outcome === "ALREADY_CANCELLED" && (await stockOf(FX.w1)) === "10/0"
        && (await reversalsOfOrder(o1.orderId)).length === 1, [c1b.status, c1b.body?.data?.outcome]);

    // --- concurrent double click over HTTP ---
    const o2 = await newOrder(alice.token, FX.v1, 3);
    const many = await Promise.all(Array.from({ length: 6 }, () => api(alice.token, `/api/orders/${o2.orderId}/cancel`, {})));
    check("double click: 6 concurrent cancels all return 200; one CANCELLED, five ALREADY_CANCELLED",
        many.every((r) => r.status === 200) && many.filter((r) => r.body.data.outcome === "CANCELLED").length === 1
        && many.filter((r) => r.body.data.outcome === "ALREADY_CANCELLED").length === 5, many.map((r) => r.body?.data?.outcome));
    check("double click: one release (10/0) and one reversal", (await stockOf(FX.w1)) === "10/0" && (await reversalsOfOrder(o2.orderId)).length === 1, await stockOf(FX.w1));

    // --- shortage Order (S-30) ---
    const oa = await newOrder(alice.token, FX.vs, 6);
    const ob = await newOrder(bob.token, FX.vs, 6);
    const cb = await api(bob.token, `/api/orders/${ob.orderId}/cancel`, {});
    const revb = await reversalsOfOrder(ob.orderId);
    check("S-30 shortage Order: cancel releases only the allocated 4 (10/6) and reverses the full 600",
        cb.status === 200 && (await stockOf(FX.ws)) === "10/6" && revb.length === 1 && Number(revb[0].amount) === 600, [cb.status, await stockOf(FX.ws)]);
    check("BR-28: the other Order keeps its allocation; nothing is pushed to anyone", (await allocRows(oa.orderId)) === 1, "checked");

    // --- ownership, auth, input ---
    const o3 = await newOrder(alice.token, FX.v1, 1);
    check("another Client cannot cancel (404) and the Order stays PENDING",
        (await api(bob.token, `/api/orders/${o3.orderId}/cancel`, {})).status === 404 && (await orderRow(o3.orderId)).status === "PENDING", "404");
    check("no session -> 401", (await api(null, `/api/orders/${o3.orderId}/cancel`, {})).status === 401, "401");
    check("a malformed order id -> 404", (await api(alice.token, "/api/orders/not-a-uuid/cancel", {})).status === 404, "404");
    check("a non-string reason -> 400", (await api(alice.token, `/api/orders/${o3.orderId}/cancel`, { reason: 5 })).status === 400, "400");
    check("a reason over 500 characters -> 400 and the Order stays PENDING",
        (await api(alice.token, `/api/orders/${o3.orderId}/cancel`, { reason: "x".repeat(501) })).status === 400 && (await orderRow(o3.orderId)).status === "PENDING", "400");

    // --- S-32: no Cancel after PROCESSING ---
    const o4 = await newOrder(alice.token, FX.v1, 2);
    await rpc("consume_order_allocation", { p_order_id: o4.orderId });
    await rest(`orders?id=eq.${o4.orderId}`, { method: "PATCH", body: JSON.stringify({ status: "PROCESSING" }) });
    const stockBefore = await stockOf(FX.w1);
    const c4 = await api(alice.token, `/api/orders/${o4.orderId}/cancel`, {});
    check("S-32: a PROCESSING Order cannot be cancelled (409); nothing changes",
        c4.status === 409 && (await orderRow(o4.orderId)).status === "PROCESSING" && (await stockOf(FX.w1)) === stockBefore
        && (await reversalsOfOrder(o4.orderId)).length === 0, [c4.status, c4.body?.message]);

    // --- S-27: the PG reversal fails or is slow; the cancel is never repeated ---
    // The reversal is created by the RPC (as the route does) but executed here with forced PG behavior.
    const o5 = await newOrder(alice.token, FX.v1, 3);
    const cancelRpc = (await rpc("cancel_pending_order", { p_order_id: o5.orderId, p_actor_id: alice.id, p_actor_role: "CLIENT", p_reason: null })) as any;
    const reversalId = cancelRpc.reversal_id as string;
    const afterCancel = await stockOf(FX.w1);

    const refused = await executePaymentReversal(localRpc, reversalId, createSimulatedPgTestReversalAdapter({ outcome: "FAILURE" }));
    check("S-27 PG refuses: the reversal is FAILED; the Order stays CANCELLED; payments.status SUCCEEDED",
        refused === "FAILED" && (await reversalsOfOrder(o5.orderId))[0].status === "FAILED" && (await orderRow(o5.orderId)).status === "CANCELLED"
        && (await rest(`payments?id=eq.${o5.paymentId}`))[0].status === "SUCCEEDED", refused);
    const repeatAfterFail = await api(alice.token, `/api/orders/${o5.orderId}/cancel`, {});
    check("S-27 a repeated cancel after the PG failure: 200 ALREADY_CANCELLED; no second release, no second reversal",
        repeatAfterFail.status === 200 && repeatAfterFail.body.data.outcome === "ALREADY_CANCELLED"
        && (await stockOf(FX.w1)) === afterCancel && (await reversalsOfOrder(o5.orderId)).length === 1, [repeatAfterFail.status, await stockOf(FX.w1)]);

    await rpc("retry_payment_reversal", { p_reversal_id: reversalId, p_requested_by: alice.id });
    const timedOut = await executePaymentReversal(localRpc, reversalId, createSimulatedPgTestReversalAdapter({ delayMs: 500 }), { timeoutMs: 100 });
    check("S-27 PG delay/timeout: unknown outcome; the reversal stays PENDING (never marked failed or succeeded)",
        timedOut === "UNKNOWN_OUTCOME" && (await reversalsOfOrder(o5.orderId))[0].status === "PENDING", timedOut);
    const insideLease = await api(alice.token, `/api/orders/${o5.orderId}/cancel`, {});
    check("S-27 a retry inside the lease does not call the PG again and repeats nothing",
        insideLease.status === 200 && (await reversalsOfOrder(o5.orderId))[0].status === "PENDING" && (await stockOf(FX.w1)) === afterCancel, insideLease.status);
    await rest(`payment_reversals?id=eq.${reversalId}`, { method: "PATCH", body: JSON.stringify({ last_attempted_at: new Date(Date.now() - 3600_000).toISOString() }) });
    const laterRetry = await api(alice.token, `/api/orders/${o5.orderId}/cancel`, {});
    const finalRev = (await reversalsOfOrder(o5.orderId))[0];
    check("S-27 a retry after the lease (retry after a timeout): the route re-drives the SAME reversal to SUCCEEDED",
        laterRetry.status === 200 && finalRev.status === "SUCCEEDED" && finalRev.attempt_count === 3
        && (await reversalsOfOrder(o5.orderId)).length === 1 && (await stockOf(FX.w1)) === afterCancel, [laterRetry.status, finalRev.status, finalRev.attempt_count]);

    // --- invariants ---
    const cancelledOrders = await rest(`orders?client_id=in.(${alice.id},${bob.id})&status=eq.CANCELLED&select=id`);
    const revCounts = await Promise.all(cancelledOrders.map(async (o: any) => (await reversalsOfOrder(o.id)).length));
    check("every cancelled Order has exactly one ORDER_CANCEL reversal", cancelledOrders.length > 0 && revCounts.every((n: number) => n === 1), revCounts);
} finally {
    await shutdown();
}

if (failed) {
    console.log("v3 phase 5 routes check FAILED");
    process.exit(1);
}
console.log("v3 phase 5 routes check PASSED");
process.exit(0);
