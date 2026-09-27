-- ============================================================
-- Mall v3 reconcile scheduler: ACTIVATE (docs/mall1/v3/CUTOVER.md 3.3)
--
-- Creates the two Supabase Cron jobs. Run once, at the cutover step that
-- enables the scheduler (after the v3 deployment is promoted and the production
-- E2E passed), on the user's explicit instruction. Not part of any migration.
--
--   psql "$PROD_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/cutover/v3_reconcile_scheduler_activate.sql
--
-- Refuses (and creates nothing) unless the Vault entries exist, the secret is
-- long enough, and the endpoint is https. A local rehearsal passes
-- `-v allow_http=1` for its http://host.docker.internal endpoint.
--
--   mall-v3-reconcile-orphans   every 5 minutes  select public.reconcile_orphan_payments()
--   mall-v3-reconcile-sweeper   every 5 minutes  select public.call_reconcile_sweeper()
--
-- Neither command contains a secret: the sweeper reads Vault inside the
-- function. Re-running replaces the jobs (same name), never duplicates them.
-- The Vault entries come from v3_reconcile_scheduler_vault.sql. Undo with
-- v3_reconcile_scheduler_deactivate.sql.
-- ============================================================

\set ON_ERROR_STOP on
\if :{?allow_http}
\else
    \set allow_http 0
\endif

begin;

do $$
declare
    v_missing text;
begin
    select string_agg(check_name, ', ')
    into v_missing
    from public.reconcile_scheduler_status()
    where check_name not like 'cron job %'
      and not ok;

    if v_missing is not null then
        raise exception 'Reconcile scheduler is not ready, failing checks: %', v_missing;
    end if;
end;
$$;

select coalesce(detail = 'https', false) as is_https
from public.reconcile_scheduler_status()
where check_name = 'endpoint URL is a base URL' \gset

\if :is_https
\elif :allow_http
    \echo 'allow_http=1: activating with an http endpoint (local rehearsal only).'
\else
    rollback;
    \echo 'The endpoint URL must be https for a production activation. Nothing was scheduled.'
    \quit
\endif

select cron.schedule('mall-v3-reconcile-orphans', '*/5 * * * *', 'select public.reconcile_orphan_payments()') is not null as orphans_scheduled;
select cron.schedule('mall-v3-reconcile-sweeper', '*/5 * * * *', 'select public.call_reconcile_sweeper()') is not null as sweeper_scheduled;

commit;

select check_name, ok, detail from public.reconcile_scheduler_status() where check_name like 'cron job %';
