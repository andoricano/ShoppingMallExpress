// ============================================================
// Local verification: Mall v3 Consumer checkout flow (client-web lib/checkoutFlow.ts)
//
// Do not run directly: use  bash supabase/verification/v3_phase8_checkout_flow.sh
//
// Starts a mock PG Test recorder and `next dev` for client-web against the
// LOCAL Supabase stack, signs in a local test user, and drives the real HTTP
// routes: POST /api/checkout/payments (+confirm, finalize) to create Orders, driven through the flow module.
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
import { createCheckoutFlow, type CheckoutStore, type CheckoutTransport } from "../../apps/client-web/lib/checkoutFlow.ts";
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
    const email = `v3p8-${label}-${randomUUID().slice(0, 8)}@example.test`;
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

const address = { recipientName: "__v3p8flow", phone: "010", zonecode: "12345", address: "Seoul", addressDetail: null };
const line = (name: string, quantity: number) => ({ name, label: null, quantity });
const item = (variant: string, quantity: number) => ({ productId: FX.product, productVariantId: variant, quantity });
const stockOf = async (id: string) => { const w = (await rest(`wares?id=eq.${id}`))[0]; return `${w.current_stock}/${w.reserved_stock}`; };
const ordersOf = async (clientId: string) => rest(`orders?client_id=eq.${clientId}`);
const paymentRow = async (id: string) => (await rest(`payments?id=eq.${id}`))[0];

function memoryStore(): CheckoutStore & { raw: () => string | null } {
    let value: string | null = null;
    return { get: () => value, set: (v) => { value = v; }, remove: () => { value = null; }, raw: () => value };
}
const transportFor = (token: string): CheckoutTransport => (path, body) => api(token, path, body);

