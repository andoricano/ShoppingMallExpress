// ============================================================
// Local verification: Mall v3 Refund request Route Handler (client-web) and the refund reversal failure/retry path
//
// Do not run directly: use  bash supabase/verification/v3_phase7_routes.sh
//
// Starts a mock PG Test recorder and `next dev` for client-web against the
// LOCAL Supabase stack, signs in a local test user, and drives the real HTTP
// routes: POST /api/checkout/payments (+confirm, finalize) to create Orders, then POST /api/orders/[orderId]/refund.
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
    const email = `v3p7-${label}-${randomUUID().slice(0, 8)}@example.test`;
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

const address = { recipient: "__v3p7routes", address: "Seoul" };
const item = (variant: string, quantity: number) => ({ productId: FX.product, productVariantId: variant, quantity });
const stockOf = async (id: string) => { const w = (await rest(`wares?id=eq.${id}`))[0]; return `${w.current_stock}/${w.reserved_stock}`; };
const orderRow = async (id: string) => (await rest(`orders?id=eq.${id}`))[0];
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
const itemOf = async (orderId: string) => (await rest(`order_items?order_id=eq.${orderId}`))[0].id as string;
const refundBody = (itemId: string, quantity: number, reason?: string) => ({ items: [{ orderItemId: itemId, quantity }], ...(reason ? { reason } : {}) });

