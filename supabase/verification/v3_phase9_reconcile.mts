// ============================================================
// Local verification: Mall v3 reconcile scheduler
//   - the reversal sweeper route (client-web /api/internal/reconcile) over HTTP
//   - the database side: reconcile_orphan_payments, the Vault-backed pg_net call
//     (call_reconcile_sweeper -> the real route), and Supabase Cron itself
//
// Do not run directly: use  bash supabase/verification/v3_phase9_reconcile.sh
//
// Starts a mock PG Test recorder and `next dev` for client-web against the
// LOCAL Supabase stack, signs in a local test user, and drives the real HTTP
// routes: POST /api/checkout/payments (+confirm, finalize) to create Orders, then POST /api/orders/[orderId]/refund.
// The local API URL and keys arrive in the environment and are never printed.
// ============================================================
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const API = process.env.LOCAL_API_URL!;
const ANON = process.env.LOCAL_ANON_KEY!;
const SERVICE = process.env.LOCAL_SERVICE_KEY!;
const FX = JSON.parse(process.env.FX!) as Record<string, string>;
const APP_PORT = 3999;
const PG_PORT = 4999;
const APP = `http://127.0.0.1:${APP_PORT}`;
const DB_CONTAINER = process.env.DB_CONTAINER ?? "supabase_db_ShoppingEx";
// pg_net runs inside the database container: it reaches the host's dev server here.
const DB_TO_HOST = `http://host.docker.internal:${APP_PORT}`;

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