try {
    if (!(await waitForApp())) {
        console.log("FAIL  client-web dev server did not start");
        console.log(nextLog.split("\n").slice(-15).join("\n"));
        process.exit(1);
    }

    const alice = await createUser("alice");

    // 1. normal purchase through the flow
    const store1 = memoryStore();
    const flow = createCheckoutFlow(transportFor(alice.token), store1);
    const started = await flow.start([item(FX.v1, 2)], address, [line("v1", 2)]);
    check("start: STARTED with the server-determined amount; the Client holds the data; no Order exists yet",
        started.kind === "STARTED" && started.amount === 2000 && flow.state()?.items.length === 1
        && (await ordersOf(alice.id)).length === 0, started);
    const stockAfterStart = await stockOf(FX.w1);
    check("start: nothing is held on stock in Stage 1", stockAfterStart === "100/0", stockAfterStart);
    const paid = await flow.pay("SUCCESS");
    const fin = await flow.finalize();
    check("pay + finalize: the Order is created (PENDING) only now",
        paid.kind === "SUCCEEDED" && fin.kind === "ORDER" && fin.existing === false
        && (await ordersOf(alice.id)).length === 1 && (await ordersOf(alice.id))[0].status === "PENDING", [paid.kind, fin.kind]);
    check("finalize result carries only the order id and number (no stock/allocation/reversal detail)",
        fin.kind === "ORDER" && JSON.stringify(Object.keys(fin).sort()) === JSON.stringify(["existing", "kind", "orderId", "orderNumber"]), fin);

    // 2. double click / repeat finalize
    const fin2 = await flow.finalize();
    check("repeat finalize: the same Order, marked existing; still one Order and one allocation",
        fin2.kind === "ORDER" && fin.kind === "ORDER" && fin2.orderId === fin.orderId && fin2.existing === true
        && (await ordersOf(alice.id)).length === 1 && (await stockOf(FX.w1)) === "100/2", fin2);

    // 3. reload after paying: a new flow instance over the same held state resumes safely
    const store3 = memoryStore();
    const before = createCheckoutFlow(transportFor(alice.token), store3);
    await before.start([item(FX.v1, 1)], address, [line("v1", 1)]);
    await before.pay("SUCCESS");
    const afterReload = createCheckoutFlow(transportFor(alice.token), store3);     // the page was reloaded before finalize
    const resumedPay = await afterReload.pay("SUCCESS");
    const resumedFinal = await afterReload.finalize();
    check("reload: pay is a no-op on the succeeded Payment and finalize creates the one Order",
        resumedPay.kind === "SUCCEEDED" && resumedFinal.kind === "ORDER" && (await ordersOf(alice.id)).length === 2, [resumedPay.kind, resumedFinal.kind]);

    // 4. PG failure: terminal for that Payment; restart makes a new one (DN-20)
    const store4 = memoryStore();
    const flow4 = createCheckoutFlow(transportFor(alice.token), store4);
    await flow4.start([item(FX.v1, 1)], address, [line("v1", 1)]);
    const firstPaymentId = flow4.state()!.paymentId!;
    const failed = await flow4.pay("FAILURE");
    check("PG failure: PG_FAILED and the Payment is FAILED; no Order", failed.kind === "PG_FAILED"
        && (await paymentRow(firstPaymentId)).status === "FAILED" && (await ordersOf(alice.id)).length === 2, failed.kind);
    const restarted = await flow4.restart();
    const secondPaymentId = flow4.state()!.paymentId!;
    const paid4 = await flow4.pay("SUCCESS");
    const fin4 = await flow4.finalize();
    check("retry: restart creates a NEW Payment from the held data; the Order is created once",
        restarted.kind === "STARTED" && secondPaymentId !== firstPaymentId && paid4.kind === "SUCCEEDED" && fin4.kind === "ORDER"
        && (await ordersOf(alice.id)).length === 3 && (await paymentRow(firstPaymentId)).status === "FAILED", [restarted.kind, fin4.kind]);

    // 5. not sellable before the PG
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: true }) });
    const store5 = memoryStore();
    const flow5 = createCheckoutFlow(transportFor(alice.token), store5);
    const blocked = await flow5.start([item(FX.v2, 1)], address, [line("v2", 1)]);
    check("sold out before the PG: NOT_SELLABLE, no Payment, nothing held",
        blocked.kind === "NOT_SELLABLE" && store5.raw() === null
        && (await rest(`payments?client_id=eq.${alice.id}&amount=eq.500`)).length === 0, blocked.kind);
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: false }) });

    // 6. sold out after PG success -> REJECTED (no Order, the Payment is reversed)
    const store6 = memoryStore();
    const flow6 = createCheckoutFlow(transportFor(alice.token), store6);
    await flow6.start([item(FX.v2, 2)], address, [line("v2", 2)]);
    const paymentId6 = flow6.state()!.paymentId!;
    await flow6.pay("SUCCESS");
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: true }) });
    const rejected = await flow6.finalize();
    const rev6 = await rest(`payment_reversals?payment_id=eq.${paymentId6}`);
    check("sold out after PG success: REJECTED, the held data is cleared, no Order, one full reversal executed",
        rejected.kind === "REJECTED" && store6.raw() === null && (await ordersOf(alice.id)).length === 3
        && rev6.length === 1 && rev6[0].reason_type === "FINALIZE_FAILURE" && Number(rev6[0].amount) === 1000 && rev6[0].status === "SUCCEEDED", rejected.kind);
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ is_sold_out: false }) });

    // 7. price changed between checkout and finalize -> REJECTED
    const flow7 = createCheckoutFlow(transportFor(alice.token), memoryStore());
    await flow7.start([item(FX.v2, 2)], address, [line("v2", 2)]);
    await flow7.pay("SUCCESS");
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ price: 450 }) });
    const mismatch = await flow7.finalize();
    await rest(`product_variants?id=eq.${FX.v2}`, { method: "PATCH", body: JSON.stringify({ price: 500 }) });
    check("price changed after payment: REJECTED and no Order", mismatch.kind === "REJECTED" && (await ordersOf(alice.id)).length === 3, mismatch.kind);

    // 8. shortage is not an error
    const flow8 = createCheckoutFlow(transportFor(alice.token), memoryStore());
    await flow8.start([item(FX.vz, 5)], address, [line("vz", 5)]);          // Variant with no stock at all
    await flow8.pay("SUCCESS");
    const short = await flow8.finalize();
    check("a Variant with no stock still orders: the Order is created (shortage is internal)", short.kind === "ORDER", short.kind);

    // 9. transport failure keeps the held data; a retry works
    let down = true;
    const flaky: CheckoutTransport = (path, body) => down ? Promise.reject(new Error("network")) : api(alice.token, path, body);
    const store9 = memoryStore();
    const flow9 = createCheckoutFlow(flaky, store9);
    down = false;
    await flow9.start([item(FX.v1, 1)], address, [line("v1", 1)]);
    await flow9.pay("SUCCESS");
    down = true;
    const failedFinalize = await flow9.finalize();
    down = false;
    const retried = await flow9.finalize();
    check("network failure during finalize: ERROR, the held data is kept, the retry creates the one Order",
        failedFinalize.kind === "ERROR" && retried.kind === "ORDER" && store9.raw() !== null, [failedFinalize.kind, retried.kind]);

    check("no Order was created without a succeeded Payment", (await rest(`orders?client_id=eq.${alice.id}&select=id,payment_id`))
        .every((o: any) => o.payment_id), "checked");
} finally {
    await shutdown();
}

if (failed) {
    console.log("v3 phase 8 checkout flow check FAILED");
    process.exit(1);
}
console.log("v3 phase 8 checkout flow check PASSED");
process.exit(0);
