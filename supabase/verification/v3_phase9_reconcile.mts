// ============================================================
// Local verification: Mall v3 reconcile job (client-web /api/internal/reconcile)
//
// Do not run directly: use  bash supabase/verification/v3_phase9_reconcile.sh
//
// Starts a mock PG Test recorder and `next dev` for client-web against the
// LOCAL Supabase stack, signs in a local test user, and drives the real HTTP
// routes: POST /api/checkout/payments (+confirm, finalize) to create Orders, then POST /api/orders/[orderId]/refund.
// The local API URL and keys arrive in the environment and are never printed.
// ============================================================
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const API = process.env.LOCAL_API_URL!;
const ANON = process.env.LOCAL_ANON_KEY!;
const SERVICE = process.env.LOCAL_SERVICE_KEY!;
const FX = JSON.parse(process.env.FX!) as Record<string, string>;
const APP_PORT = 3999;
const PG_PORT = 4999;
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

// ---- Next dev server (restarted with different environments) ----
const SECRET = `reconcile-${randomUUID()}-${randomUUID()}`;
let next: ChildProcess | null = null;
let nextLog = "";

async function startServer(extra: Record<string, string>) {
    next = spawn("npx", ["--no-install", "next", "dev", "-p", String(APP_PORT)], {
        cwd: "apps/client-web",
        env: {
            ...process.env,
            NEXT_PUBLIC_SUPABASE_URL: API,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
            SUPABASE_SECRET_KEY: SERVICE,
            PG_TEST_ENDPOINT_URL: `http://127.0.0.1:${PG_PORT}/record`,
            PG_TEST_API_KEY: "local-mock",
            NEXT_TELEMETRY_DISABLED: "1",
            ...extra,
        },
        stdio: ["ignore", "pipe", "pipe"],
    });
    next.stdout?.on("data", (d) => (nextLog += d));
    next.stderr?.on("data", (d) => (nextLog += d));

    if (!(await waitForApp())) {
        console.log("FAIL  client-web dev server did not start");
        console.log(nextLog.split("\n").slice(-15).join("\n"));
        process.exit(1);
    }
}

async function stopServer() {
    next?.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 2500));
}

async function shutdown() {
    await stopServer();
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
    const email = `v3p9-${label}-${randomUUID().slice(0, 8)}@example.test`;
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

const address = { recipientName: "__v3p9recon", phone: "010", zonecode: "12345", address: "Seoul", addressDetail: null };
const item = (variant: string, quantity: number) => ({ productId: FX.product, productVariantId: variant, quantity });
const reconcile = (secret: string | null) => fetch(`${APP}/api/internal/reconcile`, {
    method: "POST", headers: secret ? { Authorization: `Bearer ${secret}` } : {},
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) as any }));
const reversalOf = async (id: string) => (await rest(`payment_reversals?id=eq.${id}`))[0];
const oldTime = () => new Date(Date.now() - 2 * 3600_000).toISOString();

async function paidCheckout(token: string, quantity: number) {
    const items = [item(FX.v1, quantity)];
    const created = await api(token, "/api/checkout/payments", { items });
    await api(token, `/api/checkout/payments/${created.body.data.id}/confirm`, { testResult: "SUCCESS" });
    return { paymentId: created.body.data.id as string, items };
}
async function order(token: string, quantity: number) {
    const paid = await paidCheckout(token, quantity);
    const fin = await api(token, `/api/checkout/payments/${paid.paymentId}/finalize`, { items: paid.items, shippingAddress: address });
    return { paymentId: paid.paymentId, orderId: fin.body.data.orderId as string };
}