try {
    if (!(await waitForApp())) {
        console.log("FAIL  client-web dev server did not start");
        console.log(nextLog.split("\n").slice(-15).join("\n"));
        process.exit(1);
    }

    const alice = await createUser("alice");
    const bob = await createUser("bob");

    // --- eligibility ---
    const pending = await newOrder(alice.token, FX.v1, 1);
    const pendingItem = await itemOf(pending.orderId);
    const rPending = await api(alice.token, `/api/orders/${pending.orderId}/refund`, refundBody(pendingItem, 1));
    check("BR-37: a PENDING Order cannot be refunded (409); no request is created",
        rPending.status === 409 && (await rest(`refund_requests?order_id=eq.${pending.orderId}`)).length === 0, rPending.status);

    const o1 = await newOrder(alice.token, FX.v1, 6);
    await rpc("admin_advance_order", { p_order_id: o1.orderId, p_next_status: "PROCESSING" });
    const i1 = await itemOf(o1.orderId);
    const stockAtProcessing = await stockOf(FX.w1);

    // --- S-19 partial and cumulative ---
    await rest(`product_variants?id=eq.${FX.v1}`, { method: "PATCH", body: JSON.stringify({ price: 9999 }) });
    const q1 = await api(alice.token, `/api/orders/${o1.orderId}/refund`, refundBody(i1, 2, "too small"));
    await rest(`product_variants?id=eq.${FX.v1}`, { method: "PATCH", body: JSON.stringify({ price: 1000 }) });
    const req1 = (await rest(`refund_requests?id=eq.${q1.body?.data?.refundRequestId}`))[0];
    check("S-19: 201 with only the request id; REQUESTED, priced at the immutable snapshot (2 x 1000)",
        q1.status === 201 && JSON.stringify(Object.keys(q1.body.data)) === JSON.stringify(["refundRequestId"])
        && req1.status === "REQUESTED" && Number(req1.requested_amount) === 2000, [q1.status, req1?.requested_amount]);
    const q2 = await api(alice.token, `/api/orders/${o1.orderId}/refund`, refundBody(i1, 3));
    const q3 = await api(alice.token, `/api/orders/${o1.orderId}/refund`, refundBody(i1, 2));
    check("S-19: 3 more is valid (5 of 6); 2 more is refused (409) and creates nothing",
        q2.status === 201 && q3.status === 409 && (await rest(`refund_requests?order_id=eq.${o1.orderId}`)).length === 2, [q2.status, q3.status]);

    // --- concurrent requests over HTTP ---
    const o2 = await newOrder(alice.token, FX.v1, 6);
    await rpc("admin_advance_order", { p_order_id: o2.orderId, p_next_status: "PROCESSING" });
    const i2 = await itemOf(o2.orderId);
    const many = await Promise.all(Array.from({ length: 10 }, () => api(alice.token, `/api/orders/${o2.orderId}/refund`, refundBody(i2, 1))));
    const valid = (await rest(`refund_items?order_item_id=eq.${i2}&select=quantity,refund_requests(status)`)) as any[];
    check("concurrent: 10 parallel requests of 1 on an item of 6 -> exactly six 201 and four 409",
        many.filter((r) => r.status === 201).length === 6 && many.filter((r) => r.status === 409).length === 4, many.map((r) => r.status));
    check("concurrent: the valid cumulative quantity is exactly 6", valid.length === 6 && valid.reduce((n, r) => n + r.quantity, 0) === 6, valid.length);

    // --- ownership, auth, input ---
    check("another Client cannot refund the Order (404)", (await api(bob.token, `/api/orders/${o1.orderId}/refund`, refundBody(i1, 1))).status === 404, "404");
    check("no session -> 401", (await api(null, `/api/orders/${o1.orderId}/refund`, refundBody(i1, 1))).status === 401, "401");
    check("a malformed order id -> 404", (await api(alice.token, "/api/orders/not-a-uuid/refund", refundBody(i1, 1))).status === 404, "404");
    check("malformed items -> 400", (await api(alice.token, `/api/orders/${o1.orderId}/refund`, { items: "x" })).status === 400, "400");
    check("an empty item list -> 400 (rejected by the RPC)", (await api(alice.token, `/api/orders/${o1.orderId}/refund`, { items: [] })).status === 400, "400");

    // --- approval + reversal, PG failure keeps the approval, retry (Admin path at RPC level) ---
    const admin = alice.id;   // any user id: the RPC only records the actor
    const stockBeforeApproval = await stockOf(FX.w1);
    const d1 = (await rpc("admin_decide_refund", { p_refund_request_id: req1.id, p_decision: "APPROVED", p_actor_id: admin })) as any;
    const rev = (await rest(`payment_reversals?id=eq.${d1.reversal_id}`))[0];
    check("approval: APPROVED + one REFUND reversal (PENDING, 2000) in one step; Order still PROCESSING; stock unchanged",
        d1.outcome === "APPROVED" && rev.reason_type === "REFUND" && rev.status === "PENDING" && Number(rev.amount) === 2000
        && (await orderRow(o1.orderId)).status === "PROCESSING" && (await stockOf(FX.w1)) === stockBeforeApproval, [d1.outcome, rev.status, await stockOf(FX.w1)]);
    check("approval: payments.status stays SUCCEEDED", (await rest(`payments?id=eq.${o1.paymentId}`))[0].status === "SUCCEEDED", "checked");

    const refused = await executePaymentReversal(localRpc, d1.reversal_id, createSimulatedPgTestReversalAdapter({ outcome: "FAILURE" }));
    const afterFail = (await rest(`refund_requests?id=eq.${req1.id}`))[0];
    check("PG refuses: the reversal is FAILED but the Refund stays APPROVED (never moved back)",
        refused === "FAILED" && afterFail.status === "APPROVED" && (await rest(`payment_reversals?id=eq.${d1.reversal_id}`))[0].status === "FAILED", refused);
    const d1b = (await rpc("admin_decide_refund", { p_refund_request_id: req1.id, p_decision: "APPROVED", p_actor_id: admin })) as any;
    check("a repeated approval after the PG failure: ALREADY_APPROVED, same reversal, still one reversal",
        d1b.outcome === "ALREADY_APPROVED" && d1b.reversal_id === d1.reversal_id
        && (await rest(`payment_reversals?refund_request_id=eq.${req1.id}`)).length === 1, d1b.outcome);
    await rpc("retry_payment_reversal", { p_reversal_id: d1.reversal_id, p_requested_by: admin });
    const slow = await executePaymentReversal(localRpc, d1.reversal_id, createSimulatedPgTestReversalAdapter({ delayMs: 500 }), { timeoutMs: 100 });
    check("PG delay: unknown outcome; the reversal stays PENDING and the Refund APPROVED",
        slow === "UNKNOWN_OUTCOME" && (await rest(`payment_reversals?id=eq.${d1.reversal_id}`))[0].status === "PENDING"
        && (await rest(`refund_requests?id=eq.${req1.id}`))[0].status === "APPROVED", slow);
    await rest(`payment_reversals?id=eq.${d1.reversal_id}`, { method: "PATCH", body: JSON.stringify({ last_attempted_at: new Date(Date.now() - 3600_000).toISOString() }) });
    const ok = await executePaymentReversal(localRpc, d1.reversal_id, createSimulatedPgTestReversalAdapter());
    const finalRev = (await rest(`payment_reversals?id=eq.${d1.reversal_id}`))[0];
    check("retry after the lease: the SAME reversal reaches SUCCEEDED (attempt 3); Payment still SUCCEEDED",
        ok === "SUCCEEDED" && finalRev.status === "SUCCEEDED" && finalRev.attempt_count === 3
        && (await rest(`payment_reversals?refund_request_id=eq.${req1.id}`)).length === 1
        && (await rest(`payments?id=eq.${o1.paymentId}`))[0].status === "SUCCEEDED", [ok, finalRev.attempt_count]);

    // --- explicit restock afterwards (Policy B) ---
    const ri = (await rest(`refund_items?refund_request_id=eq.${req1.id}`))[0].id as string;
    const [curBefore] = (await stockOf(FX.w1)).split("/").map(Number);
    const restock = (await rpc("admin_restock_refund_item", { p_refund_request_id: req1.id, p_refund_item_id: ri, p_ware_id: FX.w1, p_quantity: 2 })) as any;
    check("restock is explicit and only now raises current_stock (by 2); the Order status is unchanged",
        restock.quantity === 2 && (await stockOf(FX.w1)).startsWith(`${curBefore + 2}/`) && (await orderRow(o1.orderId)).status === "PROCESSING", await stockOf(FX.w1));
    const over = (await rpc("admin_restock_refund_item", { p_refund_request_id: req1.id, p_refund_item_id: ri, p_ware_id: FX.w1, p_quantity: 1 })) as any;
    check("over-restock is refused (nothing more to restock)", typeof over?.message === "string" && /exceeds/.test(over.message), over?.message);

    // --- rejection has no effect ---
    const rej = (await rpc("admin_decide_refund", { p_refund_request_id: (q2.body.data.refundRequestId), p_decision: "REJECTED", p_actor_id: admin })) as any;
    check("rejection: no reversal, Order unchanged", rej.outcome === "REJECTED"
        && (await rest(`payment_reversals?refund_request_id=eq.${q2.body.data.refundRequestId}`)).length === 0, rej.outcome);
} finally {
    await shutdown();
}

if (failed) {
    console.log("v3 phase 7 routes check FAILED");
    process.exit(1);
}
console.log("v3 phase 7 routes check PASSED");
process.exit(0);