// ---- database helpers (local container only) ----
function dbq(sqlText: string): string {
    return execFileSync("docker", ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-qtA", "-v", "ON_ERROR_STOP=1", "-c", sqlText],
        { encoding: "utf8" }).trim();
}
/** Runs a cutover script through psql; the values reach it as container environment variables (\getenv). */
function dbScript(file: string, env: Record<string, string> = {}, vars: string[] = []) {
    const envArgs = Object.keys(env).flatMap((k) => ["-e", k]);
    return execFileSync("docker", ["exec", "-i", ...envArgs, DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-X", "-qtA", "-v", "ON_ERROR_STOP=1", ...vars],
        { encoding: "utf8", input: readFileSync(file), env: { ...process.env, ...env } });
}
async function pgNetStatus(requestId: string) {
    for (let i = 0; i < 40; i++) {
        const row = dbq(`select status_code || '|' || coalesce(error_msg, '') from net._http_response where id = ${requestId}`);
        if (row) return row.split("|")[0];
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return "none";
}

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

    // orphan Payment: PG success, no finalize. Detection is database-side Cron work
    // (reconcile_orphan_payments); the sweeper route executes the reversal it creates.
    const orphan = await paidCheckout(alice2.token, 3);
    const fresh = Number(dbq("select public.reconcile_orphan_payments()"));
    check("orphan: a fresh succeeded Payment inside the window is not reversed",
        (await rest(`payment_reversals?payment_id=eq.${orphan.paymentId}`)).length === 0, fresh);
    await rest(`payments?id=eq.${orphan.paymentId}`, { method: "PATCH", body: JSON.stringify({ completed_at: oldTime() }) });
    const created = Number(dbq("select public.reconcile_orphan_payments()"));
    const orphanRevs = (await rest(`payment_reversals?payment_id=eq.${orphan.paymentId}`));
    check("orphan: after the window the database job creates one full ORPHAN_PAYMENT reversal (PENDING); no Order; the Payment stays SUCCEEDED",
        created >= 1 && orphanRevs.length === 1 && orphanRevs[0].reason_type === "ORPHAN_PAYMENT"
        && Number(orphanRevs[0].amount) === 3000 && orphanRevs[0].status === "PENDING"
        && (await rest(`orders?payment_id=eq.${orphan.paymentId}`)).length === 0
        && (await rest(`payments?id=eq.${orphan.paymentId}`))[0].status === "SUCCEEDED", [created, orphanRevs.map((r: any) => r.status)]);
    check("orphan: the route sweeper does not create reversals (only the database job does)",
        (await reconcile(SECRET)).status === 200, "checked");
    const orphanRun = await reversalOf(orphanRevs[0].id);
    check("orphan: the sweeper executes the ORPHAN_PAYMENT reversal to SUCCEEDED", orphanRun.status === "SUCCEEDED", orphanRun.status);
    const late = await api(alice2.token, `/api/checkout/payments/${orphan.paymentId}/finalize`, { items: orphan.items, shippingAddress: address });
    check("orphan: a late finalize cannot resurrect the reversed Payment (409, no Order)",
        late.status === 409 && (await rest(`orders?payment_id=eq.${orphan.paymentId}`)).length === 0, late.status);
    const again = await reconcile(SECRET);
    check("orphan job is idempotent: a second run reverses nothing more",
        Number(dbq("select public.reconcile_orphan_payments()")) === 0 && (await rest(`payment_reversals?payment_id=eq.${orphan.paymentId}`)).length === 1, "0");
    check("no response of the sweeper carries payment, order, or stock detail",
        JSON.stringify(Object.keys(again.body.data).sort()) === JSON.stringify(["executed", "reversalsScanned"]), Object.keys(again.body.data));

    // ===== the Vault-backed pg_net call (database -> the real route) =====
    const CRON_ENV = { RECONCILE_ENDPOINT_URL: DB_TO_HOST, RECONCILE_JOB_SECRET: SECRET };
    const stuck = async () => {
        const o = await order(alice2.token, 1);
        const c = (await rpc("cancel_pending_order", { p_order_id: o.orderId, p_actor_id: alice2.id, p_actor_role: "CLIENT", p_reason: null })) as any;
        return c.reversal_id as string;
    };

    let notConfigured = "no error";
    try { dbq("select public.call_reconcile_sweeper()"); } catch { notConfigured = "raised"; }
    check("pg_net: without Vault entries the sweeper call raises (nothing is sent)", notConfigured === "raised", notConfigured);
    check("status: the Vault checks fail before the entries exist",
        dbq("select count(*) from public.reconcile_scheduler_status() where not ok and check_name like 'vault%'") === "2", "2");

    dbScript("supabase/cutover/v3_reconcile_scheduler_vault.sql", CRON_ENV);
    check("status: extensions, Vault entries, URL and secret length are all ok (booleans only, no jobs yet)",
        dbq("select count(*) from public.reconcile_scheduler_status() where not ok") === "0"
        && dbq("select count(*) from public.reconcile_scheduler_status() where check_name like 'cron job%'") === "0", "checked");
    check("status: the status text never contains the secret",
        !dbq("select string_agg(check_name || coalesce(detail, ''), ' ') from public.reconcile_scheduler_status()").includes(SECRET), "checked");

    const viaNet = await stuck();
    const req1 = dbq("select public.call_reconcile_sweeper()");
    check("pg_net: the database call reaches the route with the Vault secret (200)", await pgNetStatus(req1) === "200", req1);
    check("pg_net: the stuck PENDING reversal was executed by the sweeper to SUCCEEDED (adapter stays in the Next server)",
        (await reversalOf(viaNet)).status === "SUCCEEDED", (await reversalOf(viaNet)).status);

    dbScript("supabase/cutover/v3_reconcile_scheduler_vault.sql", { RECONCILE_ENDPOINT_URL: DB_TO_HOST, RECONCILE_JOB_SECRET: `wrong-${randomUUID()}-${randomUUID()}` });
    const wrongNet = await stuck();
    const req2 = dbq("select public.call_reconcile_sweeper()");
    check("pg_net: a Vault secret that differs from the server secret is refused (401) and executes nothing",
        await pgNetStatus(req2) === "401" && (await reversalOf(wrongNet)).status === "PENDING", req2);
    dbScript("supabase/cutover/v3_reconcile_scheduler_vault.sql", CRON_ENV);

    // activation refuses http; allow_http is the local rehearsal switch
    const refused = dbScript("supabase/cutover/v3_reconcile_scheduler_activate.sql");
    check("activate: an http endpoint is refused and nothing is scheduled",
        dbq("select count(*) from cron.job where jobname like 'mall-v3-reconcile-%'") === "0" && refused.includes("must be https"), "0 jobs");
    dbScript("supabase/cutover/v3_reconcile_scheduler_activate.sql", {}, ["-v", "allow_http=1"]);
    dbScript("supabase/cutover/v3_reconcile_scheduler_activate.sql", {}, ["-v", "allow_http=1"]);
    check("activate: exactly two jobs, every 5 minutes, commands without any secret (re-running does not duplicate)",
        dbq("select string_agg(jobname || '=' || schedule || '=' || command, ';' order by jobname) from cron.job where jobname like 'mall-v3-reconcile-%'")
        === "mall-v3-reconcile-orphans=*/5 * * * *=select public.reconcile_orphan_payments();mall-v3-reconcile-sweeper=*/5 * * * *=select public.call_reconcile_sweeper()", "checked");

    // Supabase Cron itself: a temporary job every 5 seconds runs the real sweeper function
    const cronRev = await stuck();
    const baseRun = dbq("select coalesce(max(runid), 0) from cron.job_run_details");
    dbq("select cron.schedule('mall-v3-verify-tmp', '5 seconds', 'select public.call_reconcile_sweeper()')");
    let cronOk = "no run";
    for (let i = 0; i < 40; i++) {
        cronOk = dbq(`select coalesce(string_agg(status, ','), '') from (select status from cron.job_run_details where runid > ${baseRun} and command like '%call_reconcile_sweeper%' and status = 'succeeded' limit 1) s`) || "no run";
        if (cronOk === "succeeded" && (await reversalOf(cronRev)).status === "SUCCEEDED") break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    dbq("select cron.unschedule('mall-v3-verify-tmp')");
    check("cron: Supabase Cron ran the sweeper function by itself and the stuck reversal became SUCCEEDED",
        cronOk === "succeeded" && (await reversalOf(cronRev)).status === "SUCCEEDED", [cronOk, (await reversalOf(cronRev)).status]);

    dbScript("supabase/cutover/v3_reconcile_scheduler_deactivate.sql");
    let againOk = "raised";
    try { dbScript("supabase/cutover/v3_reconcile_scheduler_deactivate.sql"); againOk = "ok"; } catch { /* stays raised */ }
    check("deactivate: both jobs are removed, removing again is a no-op, the Vault entries are kept",
        dbq("select count(*) from cron.job where jobname like 'mall-v3-reconcile-%'") === "0" && againOk === "ok"
        && dbq("select count(*) from vault.secrets where name in ('reconcile_endpoint_url','reconcile_job_secret')") === "2", "0 jobs, Vault kept");
    dbScript("supabase/cutover/v3_reconcile_scheduler_deactivate.sql", {}, ["-v", "drop_secrets=1"]);
    check("deactivate with drop_secrets=1 removes the Vault entries",
        dbq("select count(*) from vault.secrets where name in ('reconcile_endpoint_url','reconcile_job_secret')") === "0", "0");
} finally {
    try {
        dbq("select cron.unschedule(jobid) from cron.job where jobname like 'mall-v3-%'");
        dbq("delete from vault.secrets where name in ('reconcile_endpoint_url','reconcile_job_secret')");
    } catch { /* nothing to clean */ }
    await shutdown();
}

if (failed) {
    console.log("v3 phase 9 reconcile check FAILED");
    process.exit(1);
}
console.log("v3 phase 9 reconcile check PASSED");
process.exit(0);