try {
    // ===== server A: no PG adapter configured (the production default) =====
    await startServer({ RECONCILE_JOB_SECRET: SECRET });
    const alice = await createUser("alice");

    check("reconcile: no credentials -> 401", (await reconcile(null)).status === 401, "401");
    check("reconcile: a wrong secret -> 401", (await reconcile("wrong-secret-wrong-secret-wrong")).status === 401, "401");

    const o1 = await order(alice.token, 2);
    const c1 = await api(alice.token, `/api/orders/${o1.orderId}/cancel`, {});
    const rev1 = (await rest(`payment_reversals?order_id=eq.${o1.orderId}`))[0];
    check("no adapter configured: the cancel succeeds but the reversal stays PENDING (unknown outcome, never settled by mistake)",
        c1.status === 200 && rev1.status === "PENDING" && rev1.attempt_count === 1, [c1.status, rev1.status, rev1.attempt_count]);

    const inLease = await reconcile(SECRET);
    check("reconcile: a reversal inside its lease is not executed again", inLease.status === 200
        && (await reversalOf(rev1.id)).attempt_count === 1, [inLease.status, inLease.body?.data?.executed]);

    await rest(`payment_reversals?id=eq.${rev1.id}`, { method: "PATCH", body: JSON.stringify({ last_attempted_at: oldTime() }) });
    const noAdapter = await reconcile(SECRET);
    const afterNoAdapter = await reversalOf(rev1.id);
    check("reconcile without an adapter: the attempt is counted, the outcome is unknown, the reversal stays PENDING",
        noAdapter.status === 200 && afterNoAdapter.status === "PENDING" && afterNoAdapter.attempt_count === 2 && noAdapter.body.data.executed.UNKNOWN_OUTCOME >= 1,
        [afterNoAdapter.status, afterNoAdapter.attempt_count, noAdapter.body?.data?.executed]);

    await rest(`payment_reversals?id=eq.${rev1.id}`, { method: "PATCH", body: JSON.stringify({ attempt_count: 5, last_attempted_at: oldTime() }) });
    const exhausted = await reconcile(SECRET);
    check("reconcile: a reversal with 5 automatic attempts is left for an Admin (not executed)",
        exhausted.status === 200 && (await reversalOf(rev1.id)).attempt_count === 5, [(await reversalOf(rev1.id)).attempt_count]);
    await stopServer();

    // ===== server B: the job disabled (no secret) =====
    await startServer({});
    check("reconcile: without RECONCILE_JOB_SECRET the job is disabled (503)", (await reconcile(SECRET)).status === 503, "503");
    await stopServer();

    // ===== server C: simulated adapter (PG test mode) =====
    await startServer({ RECONCILE_JOB_SECRET: SECRET, PG_REVERSAL_ADAPTER: "simulated" });
    const alice2 = await createUser("alice2");

    await rest(`payment_reversals?id=eq.${rev1.id}`, { method: "PATCH", body: JSON.stringify({ attempt_count: 0, last_attempted_at: oldTime() }) });
    const pendingRun = await reconcile(SECRET);
    check("reconcile with the simulated adapter: a stuck PENDING reversal is executed to SUCCEEDED (the same reversal)",
        pendingRun.status === 200 && (await reversalOf(rev1.id)).status === "SUCCEEDED"
        && (await rest(`payment_reversals?order_id=eq.${o1.orderId}`)).length === 1, [pendingRun.body?.data]);

    // a FAILED reversal is never retried automatically
    const o2 = await order(alice2.token, 1);
    const cancelRpc = (await rpc("cancel_pending_order", { p_order_id: o2.orderId, p_actor_id: alice2.id, p_actor_role: "CLIENT", p_reason: null })) as any;
    await rpc("claim_payment_reversal", { p_reversal_id: cancelRpc.reversal_id });
    await rpc("complete_payment_reversal", { p_reversal_id: cancelRpc.reversal_id, p_succeeded: false, p_failure_reason: "PG refused" });
    await reconcile(SECRET);
    check("reconcile: a FAILED reversal stays FAILED (an Admin retries it)", (await reversalOf(cancelRpc.reversal_id)).status === "FAILED", "checked");

    // orphan Payment: PG success, no finalize
    const orphan = await paidCheckout(alice2.token, 3);
    const fresh = await reconcile(SECRET);
    check("orphan: a fresh succeeded Payment inside the window is not reversed",
        fresh.status === 200 && (await rest(`payment_reversals?payment_id=eq.${orphan.paymentId}`)).length === 0, fresh.body?.data?.orphansReversed);
    await rest(`payments?id=eq.${orphan.paymentId}`, { method: "PATCH", body: JSON.stringify({ completed_at: oldTime() }) });
    const orphanRun = await reconcile(SECRET);
    const orphanRev = (await rest(`payment_reversals?payment_id=eq.${orphan.paymentId}`));
    check("orphan: after the window a full ORPHAN_PAYMENT reversal is created and executed; no Order; the Payment stays SUCCEEDED",
        orphanRun.body.data.orphansReversed >= 1 && orphanRev.length === 1 && orphanRev[0].reason_type === "ORPHAN_PAYMENT"
        && Number(orphanRev[0].amount) === 3000 && orphanRev[0].status === "SUCCEEDED"
        && (await rest(`orders?payment_id=eq.${orphan.paymentId}`)).length === 0
        && (await rest(`payments?id=eq.${orphan.paymentId}`))[0].status === "SUCCEEDED", [orphanRun.body.data, orphanRev.map((r: any) => r.status)]);
    const late = await api(alice2.token, `/api/checkout/payments/${orphan.paymentId}/finalize`, { items: orphan.items, shippingAddress: address });
    check("orphan: a late finalize cannot resurrect the reversed Payment (409, no Order)",
        late.status === 409 && (await rest(`orders?payment_id=eq.${orphan.paymentId}`)).length === 0, late.status);
    const again = await reconcile(SECRET);
    check("reconcile is idempotent: a second run reverses nothing more",
        again.body.data.orphansReversed === 0 && (await rest(`payment_reversals?payment_id=eq.${orphan.paymentId}`)).length === 1, again.body?.data);
    check("no response of the job carries payment, order, or stock detail",
        JSON.stringify(Object.keys(again.body.data).sort()) === JSON.stringify(["executed", "orphansReversed", "reversalsScanned"]), Object.keys(again.body.data));
} finally {
    await shutdown();
}

if (failed) {
    console.log("v3 phase 9 reconcile check FAILED");
    process.exit(1);
}
console.log("v3 phase 9 reconcile check PASSED");
process.exit(0);
