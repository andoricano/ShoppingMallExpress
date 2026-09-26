// ============================================================
// Local verification: Mall v3 checkout Route Handlers (client-web)
//
// Do not run directly: use  bash supabase/verification/v3_phase4_routes.sh
//
// Starts a mock PG Test recorder and `next dev` for client-web against the
// LOCAL Supabase stack, signs in a local test user, and drives the real HTTP
// routes: POST /api/checkout/payments, .../confirm, .../finalize.
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
    const email = `v3p4-${label}-${randomUUID().slice(0, 8)}@example.test`;
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

const address = { recipient: "__v3p4routes", address: "Seoul" };
const item = (variant: string, quantity: number) => ({ productId: FX.product, productVariantId: variant, quantity });
const orderOf = async (paymentId: string) => (await rest(`orders?payment_id=eq.${paymentId}`))[0];
const paymentOf = async (paymentId: string) => (await rest(`payments?id=eq.${paymentId}`))[0];
const reversalsOf = async (paymentId: string) => rest(`payment_reversals?payment_id=eq.${paymentId}`);
async function pay(token: string, items: unknown[], result: "SUCCESS" | "FAILURE" = "SUCCESS") {
    const created = await api(token, "/api/checkout/payments", { items });
    if (created.status !== 201) return { created };
    const confirmed = await api(token, `/api/checkout/payments/${created.body.data.id}/confirm`, { testResult: result });
    return { created, confirmed, id: created.body.data.id as string };
}

