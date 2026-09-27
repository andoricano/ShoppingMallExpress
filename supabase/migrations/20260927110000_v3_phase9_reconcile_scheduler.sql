-- ============================================================
-- Mall v3 Phase 9: reconcile scheduler support (docs/mall1/v3/CUTOVER.md 3.3)
--
-- Two recurring jobs, both run by Supabase Cron (pg_cron):
--
--   1. orphan payments   public.reconcile_orphan_payments()
--                        pure database work (reverse_orphan_payments)
--   2. reversal sweeper  public.call_reconcile_sweeper()
--                        pg_net POST to the client-web /api/internal/reconcile
--                        with the secret read from Supabase Vault. The PG call
--                        and the reversal execution stay in the Next server.
--
-- THIS MIGRATION SCHEDULES NOTHING. It only prepares the extensions and the
-- support functions. The jobs are created at the cutover, on the user's
-- instruction, by supabase/cutover/v3_reconcile_scheduler_activate.sql (and
-- removed by ..._deactivate.sql). No secret is created or stored here: the
-- endpoint URL and the secret are Vault entries created by
-- supabase/cutover/v3_reconcile_scheduler_vault.sql.
--
-- Vault entry names: reconcile_endpoint_url, reconcile_job_secret.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault;

-- ------------------------------------------------------------
-- 1. Orphan payments (no HTTP, no secret)
-- ------------------------------------------------------------
-- An Order-less SUCCEEDED ORDER_PAYMENT older than 30 minutes gets its full
-- ORPHAN_PAYMENT reversal (reverse_orphan_payments); executing that reversal is
-- the sweeper's job. Idempotent: an orphan that already has a FINALIZE_FAILURE
-- or ORPHAN_PAYMENT reversal is skipped, concurrent runs skip locked rows.
create or replace function public.reconcile_orphan_payments()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_count integer;
begin
    select count(*)
    into v_count
    from public.reverse_orphan_payments(interval '30 minutes', 100);

    return v_count;
end;
$$;

-- ------------------------------------------------------------
-- 2. Reversal sweeper (pg_net -> Next server)
-- ------------------------------------------------------------
-- Returns the pg_net request id. The HTTP call is asynchronous: its outcome is
-- in net._http_response, never in this function. A missing or malformed Vault
-- entry raises (the failure is visible in cron.job_run_details); the message
-- never contains a value.
create or replace function public.call_reconcile_sweeper()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_url text;
    v_secret text;
    v_request_id bigint;
begin
    select s.decrypted_secret into v_url
    from vault.decrypted_secrets s
    where s.name = 'reconcile_endpoint_url';

    select s.decrypted_secret into v_secret
    from vault.decrypted_secrets s
    where s.name = 'reconcile_job_secret';

    if v_url is null or v_secret is null then
        raise exception 'Reconcile scheduler is not configured: Vault entries missing';
    end if;

    if v_url !~ '^https?://[^/[:space:]]+/?$' then
        raise exception 'Reconcile scheduler is not configured: endpoint URL must be a base URL';
    end if;

    if length(v_secret) < 24 then
        raise exception 'Reconcile scheduler is not configured: secret too short';
    end if;

    select net.http_post(
        url := rtrim(v_url, '/') || '/api/internal/reconcile',
        body := '{}'::jsonb,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_secret
        ),
        timeout_milliseconds := 120000
    )
    into v_request_id;

    return v_request_id;
end;
$$;

-- ------------------------------------------------------------
-- 3. Readiness / activation status (booleans only, never a value)
-- ------------------------------------------------------------
create or replace function public.reconcile_scheduler_status()
returns table (
    check_name text,
    ok boolean,
    detail text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_url text;
    v_secret text;
    v_job record;
begin
    select s.decrypted_secret into v_url
    from vault.decrypted_secrets s
    where s.name = 'reconcile_endpoint_url';

    select s.decrypted_secret into v_secret
    from vault.decrypted_secrets s
    where s.name = 'reconcile_job_secret';

    check_name := 'extension pg_cron';
    ok := exists (select 1 from pg_extension where extname = 'pg_cron');
    detail := null;
    return next;

    check_name := 'extension pg_net';
    ok := exists (select 1 from pg_extension where extname = 'pg_net');
    return next;

    check_name := 'vault entry reconcile_endpoint_url';
    ok := v_url is not null;
    return next;

    check_name := 'endpoint URL is a base URL';
    ok := coalesce(v_url ~ '^https?://[^/[:space:]]+/?$', false);
    detail := case
        when v_url ~ '^https://' then 'https'
        when v_url ~ '^http://' then 'http (allowed for local only)'
        else null
    end;
    return next;

    check_name := 'vault entry reconcile_job_secret';
    ok := v_secret is not null;
    detail := null;
    return next;

    check_name := 'secret length >= 24';
    ok := coalesce(length(v_secret) >= 24, false);
    return next;

    for v_job in
        select j.jobname, j.schedule, j.active
        from cron.job j
        where j.jobname in ('mall-v3-reconcile-orphans', 'mall-v3-reconcile-sweeper')
        order by j.jobname
    loop
        check_name := 'cron job ' || v_job.jobname;
        ok := v_job.active;
        detail := v_job.schedule;
        return next;
    end loop;
end;
$$;

-- Only the owner (the role the cron jobs and the cutover scripts run as) may
-- call these: they read Vault. Nothing is exposed through the API roles.
revoke all on function public.reconcile_orphan_payments()
    from public, anon, authenticated, service_role;
revoke all on function public.call_reconcile_sweeper()
    from public, anon, authenticated, service_role;
revoke all on function public.reconcile_scheduler_status()
    from public, anon, authenticated, service_role;
