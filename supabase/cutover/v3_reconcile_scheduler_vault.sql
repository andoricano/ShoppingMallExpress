-- ============================================================
-- Mall v3 reconcile scheduler: store the endpoint URL and the secret in Vault
-- (docs/mall1/v3/CUTOVER.md 3.3). Run once, on the user's instruction, before
-- v3_reconcile_scheduler_activate.sql. It schedules nothing.
--
--   export RECONCILE_ENDPOINT_URL='https://<client-web production base URL>'
--   read -rs RECONCILE_JOB_SECRET && export RECONCILE_JOB_SECRET
--   psql "$PROD_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/cutover/v3_reconcile_scheduler_vault.sql
--
-- The secret must be the same value as the RECONCILE_JOB_SECRET server variable
-- of client-web, at least 24 characters. Both values are read from the
-- environment by psql itself and sent as bind parameters: they are not in this
-- file, not on the command line, not echoed, and not part of a statement text
-- that the server could log on an error. Needs psql 16 or later (\bind).
--
-- Running it again replaces both entries (rotation). Requires the v3
-- reconcile scheduler migration (20260927110000).
-- ============================================================

\set ON_ERROR_STOP on
\getenv reconcile_endpoint_url RECONCILE_ENDPOINT_URL
\getenv reconcile_job_secret RECONCILE_JOB_SECRET

select :{?reconcile_endpoint_url} and :{?reconcile_job_secret} as both_set \gset
\if :both_set
\else
    \echo 'RECONCILE_ENDPOINT_URL and RECONCILE_JOB_SECRET must both be set in the environment.'
    \quit
\endif

begin;

-- Guards (a failure names the rule, never the value).
select $1 ~ '^https?://[^/[:space:]]+/?$' as url_ok \bind :reconcile_endpoint_url \gset
\if :url_ok
\else
    rollback;
    \echo 'RECONCILE_ENDPOINT_URL must be a base URL like https://host (no path).'
    \quit
\endif

select length($1) >= 24 as secret_ok \bind :reconcile_job_secret \gset
\if :secret_ok
\else
    rollback;
    \echo 'RECONCILE_JOB_SECRET must be at least 24 characters.'
    \quit
\endif

delete from vault.secrets where name in ('reconcile_endpoint_url', 'reconcile_job_secret');

select 'endpoint stored' as result, (vault.create_secret($1, 'reconcile_endpoint_url', 'Mall v3 reconcile: client-web base URL') is not null) as ok
    \bind :reconcile_endpoint_url \g
select 'secret stored' as result, (vault.create_secret($1, 'reconcile_job_secret', 'Mall v3 reconcile: bearer secret of /api/internal/reconcile') is not null) as ok
    \bind :reconcile_job_secret \g

commit;

\unset reconcile_endpoint_url
\unset reconcile_job_secret
\echo 'Vault entries stored. Verify with: select * from public.reconcile_scheduler_status();'