try {
    if (!(await waitForApp())) {
        console.log("FAIL  client-web dev server did not start");
        console.log(nextLog.split("\n").slice(-15).join("\n"));
        process.exit(1);
    }

    const alice = await createUser("alice");
    const bob = await createUser("bob");

    // auth
    check("auth: POST /api/checkout/payments without a session -> 401", (await api(null, "/api/checkout/payments", { items: [] })).status === 401, "401");

    // 1. normal purchase
    const p1 = await pay(alice.token, [item(FX.v1, 2)]);
    check("stage 1: 201 with a PENDING Payment of the server-determined amount, no Order yet",
        p1.created.status === 201 && p1.created.body.data.amount === 2000 && p1.created.body.data.status === "PENDING"
        && (await orderOf(p1.id!)) === undefined, [p1.created.status, p1.created.body?.data?.amount]);
    check("confirm: the mock PG recorded exactly this payment and the Payment is SUCCEEDED",
        p1.confirmed!.body.data.status === "SUCCEEDED" && pgRecords.some((r) => r.id === p1.id && r.amount === 2000 && r.isSuccess),
        p1.confirmed!.body.data.status);
    const f1 = await api(alice.token, `/api/checkout/payments/${p1.id}/finalize`, { items: [item(FX.v1, 2)], shippingAddress: address });
    const o1 = await orderOf(p1.id!);
    check("1 normal purchase: 201 CREATED and a PENDING Order linked to the Payment",
        f1.status === 201 && f1.body.data.outcome === "CREATED" && o1?.status === "PENDING" && o1.id === f1.body.data.orderId
        && Number(o1.total_amount) === 2000, [f1.status, f1.body.data?.outcome]);
    check("1 normal purchase: the response carries no stock/allocation/shortage/reversal detail",
        JSON.stringify(Object.keys(f1.body.data).sort()) === JSON.stringify(["orderId", "orderNumber", "outcome"]),
        Object.keys(f1.body.data));

    // 5. duplicate finalize
    const f1b = await api(alice.token, `/api/checkout/payments/${p1.id}/finalize`, { items: [item(FX.v1, 2)], shippingAddress: address });
    check("5 duplicate finalize: 200 EXISTING with the same Order", f1b.status === 200 && f1b.body.data.outcome === "EXISTING"
        && f1b.body.data.orderId === f1.body.data.orderId, [f1b.status, f1b.body.data?.outcome]);
    const repeatConfirm = await api(alice.token, `/api/checkout/payments/${p1.id}/confirm`, { testResult: "FAILURE" });
    check("S-11: a repeated confirm is a no-op (still SUCCEEDED, PG not called again)",
        repeatConfirm.body.data.status === "SUCCEEDED" && pgRecords.filter((r) => r.id === p1.id).length === 1, repeatConfirm.body.data.status);

    const p5 = await pay(alice.token, [item(FX.v1, 1)]);
    const many = await Promise.all(Array.from({ length: 6 }, () =>
        api(alice.token, `/api/checkout/payments/${p5.id}/finalize`, { items: [item(FX.v1, 1)], shippingAddress: address })));
    const orders5 = await rest(`orders?payment_id=eq.${p5.id}`);
    check("5 concurrent finalize over HTTP: one 201, five 200, exactly one Order",
        many.filter((r) => r.status === 201).length === 1 && many.filter((r) => r.status === 200).length === 5 && orders5.length === 1,
        many.map((r) => r.status));

    // 2. shortage-tolerant purchase (v2: stock 10; two Orders of 6)
    const pa = await pay(alice.token, [item(FX.vs, 6)]);
    const pb = await pay(bob.token, [item(FX.vs, 6)]);
    const fa = await api(alice.token, `/api/checkout/payments/${pa.id}/finalize`, { items: [item(FX.vs, 6)], shippingAddress: address });
    const fb = await api(bob.token, `/api/checkout/payments/${pb.id}/finalize`, { items: [item(FX.vs, 6)], shippingAddress: address });
    const shortB = (await rpc("get_order_shortage", { p_order_id: fb.body.data.orderId }))[0];
    const ware = (await rest(`wares?id=eq.${FX.ws}`))[0];
    check("2 shortage purchase: both Orders are created PENDING; B has shortage 2; the Ware is 10/10",
        fa.status === 201 && fb.status === 201 && Number(shortB.shortage_quantity) === 2
        && ware.current_stock === 10 && ware.reserved_stock === 10, [fa.status, fb.status, shortB.shortage_quantity, ware.reserved_stock]);
    check("2 shortage purchase: the Consumer response shows no shortage", !JSON.stringify(fb.body).includes("shortage"), "checked");

    // 3. SOLD_OUT: before the PG, and after PG success
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: true }) });
    const soldOutBefore = await api(alice.token, "/api/checkout/payments", { items: [item(FX.v2, 1)] });
    check("3 SOLD_OUT before the PG: 409, no Payment", soldOutBefore.status === 409
        && (await rest(`payments?client_id=eq.${alice.id}&amount=eq.500`)).length === 0, soldOutBefore.status);
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: false }) });
    const p3 = await pay(alice.token, [item(FX.v2, 2)]);
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: true }) });
    const f3 = await api(alice.token, `/api/checkout/payments/${p3.id}/finalize`, { items: [item(FX.v2, 2)], shippingAddress: address });
    const r3 = await reversalsOf(p3.id!);
    check("3 SOLD_OUT after PG success: 409 REJECTED, no Order, one full FINALIZE_FAILURE reversal executed to SUCCEEDED",
        f3.status === 409 && f3.body.data.reason === "NOT_SELLABLE" && (await orderOf(p3.id!)) === undefined
        && r3.length === 1 && r3[0].reason_type === "FINALIZE_FAILURE" && Number(r3[0].amount) === 1000 && r3[0].status === "SUCCEEDED",
        [f3.status, r3.map((r: any) => [r.reason_type, r.amount, r.status])]);
    check("3 SOLD_OUT after PG success: payments.status stays SUCCEEDED (BR-29)", (await paymentOf(p3.id!)).status === "SUCCEEDED", "checked");
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: false }) });
    const f3b = await api(alice.token, `/api/checkout/payments/${p3.id}/finalize`, { items: [item(FX.v2, 2)], shippingAddress: address });
    check("3 SOLD_OUT: a late finalize cannot resurrect the rejected Payment", f3b.status === 409 && (await orderOf(p3.id!)) === undefined
        && (await reversalsOf(p3.id!)).length === 1, f3b.status);

    // 4. price mismatch
    const p4 = await pay(alice.token, [item(FX.v2, 2)]);            // 1000
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ price: 450 }) });
    const f4 = await api(alice.token, `/api/checkout/payments/${p4.id}/finalize`, { items: [item(FX.v2, 2)], shippingAddress: address });
    const r4 = await reversalsOf(p4.id!);
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ price: 500 }) });
    check("4 price mismatch: 409 PRICE_MISMATCH, no Order, one full reversal (executed)",
        f4.status === 409 && f4.body.data.reason === "PRICE_MISMATCH" && (await orderOf(p4.id!)) === undefined
        && r4.length === 1 && Number(r4[0].amount) === 1000 && r4[0].status === "SUCCEEDED", [f4.status, r4.map((r: any) => [r.amount, r.status])]);

    // PG failure (S-08) and other clients
    const pf = await pay(alice.token, [item(FX.v1, 1)], "FAILURE");
    check("S-08 PG failure: the Payment is FAILED and finalize is refused (409), no Order",
        pf.confirmed!.body.data.status === "FAILED"
        && (await api(alice.token, `/api/checkout/payments/${pf.id}/finalize`, { items: [item(FX.v1, 1)], shippingAddress: address })).status === 409
        && (await orderOf(pf.id!)) === undefined, pf.confirmed!.body.data.status);
    const notMine = await api(bob.token, `/api/checkout/payments/${p1.id}/finalize`, { items: [item(FX.v1, 2)], shippingAddress: address });
    check("another client cannot finalize or read the Payment (404)", notMine.status === 404, notMine.status);
    const bad = await api(alice.token, "/api/checkout/payments", { items: [] });
    check("malformed request -> 400", bad.status === 400, bad.status);

    const allOrders = await rest(`orders?client_id=in.(${alice.id},${bob.id})&select=id,payment_id`);
    const ids = allOrders.map((o: any) => o.payment_id).join(",");
    const linked = await rest(`payments?id=in.(${ids})&select=id,status`);
    check("no v3 Order exists without a SUCCEEDED Payment",
        allOrders.length > 0 && allOrders.every((o: any) => o.payment_id) && linked.length === allOrders.length
        && linked.every((p: any) => p.status === "SUCCEEDED"), [allOrders.length, linked.length]);
} finally {
    await shutdown();
}

if (failed) {
    console.log("v3 phase 4 routes check FAILED");
    process.exit(1);
}
console.log("v3 phase 4 routes check PASSED");
process.exit(0);
