-- ============================================================
-- Mall v3 reconcile scheduler: DEACTIVATE / rollback (docs/mall1/v3/CUTOVER.md 3.3, 5)
--
-- Removes both Supabase Cron jobs. Idempotent: a job that does not exist is
-- skipped. Leaves the Vault entries and the support functions in place, so the
-- jobs can be activated again. Run on the user's instruction.
--
--   psql "$PROD_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/cutover/v3_reconcile_scheduler_deactivate.sql
--
-- To remove the secrets as well (after a rollback, or on rotation to a new
-- value), add `-v drop_secrets=1`: the two Vault entries are deleted.
-- A run already handed to pg_net is not recalled; the endpoint refuses a
-- request once its RECONCILE_JOB_SECRET is unset or changed.
-- ============================================================

\set ON_ERROR_STOP on
\if :{?drop_secrets}
\else
    \set drop_secrets 0
\endif

begin;

select cron.unschedule(j.jobid) as unscheduled, j.jobname
from cron.job j
where j.jobname in ('mall-v3-reconcile-orphans', 'mall-v3-reconcile-sweeper')
order by j.jobname;

\if :drop_secrets
    delete from vault.secrets where name in ('reconcile_endpoint_url', 'reconcile_job_secret');
\endif

commit;

select count(*) as remaining_reconcile_jobs
from cron.job
where jobname in ('mall-v3-reconcile-orphans', 'mall-v3-reconcile-sweeper');
